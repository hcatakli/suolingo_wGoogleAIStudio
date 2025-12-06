
import { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { DifficultyLevel } from '../types';
import { decodeBase64, decodeAudioData, encodeBase64, float32ToInt16 } from '../utils/audioUtils';

interface UseLiveAvatarProps {
  level: DifficultyLevel;
  systemInstruction: string;
}

export const useLiveAvatar = ({ level, systemInstruction }: UseLiveAvatarProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Refs for audio handling
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const timersRef = useRef<Set<number>>(new Set());
  const stopTalkingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const disconnect = useCallback(() => {
    // Stop microphone stream
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }
    
    // Close audio contexts
    if (inputAudioCtxRef.current) {
        inputAudioCtxRef.current.close();
        inputAudioCtxRef.current = null;
    }
    if (outputAudioCtxRef.current) {
        outputAudioCtxRef.current.close();
        outputAudioCtxRef.current = null;
    }

    // Close session
    sessionPromiseRef.current = null; 

    // Stop playback
    sourcesRef.current.forEach(source => source.stop());
    sourcesRef.current.clear();

    // Clear timers
    timersRef.current.forEach(timer => clearTimeout(timer));
    timersRef.current.clear();
    
    if (stopTalkingTimerRef.current) {
        clearTimeout(stopTalkingTimerRef.current);
        stopTalkingTimerRef.current = null;
    }

    setIsConnected(false);
    setIsTalking(false);
  }, []);

  const connect = useCallback(async () => {
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API Key missing");

      // Setup Audio Contexts
      inputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      nextStartTimeRef.current = 0;

      // Setup Microphone
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const ai = new GoogleGenAI({ apiKey });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            console.log("Live Session Opened");
            setIsConnected(true);

            // Start processing microphone input
            if (!inputAudioCtxRef.current || !streamRef.current) return;
            
            inputSourceRef.current = inputAudioCtxRef.current.createMediaStreamSource(streamRef.current);
            processorRef.current = inputAudioCtxRef.current.createScriptProcessor(4096, 1, 1);
            
            processorRef.current.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              // Convert Float32 to Int16 PCM
              const int16 = float32ToInt16(inputData);
              const pcmData = new Uint8Array(int16.buffer);
              const base64Data = encodeBase64(pcmData);

              sessionPromise.then(session => {
                  session.sendRealtimeInput({
                      media: {
                          mimeType: 'audio/pcm;rate=16000',
                          data: base64Data
                      }
                  });
              });
            };

            inputSourceRef.current.connect(processorRef.current);
            processorRef.current.connect(inputAudioCtxRef.current.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            const { serverContent } = msg;

            // Handle Audio Output
            const audioData = serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData && outputAudioCtxRef.current) {
                const ctx = outputAudioCtxRef.current;
                
                // Ensure next start time is at least current time
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                const startTime = nextStartTimeRef.current;

                const audioBytes = decodeBase64(audioData);
                const buffer = await decodeAudioData(audioBytes, ctx, 24000, 1);
                
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.connect(ctx.destination);
                
                source.onended = () => {
                    sourcesRef.current.delete(source);
                    if (sourcesRef.current.size === 0) {
                        // Debounce stop talking to smooth out gaps between chunks
                        if (stopTalkingTimerRef.current) clearTimeout(stopTalkingTimerRef.current);
                        stopTalkingTimerRef.current = setTimeout(() => {
                            setIsTalking(false);
                        }, 200) as unknown as NodeJS.Timeout;
                    }
                };

                // Schedule visual state change exactly when audio starts
                const delayMs = (startTime - ctx.currentTime) * 1000;
                const timer = setTimeout(() => {
                    // Cancel any pending stop timer when new audio starts
                    if (stopTalkingTimerRef.current) {
                        clearTimeout(stopTalkingTimerRef.current);
                        stopTalkingTimerRef.current = null;
                    }
                    setIsTalking(true);
                    timersRef.current.delete(timer);
                }, delayMs) as unknown as number;
                timersRef.current.add(timer);

                source.start(startTime);
                nextStartTimeRef.current += buffer.duration;
                sourcesRef.current.add(source);
            }

            // Handle Interruption
            if (serverContent?.interrupted) {
                sourcesRef.current.forEach(s => s.stop());
                sourcesRef.current.clear();
                timersRef.current.forEach(timer => clearTimeout(timer));
                timersRef.current.clear();
                if (stopTalkingTimerRef.current) {
                    clearTimeout(stopTalkingTimerRef.current);
                    stopTalkingTimerRef.current = null;
                }
                nextStartTimeRef.current = 0;
                setIsTalking(false);
            }
          },
          onclose: () => {
            console.log("Live Session Closed");
            setIsConnected(false);
          },
          onerror: (err) => {
            console.error("Live Session Error", err);
            setError("Connection error. Please retry.");
            disconnect();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: systemInstruction,
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
          }
        }
      });

      sessionPromiseRef.current = sessionPromise;

    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to connect");
      setIsConnected(false);
    }
  }, [systemInstruction, disconnect]);

  useEffect(() => {
    return () => {
        disconnect();
    };
  }, [disconnect]);

  return { connect, disconnect, isConnected, isTalking, error };
};
