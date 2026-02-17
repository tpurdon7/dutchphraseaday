"use client";

import { useEffect, useState } from "react";
import { phraseById } from "@/data/phrases";
import { getPracticeStore } from "@/lib/practice-storage";
import { getTypedAttemptsByDate } from "@/lib/storage";
import { useAppState } from "@/lib/useAppState";
import type { PracticeRecord } from "@/lib/types";

const prettyDate = (dateKey: string): string => {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, (month ?? 1) - 1, day ?? 1);
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
};

export default function HistoryPage() {
  const { hydrated, learnedDays, currentStreak, longestStreak, totalTypedAttempts } = useAppState();
  const [practiceByDate, setPracticeByDate] = useState<Record<string, PracticeRecord>>({});
  const [typedAttemptsByDate, setTypedAttemptsByDate] = useState<Record<string, number>>({});

  const sorted = [...learnedDays].sort((a, b) => Date.parse(b.learnedAt) - Date.parse(a.learnedAt));

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    setPracticeByDate(getPracticeStore());
    setTypedAttemptsByDate(getTypedAttemptsByDate());
  }, [hydrated]);

  const last14Days = Array.from({ length: 14 }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (13 - index));
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
      date.getDate()
    ).padStart(2, "0")}`;
    const attempts = typedAttemptsByDate[dateKey] ?? 0;
    const intensityClass =
      attempts >= 8
        ? "bg-emerald-500"
        : attempts >= 5
          ? "bg-emerald-400"
          : attempts >= 2
            ? "bg-emerald-300"
            : attempts >= 1
              ? "bg-emerald-200"
              : "bg-slate-200";
    return { dateKey, attempts, intensityClass };
  });

  return (
    <section className="space-y-4">
      <div>
        <h1 className="font-[var(--font-cormorant)] text-4xl font-semibold tracking-tight">History</h1>
        <p className="mt-1 text-sm text-muted">
          Most recent learned sentences first. Showing {sorted.length} learned {sorted.length === 1 ? "phrase" : "phrases"}.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-stroke bg-card px-3 py-3 shadow-soft">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Current streak</p>
          <p className="mt-1 text-2xl font-semibold text-ink">{currentStreak}</p>
        </div>
        <div className="rounded-2xl border border-stroke bg-card px-3 py-3 shadow-soft">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Best streak</p>
          <p className="mt-1 text-2xl font-semibold text-ink">{longestStreak}</p>
        </div>
        <div className="rounded-2xl border border-stroke bg-card px-3 py-3 shadow-soft">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Typed reps</p>
          <p className="mt-1 text-2xl font-semibold text-ink">{totalTypedAttempts}</p>
        </div>
      </div>

      <div className="rounded-3xl border border-stroke bg-card p-4 shadow-soft">
        <p className="text-sm font-semibold text-ink">14-day activity</p>
        <p className="mt-1 text-xs text-muted">More reps each day makes the squares darker.</p>
        <div className="mt-3 grid grid-cols-14 gap-1">
          {last14Days.map((item) => (
            <div
              key={item.dateKey}
              className={`h-6 rounded ${item.intensityClass}`}
              title={`${item.dateKey}: ${item.attempts} practice ${item.attempts === 1 ? "rep" : "reps"}`}
            />
          ))}
        </div>
      </div>

      {!hydrated ? (
        <div className="rounded-3xl border border-stroke bg-card p-5 shadow-soft">Loading history...</div>
      ) : sorted.length === 0 ? (
        <div className="rounded-3xl border border-stroke bg-card p-5 text-sm text-muted shadow-soft">
          No progress yet. Complete today&apos;s sentence to start your streak.
        </div>
      ) : (
        <ul className="space-y-3">
          {sorted.map((entry) => {
            const phrase = phraseById.get(entry.phraseId);
            const practiceScore = practiceByDate[entry.dateKey]?.bestScore;
            const score =
              typeof entry.bestScore === "number" && typeof practiceScore === "number"
                ? Math.max(entry.bestScore, practiceScore)
                : typeof entry.bestScore === "number"
                  ? entry.bestScore
                  : practiceScore;
            return (
              <li
                key={`${entry.phraseId}-${entry.dateKey}-${entry.learnedAt}`}
                className="rounded-2xl border border-stroke bg-card p-4 shadow-soft"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">{prettyDate(entry.dateKey)}</p>
                  {typeof score === "number" ? (
                    <span className="rounded-full bg-accentSoft px-3 py-1 text-xs font-semibold text-teal-700">
                      Best: {score}/100
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-lg font-semibold text-ink">{phrase?.dutch ?? "Unknown sentence"}</p>
                <p className="text-sm text-slate-700">{phrase?.english}</p>
                <p className="mt-1 text-xs text-muted">{phrase?.pronunciation}</p>
                <p className="mt-2 text-xs text-slate-500">
                  Typed practice reps that day: <span className="font-semibold text-slate-700">{typedAttemptsByDate[entry.dateKey] ?? 0}</span>
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
