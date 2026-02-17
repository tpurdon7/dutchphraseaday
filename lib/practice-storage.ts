import type { PracticeRecord } from "@/lib/types";

const PRACTICE_KEY = "practiceByDate";

type PracticeStore = Record<string, PracticeRecord>;

const isPracticeRecord = (value: unknown): value is PracticeRecord => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as PracticeRecord;
  return (
    typeof record.dateKey === "string" &&
    typeof record.attemptsUsed === "number" &&
    typeof record.bestScore === "number" &&
    typeof record.lastTranscript === "string" &&
    typeof record.updatedAt === "string"
  );
};

export const getPracticeStore = (): PracticeStore => {
  if (typeof window === "undefined") {
    return {};
  }

  const raw = localStorage.getItem(PRACTICE_KEY);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return {};
    }

    const entries = Object.entries(parsed as Record<string, unknown>).filter((entry): entry is [string, PracticeRecord] => {
      return isPracticeRecord(entry[1]);
    });

    return Object.fromEntries(entries);
  } catch {
    return {};
  }
};

export const getPracticeForDate = (dateKey: string): PracticeRecord | null => {
  const store = getPracticeStore();
  return store[dateKey] ?? null;
};

export const setPracticeForDate = (record: PracticeRecord): void => {
  if (typeof window === "undefined") {
    return;
  }

  const store = getPracticeStore();
  store[record.dateKey] = record;
  localStorage.setItem(PRACTICE_KEY, JSON.stringify(store));
};
