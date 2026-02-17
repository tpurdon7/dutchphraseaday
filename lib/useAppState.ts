"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PHRASE_COUNT, phraseById } from "@/data/phrases";
import { daysBetweenLocalDates, getLocalDateKey, parseDateKeyToLocalDate } from "@/lib/date";
import { getDayNumber, getPhraseIdForDay, getProgressPercent } from "@/lib/progress";
import {
  getDailyCheckInByDate,
  getLearnedDays,
  getOrCreateStartDateKey,
  getStartDateKey,
  getTypedAttemptsByDate,
  resetProgress,
  setDailyCheckInByDate,
  setLearnedDays,
  setStartDateKey,
  setTypedAttemptsByDate
} from "@/lib/storage";
import type { LearnedDay, Phrase } from "@/lib/types";

const XP_PER_TYPED_ATTEMPT = 15;
const XP_PER_LEARNED_DAY = 100;
const XP_PER_LEVEL = 250;
const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

const sumTypedAttempts = (value: Record<string, number>): number =>
  Object.values(value).reduce((acc, count) => acc + Math.max(0, count || 0), 0);

const computeCurrentStreak = (learnedDateKeys: Set<string>, todayKey: string): number => {
  const today = parseDateKeyToLocalDate(todayKey);
  if (!today) {
    return 0;
  }

  let streak = 0;
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  while (learnedDateKeys.has(getLocalDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};

const computeLongestStreak = (learnedDays: LearnedDay[]): number => {
  if (!learnedDays.length) {
    return 0;
  }

  const dates = learnedDays
    .map((entry) => parseDateKeyToLocalDate(entry.dateKey))
    .filter((date): date is Date => Boolean(date))
    .sort((a, b) => a.getTime() - b.getTime());

  if (!dates.length) {
    return 0;
  }

  let longest = 1;
  let run = 1;
  for (let i = 1; i < dates.length; i += 1) {
    const diff = daysBetweenLocalDates(dates[i - 1], dates[i]);
    if (diff === 1) {
      run += 1;
      longest = Math.max(longest, run);
    } else if (diff > 1) {
      run = 1;
    }
  }

  return longest;
};

type ProgressPayload = {
  startDateKey: string;
  learnedDays: LearnedDay[];
  typedAttemptsByDate: Record<string, number>;
  dailyCheckInByDate: Record<string, boolean>;
};

const normalizeRemoteProgress = (value: unknown): ProgressPayload | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const source = value as Record<string, unknown>;
  const startDateKey =
    typeof source.startDateKey === "string" && DATE_KEY_RE.test(source.startDateKey) ? source.startDateKey : null;
  if (!startDateKey) {
    return null;
  }

  const learnedDays: LearnedDay[] = [];
  if (Array.isArray(source.learnedDays)) {
    for (const row of source.learnedDays) {
      if (!row || typeof row !== "object" || Array.isArray(row)) {
        continue;
      }
      const item = row as Record<string, unknown>;
      const dateKey = typeof item.dateKey === "string" && DATE_KEY_RE.test(item.dateKey) ? item.dateKey : null;
      const phraseId = typeof item.phraseId === "number" && Number.isFinite(item.phraseId) ? Math.floor(item.phraseId) : null;
      if (!dateKey || phraseId === null) {
        continue;
      }
      learnedDays.push({
        dateKey,
        phraseId,
        learnedAt:
          typeof item.learnedAt === "string" && !Number.isNaN(Date.parse(item.learnedAt))
            ? item.learnedAt
            : `${dateKey}T00:00:00.000Z`,
        bestScore:
          typeof item.bestScore === "number" &&
          Number.isFinite(item.bestScore) &&
          item.bestScore >= 0 &&
          item.bestScore <= 100
            ? Math.round(item.bestScore)
            : undefined,
        lastTranscript: typeof item.lastTranscript === "string" ? item.lastTranscript : undefined
      });
    }
  }

  const typedAttemptsByDate: Record<string, number> = {};
  if (source.typedAttemptsByDate && typeof source.typedAttemptsByDate === "object" && !Array.isArray(source.typedAttemptsByDate)) {
    for (const [key, raw] of Object.entries(source.typedAttemptsByDate)) {
      if (DATE_KEY_RE.test(key) && typeof raw === "number" && Number.isFinite(raw)) {
        typedAttemptsByDate[key] = Math.max(0, Math.floor(raw));
      }
    }
  }

  const dailyCheckInByDate: Record<string, boolean> = {};
  if (source.dailyCheckInByDate && typeof source.dailyCheckInByDate === "object" && !Array.isArray(source.dailyCheckInByDate)) {
    for (const [key, raw] of Object.entries(source.dailyCheckInByDate)) {
      if (DATE_KEY_RE.test(key) && raw === true) {
        dailyCheckInByDate[key] = true;
      }
    }
  }

  return { startDateKey, learnedDays, typedAttemptsByDate, dailyCheckInByDate };
};

type AppState = {
  hydrated: boolean;
  todayKey: string;
  dayNumber: number;
  phrase: Phrase | null;
  learnedDays: LearnedDay[];
  todayBestScore?: number;
  todayCheckInCompleted: boolean;
  totalTypedAttempts: number;
  currentStreak: number;
  longestStreak: number;
  totalXp: number;
  level: number;
  xpIntoLevel: number;
  xpToNextLevel: number;
  reviewPhraseIds: number[];
  progressPercent: number;
  todayCompleted: boolean;
  canLearnToday: boolean;
  completeTodayCheckIn: () => void;
  markTodayLearned: () => Promise<void>;
  saveTodaySpeechAttempt: (score: number, transcript: string) => void;
  clearAllProgress: () => void;
};

export const useAppState = (): AppState => {
  const syncTimerRef = useRef<number | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [todayKey, setTodayKey] = useState("");
  const [dayNumber, setDayNumber] = useState(1);
  const [learnedDays, setLearnedDaysState] = useState<LearnedDay[]>([]);
  const [typedAttemptsByDate, setTypedAttemptsByDateState] = useState<Record<string, number>>({});
  const [dailyCheckInByDate, setDailyCheckInByDateState] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const nowKey = getLocalDateKey();
    const startDateKey = getOrCreateStartDateKey();
    const storedLearnedDays = getLearnedDays();
    const storedTypedAttempts = getTypedAttemptsByDate();
    const storedDailyCheckIn = getDailyCheckInByDate();
    const computedDay = getDayNumber(startDateKey, new Date());

    setTodayKey(nowKey);
    setDayNumber(computedDay);
    setLearnedDaysState(storedLearnedDays);
    setTypedAttemptsByDateState(storedTypedAttempts);
    setDailyCheckInByDateState(storedDailyCheckIn);
    setHydrated(true);
  }, []);

  const scheduleRemoteSync = useCallback((payload: ProgressPayload) => {
    if (typeof window === "undefined") {
      return;
    }

    if (syncTimerRef.current !== null) {
      window.clearTimeout(syncTimerRef.current);
    }

    syncTimerRef.current = window.setTimeout(() => {
      void fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).catch(() => {
        // Keep local state authoritative on network/auth errors.
      });
    }, 700);
  }, []);

  useEffect(() => {
    return () => {
      if (syncTimerRef.current !== null) {
        window.clearTimeout(syncTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    let cancelled = false;

    const hydrateFromRemote = async () => {
      try {
        const response = await fetch("/api/progress", { cache: "no-store" });
        if (!response.ok) {
          return;
        }

        const body = (await response.json()) as { progress?: unknown };
        if (body.progress === null) {
          const localPayload: ProgressPayload = {
            startDateKey: getStartDateKey() ?? getOrCreateStartDateKey(),
            learnedDays: getLearnedDays(),
            typedAttemptsByDate: getTypedAttemptsByDate(),
            dailyCheckInByDate: getDailyCheckInByDate()
          };

          await fetch("/api/progress", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(localPayload)
          }).catch(() => {
            // Keep local fallback if first-time sync fails.
          });
          return;
        }

        const remote = normalizeRemoteProgress(body.progress);
        if (!remote || cancelled) {
          return;
        }

        setStartDateKey(remote.startDateKey);
        setLearnedDays(remote.learnedDays);
        setTypedAttemptsByDate(remote.typedAttemptsByDate);
        setDailyCheckInByDate(remote.dailyCheckInByDate);

        setLearnedDaysState(remote.learnedDays);
        setTypedAttemptsByDateState(remote.typedAttemptsByDate);
        setDailyCheckInByDateState(remote.dailyCheckInByDate);

        const nowKey = getLocalDateKey();
        setTodayKey(nowKey);
        setDayNumber(getDayNumber(remote.startDateKey, new Date()));
      } catch {
        // Signed-out users and network failures continue with local fallback.
      }
    };

    void hydrateFromRemote();
    return () => {
      cancelled = true;
    };
  }, [hydrated]);

  const phraseId = useMemo(() => getPhraseIdForDay(dayNumber), [dayNumber]);
  const phrase = useMemo(() => phraseById.get(phraseId) ?? null, [phraseId]);
  const todayEntry = useMemo(() => learnedDays.find((entry) => entry.dateKey === todayKey), [learnedDays, todayKey]);
  const todayCompleted = Boolean(todayEntry);
  const todayCheckInCompleted = dailyCheckInByDate[todayKey] === true;
  const totalTypedAttempts = useMemo(() => sumTypedAttempts(typedAttemptsByDate), [typedAttemptsByDate]);
  const learnedDateKeys = useMemo(() => new Set(learnedDays.map((entry) => entry.dateKey)), [learnedDays]);
  const currentStreak = useMemo(() => computeCurrentStreak(learnedDateKeys, todayKey), [learnedDateKeys, todayKey]);
  const longestStreak = useMemo(() => computeLongestStreak(learnedDays), [learnedDays]);
  const totalXp = totalTypedAttempts * XP_PER_TYPED_ATTEMPT + learnedDays.length * XP_PER_LEARNED_DAY;
  const level = Math.floor(totalXp / XP_PER_LEVEL) + 1;
  const xpIntoLevel = totalXp % XP_PER_LEVEL;
  const xpToNextLevel = XP_PER_LEVEL - xpIntoLevel;
  const reviewPhraseIds = useMemo(
    () =>
      learnedDays
        .filter((entry) => typeof entry.bestScore === "number")
        .sort((a, b) => (a.bestScore ?? 0) - (b.bestScore ?? 0))
        .slice(0, 3)
        .map((entry) => entry.phraseId),
    [learnedDays]
  );

  const progressPercent = useMemo(() => getProgressPercent(learnedDays.length), [learnedDays.length]);

  const markTodayLearned = useCallback(async () => {
    if (todayCompleted) {
      return;
    }
    if (!todayCheckInCompleted) {
      return;
    }

    const alreadyLearnedPhrase = learnedDays.some((item) => item.phraseId === phraseId);
    if (alreadyLearnedPhrase || learnedDays.length >= PHRASE_COUNT) {
      return;
    }

    const next = [...learnedDays, { dateKey: todayKey, phraseId, learnedAt: new Date().toISOString() }];
    setLearnedDays(next);
    setLearnedDaysState(next);
    scheduleRemoteSync({
      startDateKey: getStartDateKey() ?? getOrCreateStartDateKey(),
      learnedDays: next,
      typedAttemptsByDate,
      dailyCheckInByDate
    });
  }, [dailyCheckInByDate, learnedDays, phraseId, scheduleRemoteSync, todayCheckInCompleted, todayCompleted, todayKey, typedAttemptsByDate]);

  const completeTodayCheckIn = useCallback(() => {
    if (!todayKey || dailyCheckInByDate[todayKey]) {
      return;
    }
    const next = { ...dailyCheckInByDate, [todayKey]: true };
    setDailyCheckInByDate(next);
    setDailyCheckInByDateState(next);
    scheduleRemoteSync({
      startDateKey: getStartDateKey() ?? getOrCreateStartDateKey(),
      learnedDays,
      typedAttemptsByDate,
      dailyCheckInByDate: next
    });
  }, [dailyCheckInByDate, learnedDays, scheduleRemoteSync, todayKey, typedAttemptsByDate]);

  const saveTodaySpeechAttempt = useCallback(
    (score: number, transcript: string) => {
      const nextTypedAttemptsByDate = {
        ...typedAttemptsByDate,
        [todayKey]: (typedAttemptsByDate[todayKey] ?? 0) + 1
      };
      setTypedAttemptsByDate(nextTypedAttemptsByDate);
      setTypedAttemptsByDateState(nextTypedAttemptsByDate);

      const targetIndex = learnedDays.findIndex((entry) => entry.dateKey === todayKey);
      if (targetIndex < 0) {
        return;
      }

      const existing = learnedDays[targetIndex];
      const updated: LearnedDay = {
        ...existing,
        bestScore: Math.max(existing.bestScore ?? 0, score),
        lastTranscript: transcript
      };

      const next = [...learnedDays];
      next[targetIndex] = updated;
      setLearnedDays(next);
      setLearnedDaysState(next);
      scheduleRemoteSync({
        startDateKey: getStartDateKey() ?? getOrCreateStartDateKey(),
        learnedDays: next,
        typedAttemptsByDate: nextTypedAttemptsByDate,
        dailyCheckInByDate
      });
    },
    [dailyCheckInByDate, learnedDays, scheduleRemoteSync, todayKey, typedAttemptsByDate]
  );

  const clearAllProgress = useCallback(() => {
    resetProgress();
    setLearnedDaysState([]);
    setTypedAttemptsByDateState({});
    setDailyCheckInByDateState({});
    const nowKey = getLocalDateKey();
    const startDateKey = getOrCreateStartDateKey();
    const computedDay = getDayNumber(startDateKey, new Date());
    setTodayKey(nowKey);
    setDayNumber(computedDay);
  }, []);

  return {
    hydrated,
    todayKey,
    dayNumber,
    phrase,
    learnedDays,
    todayBestScore: todayEntry?.bestScore,
    todayCheckInCompleted,
    totalTypedAttempts,
    currentStreak,
    longestStreak,
    totalXp,
    level,
    xpIntoLevel,
    xpToNextLevel,
    reviewPhraseIds,
    progressPercent,
    todayCompleted,
    canLearnToday: !todayCompleted && learnedDays.length < PHRASE_COUNT && todayCheckInCompleted,
    completeTodayCheckIn,
    markTodayLearned,
    saveTodaySpeechAttempt,
    clearAllProgress
  };
};
