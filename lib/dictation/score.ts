import { normalize } from "@/lib/dictation/normalize";
import type { DictationScoreResult, DictationToken } from "@/lib/dictation/types";

const buildAlignment = (expectedWords: string[], spokenWords: string[]): DictationToken[] => {
  const rows = expectedWords.length + 1;
  const cols = spokenWords.length + 1;
  const dp: number[][] = Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0));
  const back: ("diag" | "up" | "left")[][] = Array.from({ length: rows }, () => Array.from({ length: cols }, () => "diag"));

  for (let i = 1; i < rows; i += 1) {
    dp[i][0] = i;
    back[i][0] = "up";
  }
  for (let j = 1; j < cols; j += 1) {
    dp[0][j] = j;
    back[0][j] = "left";
  }

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const same = expectedWords[i - 1] === spokenWords[j - 1];
      const replaceCost = dp[i - 1][j - 1] + (same ? 0 : 1);
      const deleteCost = dp[i - 1][j] + 1;
      const insertCost = dp[i][j - 1] + 1;
      const best = Math.min(replaceCost, deleteCost, insertCost);

      dp[i][j] = best;
      if (best === replaceCost) {
        back[i][j] = "diag";
      } else if (best === deleteCost) {
        back[i][j] = "up";
      } else {
        back[i][j] = "left";
      }
    }
  }

  const tokens: DictationToken[] = [];
  let i = expectedWords.length;
  let j = spokenWords.length;

  while (i > 0 || j > 0) {
    const move = back[i][j];
    if (i > 0 && j > 0 && move === "diag") {
      const expected = expectedWords[i - 1];
      const word = spokenWords[j - 1];
      tokens.push({
        expected,
        word,
        status: expected === word ? "correct" : "wrong"
      });
      i -= 1;
      j -= 1;
      continue;
    }

    if (i > 0 && (j === 0 || move === "up")) {
      tokens.push({
        expected: expectedWords[i - 1],
        word: "",
        status: "missing"
      });
      i -= 1;
      continue;
    }

    if (j > 0) {
      tokens.push({
        expected: "",
        word: spokenWords[j - 1],
        status: "extra"
      });
      j -= 1;
    }
  }

  return tokens.reverse();
};

export const scoreDictation = (expected: string, spoken: string): DictationScoreResult => {
  const normalizedExpected = normalize(expected);
  const normalizedSpoken = normalize(spoken);

  const expectedWords = normalizedExpected ? normalizedExpected.split(" ") : [];
  const spokenWords = normalizedSpoken ? normalizedSpoken.split(" ") : [];
  const tokens = buildAlignment(expectedWords, spokenWords);
  const correctWords = tokens.filter((token) => token.status === "correct").length;
  const expectedCount = expectedWords.length || 1;
  const score = Math.round((correctWords / expectedCount) * 100);

  return { score, tokens };
};
