import { getLocalDateKey } from "@/lib/date";
import type { LearnedDay } from "@/lib/types";

const START_DATE_KEY = "dutchPhraseStartDate";
const LEARNED_DAYS_KEY = "learnedDays";
const TYPED_ATTEMPTS_BY_DATE_KEY = "typedAttemptsByDate";
const DAILY_CHECKIN_BY_DATE_KEY = "dailyCheckInByDate";

const isFiniteNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

const normalizeLearnedDay = (value: unknown): LearnedDay | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<LearnedDay>;
  if (typeof candidate.dateKey !== "string" || !isFiniteNumber(candidate.phraseId)) {
    return null;
  }

  const learnedAt =
    typeof candidate.learnedAt === "string" && !Number.isNaN(Date.parse(candidate.learnedAt))
      ? candidate.learnedAt
      : `${candidate.dateKey}T00:00:00`;

  const bestScore =
    isFiniteNumber(candidate.bestScore) && candidate.bestScore >= 0 && candidate.bestScore <= 100
      ? Math.round(candidate.bestScore)
      : undefined;

  const lastTranscript = typeof candidate.lastTranscript === "string" ? candidate.lastTranscript : undefined;

  return {
    dateKey: candidate.dateKey,
    phraseId: candidate.phraseId,
    learnedAt,
    bestScore,
    lastTranscript
  };
};

export const getOrCreateStartDateKey = (): string => {
  const existing = localStorage.getItem(START_DATE_KEY);
  if (existing) {
    return existing;
  }

  const today = getLocalDateKey();
  localStorage.setItem(START_DATE_KEY, today);
  return today;
};

export const getStartDateKey = (): string | null => {
  const existing = localStorage.getItem(START_DATE_KEY);
  return existing || null;
};

export const setStartDateKey = (value: string): void => {
  localStorage.setItem(START_DATE_KEY, value);
};

export const getLearnedDays = (): LearnedDay[] => {
  const raw = localStorage.getItem(LEARNED_DAYS_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    const valid = parsed.map(normalizeLearnedDay).filter((item): item is LearnedDay => item !== null);

    const dedupByPhraseId = new Map<number, LearnedDay>();
    for (const item of valid) {
      const existing = dedupByPhraseId.get(item.phraseId);
      if (!existing || Date.parse(item.learnedAt) >= Date.parse(existing.learnedAt)) {
        dedupByPhraseId.set(item.phraseId, item);
      }
    }

    return [...dedupByPhraseId.values()];
  } catch {
    return [];
  }
};

export const setLearnedDays = (value: LearnedDay[]): void => {
  localStorage.setItem(LEARNED_DAYS_KEY, JSON.stringify(value));
};

export const getTypedAttemptsByDate = (): Record<string, number> => {
  const raw = localStorage.getItem(TYPED_ATTEMPTS_BY_DATE_KEY);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    const attemptsByDate: Record<string, number> = {};
    for (const [dateKey, value] of Object.entries(parsed)) {
      if (typeof dateKey !== "string" || !isFiniteNumber(value)) {
        continue;
      }
      attemptsByDate[dateKey] = Math.max(0, Math.floor(value));
    }

    return attemptsByDate;
  } catch {
    return {};
  }
};

export const setTypedAttemptsByDate = (value: Record<string, number>): void => {
  localStorage.setItem(TYPED_ATTEMPTS_BY_DATE_KEY, JSON.stringify(value));
};

export const getDailyCheckInByDate = (): Record<string, boolean> => {
  const raw = localStorage.getItem(DAILY_CHECKIN_BY_DATE_KEY);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    const checkInByDate: Record<string, boolean> = {};
    for (const [dateKey, value] of Object.entries(parsed)) {
      if (typeof dateKey === "string" && value === true) {
        checkInByDate[dateKey] = true;
      }
    }

    return checkInByDate;
  } catch {
    return {};
  }
};

export const setDailyCheckInByDate = (value: Record<string, boolean>): void => {
  localStorage.setItem(DAILY_CHECKIN_BY_DATE_KEY, JSON.stringify(value));
};

export const resetProgress = (): void => {
  localStorage.removeItem(LEARNED_DAYS_KEY);
  localStorage.removeItem(START_DATE_KEY);
  localStorage.removeItem(TYPED_ATTEMPTS_BY_DATE_KEY);
  localStorage.removeItem(DAILY_CHECKIN_BY_DATE_KEY);
};
