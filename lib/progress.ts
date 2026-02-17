import { PHRASE_COUNT } from "@/data/phrases";
import { daysBetweenLocalDates, parseDateKeyToLocalDate } from "@/lib/date";

export const clamp = (value: number, min: number, max: number): number => {
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
};

export const getDayNumber = (startDateKey: string, now = new Date()): number => {
  const startDate = parseDateKeyToLocalDate(startDateKey);

  if (!startDate) {
    return 1;
  }

  const diff = daysBetweenLocalDates(startDate, now);
  return clamp(diff + 1, 1, PHRASE_COUNT);
};

export const getPhraseIdForDay = (dayNumber: number): number => {
  return clamp(dayNumber, 1, PHRASE_COUNT);
};

export const getProgressPercent = (learnedCount: number): number => {
  const raw = (learnedCount / PHRASE_COUNT) * 100;
  return Math.round(raw * 10) / 10;
};
