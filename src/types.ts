export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  imageUrl?: string; // Base64 encoded image or URL
  lastReviewed?: Date;
  correctCount?: number;
  incorrectCount?: number;
}

export interface FlashcardDeck {
  id: string;
  name: string;
  description?: string;
  cards: Flashcard[];
  createdAt: Date;
  lastStudied?: Date;
  totalStudyTime?: number; // in minutes
  tags?: string[];
}

export interface StudySession {
  deckId: string;
  startTime: Date;
  endTime?: Date;
  correctAnswers: number;
  totalQuestions: number;
  cardsStudied: string[]; // card IDs
}

export interface AppState {
  decks: FlashcardDeck[];
  currentDeckId?: string;
  studyMode: boolean;
  currentCardIndex: number;
  showAnswer: boolean;
  studySession?: StudySession;
}

export type ViewMode = 'deck-list' | 'study' | 'create' | 'import';

export interface FileUploadResult {
  success: boolean;
  cards?: Flashcard[];
  error?: string;
  fileName?: string;
}
