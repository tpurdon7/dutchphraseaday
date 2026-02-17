import { phrases } from "@/data/phrases";

const STOPWORDS = new Set([
  "de",
  "het",
  "een",
  "en",
  "ik",
  "je",
  "jij",
  "u",
  "wij",
  "we",
  "hij",
  "zij",
  "ze",
  "dit",
  "dat",
  "is",
  "ben",
  "met",
  "naar",
  "voor",
  "van",
  "te",
  "in",
  "op",
  "als",
  "maar"
]);

const DISTRACTOR_FALLBACK = ["morgen", "station", "rekening", "vriendelijk", "langzamer", "kaart"];

const WORD_RE = /[A-Za-zÀ-ÖØ-öø-ÿ']+/g;

const normalizeWord = (value: string): string => value.toLowerCase();

const tokenize = (text: string): string[] => {
  const matches = text.match(WORD_RE);
  return matches ?? [];
};

const scoreCandidate = (word: string): number => {
  const lower = normalizeWord(word);
  if (STOPWORDS.has(lower)) {
    return -1;
  }
  if (word.length < 4) {
    return 0;
  }
  return word.length;
};

const getMaskedText = (phrase: string, answer: string): string => {
  let replaced = false;
  return phrase.replace(WORD_RE, (token) => {
    if (!replaced && normalizeWord(token) === normalizeWord(answer)) {
      replaced = true;
      return "___";
    }
    return token;
  });
};

const buildDistractorPool = (): string[] => {
  const unique = new Map<string, string>();
  for (const phrase of phrases) {
    for (const token of tokenize(phrase.dutch)) {
      const lower = normalizeWord(token);
      if (STOPWORDS.has(lower) || token.length < 4) {
        continue;
      }
      if (!unique.has(lower)) {
        unique.set(lower, token);
      }
    }
  }
  for (const fallback of DISTRACTOR_FALLBACK) {
    const lower = normalizeWord(fallback);
    if (!unique.has(lower)) {
      unique.set(lower, fallback);
    }
  }
  return [...unique.values()];
};

const DISTRACTOR_POOL = buildDistractorPool();

const seededSort = (items: string[], seed: number): string[] => {
  return [...items].sort((a, b) => {
    const aScore = (a.length * 31 + seed) % 97;
    const bScore = (b.length * 31 + seed) % 97;
    if (aScore === bScore) {
      return a.localeCompare(b);
    }
    return aScore - bScore;
  });
};

const computeSeed = (value: string): number => {
  let seed = 0;
  for (const char of value) {
    seed = (seed * 33 + char.charCodeAt(0)) % 100000;
  }
  return seed;
};

export type DailyClozeExercise = {
  maskedPhrase: string;
  answer: string;
  options: string[];
};

export const buildDailyClozeExercise = (phrase: string): DailyClozeExercise => {
  const tokens = tokenize(phrase);
  const candidates = [...tokens]
    .sort((a, b) => scoreCandidate(b) - scoreCandidate(a))
    .filter((token, index, list) => scoreCandidate(token) > 0 && list.findIndex((item) => normalizeWord(item) === normalizeWord(token)) === index);

  const answer = candidates[0] ?? tokens.find((token) => token.length >= 3) ?? "woord";
  const answerLower = normalizeWord(answer);

  const distractors = DISTRACTOR_POOL.filter((item) => {
    const lower = normalizeWord(item);
    return lower !== answerLower && Math.abs(item.length - answer.length) <= 4;
  }).slice(0, 12);

  const seed = computeSeed(phrase);
  const rankedDistractors = seededSort(distractors, seed);
  const pickedDistractors = rankedDistractors.slice(0, 2);

  while (pickedDistractors.length < 2) {
    const next = DISTRACTOR_FALLBACK.find((item) => {
      const lower = normalizeWord(item);
      return lower !== answerLower && !pickedDistractors.some((value) => normalizeWord(value) === lower);
    });

    if (!next) {
      break;
    }
    pickedDistractors.push(next);
  }

  const options = seededSort([answer, ...pickedDistractors], seed + 17);

  return {
    maskedPhrase: getMaskedText(phrase, answer),
    answer,
    options
  };
};
