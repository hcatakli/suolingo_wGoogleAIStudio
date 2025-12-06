import React, { useState, useEffect, useRef } from 'react';
import { DifficultyLevel, VocabularyWord, PronunciationResult } from '../types';
import { generateVocabulary, playTextToSpeech, assessPronunciation } from '../services/geminiService';
import { blobToBase64 } from '../utils/audioUtils';

interface VocabularyPracticeProps {
  level: DifficultyLevel;
}

const VocabularyPractice: React.FC<VocabularyPracticeProps> = ({ level }) => {
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [result, setResult] = useState<PronunciationResult | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Load words on mount or level change
  useEffect(() => {
    loadWords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  const loadWords = async () => {
    setIsLoading(true);
    setResult(null);
    setCurrentIndex(0);
    try {
      const newWords = await generateVocabulary(level);
      setWords(newWords);
    } catch (e) {
      console.error("Failed to load words", e);
    } finally {
      setIsLoading(false);
    }
  };

  const currentWord = words[currentIndex];

  const handleListen = () => {
    if (isPlayingTTS || !currentWord) return;
    setIsPlayingTTS(true);
    playTextToSpeech(currentWord.word, () => setIsPlayingTTS(false));
  };

  const startRecording = async () => {
    try {
      setResult(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Request audio/webm;codecs=opus if supported, otherwise default
      const options = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? { mimeType: 'audio/webm;codecs=opus' } 
        : undefined;

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start recording", err);
      alert("Microphone permission denied or not available.");
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current || !isRecording) return;

    mediaRecorderRef.current.onstop = async () => {
        // Stop all tracks to release microphone immediately
        if (mediaRecorderRef.current?.stream) {
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }

        const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        
        setIsLoading(true);
        try {
            const base64Audio = await blobToBase64(audioBlob);
            const assessment = await assessPronunciation(currentWord.word, base64Audio, mimeType);
            setResult(assessment);
        } catch (error) {
            console.error("Assessment failed", error);
            setResult({
                score: 0,
                transcription: "",
                feedback: "Failed to analyze audio. Please try again."
            });
        } finally {
            setIsLoading(false);
        }
    };

    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  const nextWord = () => {
    setResult(null);
    if (currentIndex < words.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      loadWords(); // Load new set
    }
  };

  if (isLoading && words.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent mb-4"></div>
        <p>Generating vocabulary for {level}...</p>
      </div>
    );
  }

  if (words.length === 0) {
     return <div className="text-center p-10 text-red-500">Failed to load words. Please refresh.</div>
  }

  return (
    <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-lg p-8 transition-all">
      <div className="text-center mb-8">
        <h2 className="text-sm font-bold text-blue-500 tracking-widest uppercase mb-2">Word {currentIndex + 1} of {words.length}</h2>
        <h1 className="text-5xl font-extrabold text-gray-800 mb-4">{currentWord.word}</h1>
        <p className="text-gray-500 italic mb-2">{currentWord.definition}</p>
        <p className="text-gray-400 text-sm">"{currentWord.example}"</p>
      </div>

      <div className="flex justify-center space-x-6 mb-8">
        {/* Listen Button */}
        <button 
          onClick={handleListen}
          disabled={isPlayingTTS || isRecording}
          className={`flex flex-col items-center justify-center w-20 h-20 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors ${isPlayingTTS ? 'ring-2 ring-blue-400' : ''}`}
        >
           <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
           <span className="text-xs font-semibold">Listen</span>
        </button>

        {/* Record Button */}
        <button 
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onTouchStart={startRecording}
          onTouchEnd={stopRecording}
          disabled={isPlayingTTS || (isLoading && !isRecording)}
          className={`flex flex-col items-center justify-center w-24 h-24 rounded-full transition-all transform hover:scale-105 active:scale-95 shadow-lg ${isRecording ? 'bg-red-500 text-white ring-4 ring-red-200' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            <span className="text-xs font-semibold">{isRecording ? "Release" : "Hold"}</span>
        </button>
      </div>

      {isLoading && !isRecording && <div className="text-center text-gray-400 mb-6">Analyzing pronunciation with Gemini...</div>}

      {result && (
        <div className={`rounded-xl p-6 mb-8 text-center border-l-8 ${result.score > 80 ? 'bg-green-50 border-green-500' : result.score > 50 ? 'bg-yellow-50 border-yellow-500' : 'bg-red-50 border-red-500'}`}>
           <div className="text-4xl font-bold mb-2" style={{color: result.score > 80 ? '#22c55e' : result.score > 50 ? '#eab308' : '#ef4444'}}>
             {result.score} <span className="text-lg text-gray-500 font-normal">/ 100</span>
           </div>
           <p className="text-gray-700 font-medium mb-1"> Heard: "{result.transcription}"</p>
           <p className="text-sm text-gray-600">{result.feedback}</p>
        </div>
      )}

      <button 
        onClick={nextWord}
        className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors"
      >
        {currentIndex < words.length - 1 ? "Next Word" : "Load New Words"}
      </button>
    </div>
  );
};

export default VocabularyPractice;