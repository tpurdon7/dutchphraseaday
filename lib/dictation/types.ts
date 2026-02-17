export type DictationTokenStatus = "correct" | "wrong" | "missing" | "extra";

export type DictationToken = {
  word: string;
  expected: string;
  status: DictationTokenStatus;
};

export type DictationScoreResult = {
  score: number;
  tokens: DictationToken[];
};
