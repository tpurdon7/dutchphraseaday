import type { LearnedDay } from "@/lib/types";

export type ProgressPayload = {
  startDateKey: string;
  learnedDays: LearnedDay[];
  typedAttemptsByDate: Record<string, number>;
  dailyCheckInByDate: Record<string, boolean>;
};

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const normalizeLearnedDays = (value: unknown): LearnedDay[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const rows: LearnedDay[] = [];
  for (const row of value) {
    if (!isObject(row)) {
      continue;
    }

    const dateKey = typeof row.dateKey === "string" && DATE_KEY_RE.test(row.dateKey) ? row.dateKey : null;
    const phraseId = typeof row.phraseId === "number" && Number.isFinite(row.phraseId) ? Math.floor(row.phraseId) : null;
    if (!dateKey || phraseId === null) {
      continue;
    }

    const learnedAt =
      typeof row.learnedAt === "string" && !Number.isNaN(Date.parse(row.learnedAt))
        ? row.learnedAt
        : `${dateKey}T00:00:00.000Z`;

    const bestScore =
      typeof row.bestScore === "number" && Number.isFinite(row.bestScore) && row.bestScore >= 0 && row.bestScore <= 100
        ? Math.round(row.bestScore)
        : undefined;

    const lastTranscript = typeof row.lastTranscript === "string" ? row.lastTranscript : undefined;

    rows.push({ dateKey, phraseId, learnedAt, bestScore, lastTranscript });
  }

  return rows;
};

const normalizeTypedAttempts = (value: unknown): Record<string, number> => {
  if (!isObject(value)) {
    return {};
  }

  const next: Record<string, number> = {};
  for (const [key, raw] of Object.entries(value)) {
    if (!DATE_KEY_RE.test(key) || typeof raw !== "number" || !Number.isFinite(raw)) {
      continue;
    }
    next[key] = Math.max(0, Math.floor(raw));
  }
  return next;
};

const normalizeDailyCheckIn = (value: unknown): Record<string, boolean> => {
  if (!isObject(value)) {
    return {};
  }

  const next: Record<string, boolean> = {};
  for (const [key, raw] of Object.entries(value)) {
    if (DATE_KEY_RE.test(key) && raw === true) {
      next[key] = true;
    }
  }
  return next;
};

export const normalizeProgressPayload = (value: unknown): ProgressPayload | null => {
  if (!isObject(value)) {
    return null;
  }

  const startDateKey = typeof value.startDateKey === "string" && DATE_KEY_RE.test(value.startDateKey) ? value.startDateKey : null;
  if (!startDateKey) {
    return null;
  }

  return {
    startDateKey,
    learnedDays: normalizeLearnedDays(value.learnedDays),
    typedAttemptsByDate: normalizeTypedAttempts(value.typedAttemptsByDate),
    dailyCheckInByDate: normalizeDailyCheckIn(value.dailyCheckInByDate)
  };
};
