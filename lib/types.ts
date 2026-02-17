export type Phrase = {
  id: number;
  dutch: string;
  english: string;
  pronunciation: string;
  example?: {
    dutch: string;
    english: string;
  };
};

export type LearnedDay = {
  dateKey: string;
  phraseId: number;
  learnedAt: string;
  bestScore?: number;
  lastTranscript?: string;
  source?: "daily" | "learn_more";
};

export type PracticeRecord = {
  dateKey: string;
  attemptsUsed: number;
  bestScore: number;
  lastTranscript: string;
  updatedAt: string;
};
