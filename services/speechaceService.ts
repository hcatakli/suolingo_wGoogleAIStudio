import { PronunciationResult } from '../types';

// The key provided (URL encoded)
const API_KEY = "WpqFO81DmJG9QCbT2dFnmcEM%2BePPBkO1YqGq7gdAf9ZRjBeTZHP%2Fprwsi0s2lW9W3GxW14r0HMbeXURU5B8Y37V%2BESl1jL7R%2F01A5qcKPS9JbotMNUWKBwzVj3m4RouW";

export const assessPronunciation = async (
  targetWord: string, 
  audioBlob: Blob
): Promise<PronunciationResult> => {
  // Using api5.speechace.com as requested
  const url = `https://api5.speechace.com/api/scoring/text/v9/json?key=${API_KEY}&dialect=en-us&user_id=XYZ-ABC-99001`;
  
  const formData = new FormData();
  formData.append("text", targetWord);
  // formData.append("question_info", "'u1/q1'"); // Removed to match Postman snippet
  // formData.append("no_mc", "1"); // Removed to match Postman snippet
  
  // Append audio file with specific filename "audio.wav"
  formData.append("user_audio_file", audioBlob, "audio.wav");

  const requestOptions: RequestInit = {
    method: "POST",
    body: formData,
    redirect: "follow"
  };

  try {
    const response = await fetch(url, requestOptions);

    if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown Error");
        console.error("SpeechAce API Error Response:", errorText);
        throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log("SpeechAce result:", result);

    if (result.status === "error") {
        throw new Error(result.detail_message || "Unknown API Error");
    }

    const wordScores = result.text_score?.word_score_list || [];
    
    // Calculate average score based on individual word quality scores
    const averageScore =
      wordScores.length > 0
        ? Math.round(
            wordScores.reduce(
              (sum: number, w: any) => sum + (w.quality_score || 0),
              0
            ) / wordScores.length
          )
        : 0;

    let feedback = "Try again.";
    if (averageScore >= 85) {
        feedback = "Excellent pronunciation!";
    } else if (averageScore >= 70) {
        feedback = "Good job! Clear pronunciation.";
    } else {
        feedback = "Keep practicing.";
    }

    return {
      score: averageScore,
      transcription: result.text_score?.text || targetWord,
      feedback: feedback
    };

  } catch (error: any) {
    console.error("Assessment Error", error);
    
    return {
      score: 0,
      transcription: "",
      feedback: `Error: ${error.message}`
    };
  }
};