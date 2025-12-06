import { GoogleGenAI, Type, Modality } from "@google/genai";
import { DifficultyLevel, VocabularyWord, PronunciationResult } from "../types";
import { decodeBase64, decodeAudioData } from "../utils/audioUtils";

// Initialize Gemini Client
const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY not found in environment");
  return new GoogleGenAI({ apiKey });
};

// 1. Generate Avatar Image
export const generateAvatarImage = async (prompt: string): Promise<string> => {
  const ai = getClient();
  // Using gemini-2.5-flash-image for avatar generation
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
        parts: [{ text: `A friendly, stylized cartoon 3D avatar of an English tutor. ${prompt}. Solid color background.` }]
    },
    config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
};

// 2. Generate Vocabulary List
export const generateVocabulary = async (level: DifficultyLevel): Promise<VocabularyWord[]> => {
  const ai = getClient();
  const prompt = `Generate 5 random English vocabulary words suitable for ${level} level learners. 
  Return a JSON array where each object has "word", "definition" (simple English), and "example" (sentence).`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING },
            definition: { type: Type.STRING },
            example: { type: Type.STRING }
          },
          required: ["word", "definition", "example"]
        }
      }
    }
  });

  return JSON.parse(response.text || "[]");
};

// 3. Text to Speech
export const playTextToSpeech = async (text: string, onAudioEnd: () => void) => {
  try {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say clearly: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // Kore, Puck, Charon, Fenrir, Zephyr
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio returned");

    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const audioBytes = decodeBase64(base64Audio);
    const audioBuffer = await decodeAudioData(audioBytes, audioCtx, 24000, 1);
    
    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioCtx.destination);
    source.onended = () => {
        onAudioEnd();
        audioCtx.close();
    };
    source.start();

  } catch (e) {
    console.error("TTS Error", e);
    onAudioEnd();
  }
};

// 4. Assess Pronunciation (using Gemini instead of external API)
export const assessPronunciation = async (targetWord: string, base64Audio: string, mimeType: string = 'audio/webm'): Promise<PronunciationResult> => {
  const ai = getClient();
  const prompt = `You are an English pronunciation coach. The user is trying to pronounce the word "${targetWord}".
  Listen to the provided audio.
  1. Transcribe strictly what you heard (even if it sounds like a different word or nonsense).
  2. Rate the pronunciation on a scale from 0 to 100.
     - 90-100: Perfect or near-native.
     - 70-89: Clear and understandable.
     - 50-69: Understandable but with noticeable accent or minor errors.
     - 0-49: Incorrect, hard to understand, or wrong word.
  3. Provide brief, constructive feedback (max 1 sentence).
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Audio
          }
        },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          transcription: { type: Type.STRING },
          feedback: { type: Type.STRING }
        },
        required: ["score", "transcription", "feedback"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No analysis returned");
  
  return JSON.parse(text);
};
