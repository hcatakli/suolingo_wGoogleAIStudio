export enum DifficultyLevel {
  A1 = 'A1 (Beginner)',
  A2 = 'A2 (Elementary)',
  B1 = 'B1 (Intermediate)',
  B2 = 'B2 (Upper Intermediate)',
  C1 = 'C1 (Advanced)'
}

export enum AppMode {
  HOME = 'HOME',
  VOCABULARY = 'VOCABULARY',
  CONVERSATION = 'CONVERSATION'
}

export interface VocabularyWord {
  word: string;
  definition: string;
  example: string;
}

export interface PronunciationResult {
  score: number;
  transcription: string;
  feedback: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
