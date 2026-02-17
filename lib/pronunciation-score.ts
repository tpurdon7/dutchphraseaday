const clamp = (value: number, min: number, max: number): number => {
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
};

export const normalizeSpeechText = (value: string): string => {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ");
};

const levenshteinDistance = (a: string, b: string): number => {
  if (a === b) {
    return 0;
  }

  if (!a.length) {
    return b.length;
  }

  if (!b.length) {
    return a.length;
  }

  const rows = a.length + 1;
  const cols = b.length + 1;
  const matrix: number[][] = Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0));

  for (let i = 0; i < rows; i += 1) {
    matrix[i][0] = i;
  }

  for (let j = 0; j < cols; j += 1) {
    matrix[0][j] = j;
  }

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + substitutionCost
      );
    }
  }

  return matrix[a.length][b.length];
};

const tokenSimilarityScore = (targetTokens: string[], spokenTokens: string[]): number => {
  if (!targetTokens.length && !spokenTokens.length) {
    return 1;
  }

  if (!targetTokens.length || !spokenTokens.length) {
    return 0;
  }

  const counts = new Map<string, number>();
  for (const token of targetTokens) {
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }

  let matches = 0;
  for (const token of spokenTokens) {
    const remaining = counts.get(token) ?? 0;
    if (remaining > 0) {
      matches += 1;
      counts.set(token, remaining - 1);
    }
  }

  const precision = matches / spokenTokens.length;
  const recall = matches / targetTokens.length;
  if (!precision && !recall) {
    return 0;
  }

  return (2 * precision * recall) / (precision + recall);
};

export const scorePronunciationAttempt = (targetText: string, spokenText: string): number => {
  const normalizedTarget = normalizeSpeechText(targetText);
  const normalizedSpoken = normalizeSpeechText(spokenText);

  if (!normalizedTarget || !normalizedSpoken) {
    return 0;
  }

  const distance = levenshteinDistance(normalizedTarget, normalizedSpoken);
  const maxLength = Math.max(normalizedTarget.length, normalizedSpoken.length);
  const charSimilarity = maxLength ? 1 - distance / maxLength : 1;

  const targetTokens = normalizedTarget.split(" ").filter(Boolean);
  const spokenTokens = normalizedSpoken.split(" ").filter(Boolean);
  const tokenScore = tokenSimilarityScore(targetTokens, spokenTokens);
  const lengthPenalty =
    targetTokens.length && spokenTokens.length
      ? Math.min(targetTokens.length, spokenTokens.length) / Math.max(targetTokens.length, spokenTokens.length)
      : 0;

  // Keep original behavior shape but make it stricter.
  const blended = charSimilarity * 0.7 + tokenScore * 0.3;
  const harsherScore = blended * lengthPenalty * 0.9;
  return Math.round(clamp(harsherScore * 100, 0, 100));
};

export const scoreLabel = (score: number): "Excellent" | "Good" | "Close" | "Try again" => {
  if (score >= 93) {
    return "Excellent";
  }
  if (score >= 82) {
    return "Good";
  }
  if (score >= 64) {
    return "Close";
  }
  return "Try again";
};

export const buildMismatchTip = (targetText: string, spokenText: string): string => {
  const targetTokens = normalizeSpeechText(targetText).split(" ").filter(Boolean);
  const spokenTokens = normalizeSpeechText(spokenText).split(" ").filter(Boolean);

  if (!spokenTokens.length) {
    return "Speak a little louder and try again.";
  }

  const length = Math.max(targetTokens.length, spokenTokens.length);
  for (let index = 0; index < length; index += 1) {
    const expected = targetTokens[index];
    const heard = spokenTokens[index];

    if (expected && !heard) {
      return `You may have missed "${expected}".`;
    }

    if (!expected && heard) {
      return `You added an extra word like "${heard}".`;
    }

    if (expected !== heard) {
      return `Try saying "${expected}" instead of "${heard}".`;
    }
  }

  return "Great rhythm. Keep the Dutch sounds crisp.";
};
