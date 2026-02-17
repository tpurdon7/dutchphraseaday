const pad = (value: number) => value.toString().padStart(2, "0");

export const getLocalDateKey = (date = new Date()): string => {
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  return `${y}-${m}-${d}`;
};

const toLocalMidnight = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const daysBetweenLocalDates = (start: Date, end: Date): number => {
  const startMidnight = toLocalMidnight(start).getTime();
  const endMidnight = toLocalMidnight(end).getTime();
  return Math.floor((endMidnight - startMidnight) / 86_400_000);
};

export const parseDateKeyToLocalDate = (dateKey: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) {
    return null;
  }

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));

  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day)
  ) {
    return null;
  }

  return date;
};
