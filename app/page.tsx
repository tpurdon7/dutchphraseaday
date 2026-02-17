"use client";

import type { MouseEvent } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { PHRASE_COUNT, phraseById } from "@/data/phrases";
import { ConfirmModal } from "@/components/ConfirmModal";
import { DailyCheckIn } from "@/components/DailyCheckIn";
import { PhraseCard } from "@/components/PhraseCard";
import { ProgressBar } from "@/components/ProgressBar";
import { Toast } from "@/components/Toast";
import { fireStroopwafelConfetti } from "@/lib/stroopwafel-confetti";
import { useAppState } from "@/lib/useAppState";

type AchievementKey = "streak_3" | "level_5" | "typed_50" | "learned_20";

const AchievementIcon = ({ kind, unlocked }: { kind: AchievementKey; unlocked: boolean }) => {
  const iconClass = unlocked ? "text-emerald-700" : "text-slate-400";
  if (kind === "streak_3") {
    return (
      <svg aria-hidden viewBox="0 0 24 24" className={`h-5 w-5 ${iconClass}`} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 3c4 2.4 5.9 5.1 5.9 8.2A5.9 5.9 0 1 1 6.1 11.2C6.1 8.1 8 5.4 12 3Z" />
        <path d="M12 9.2c1.7 1 2.5 2.2 2.5 3.3a2.5 2.5 0 1 1-5 0c0-1.1.8-2.3 2.5-3.3Z" />
      </svg>
    );
  }
  if (kind === "level_5") {
    return (
      <svg aria-hidden viewBox="0 0 24 24" className={`h-5 w-5 ${iconClass}`} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M7 20h10M12 4v11m0 0 4-4m-4 4-4-4" />
        <circle cx="18.5" cy="6.5" r="2.5" />
      </svg>
    );
  }
  if (kind === "typed_50") {
    return (
      <svg aria-hidden viewBox="0 0 24 24" className={`h-5 w-5 ${iconClass}`} fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="5" width="18" height="14" rx="2.5" />
        <path d="M7 10h2M11 10h2M15 10h2M7 14h6M15 14h2" />
      </svg>
    );
  }
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={`h-5 w-5 ${iconClass}`} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="m5 8 3 12h8l3-12M9 8V6a3 3 0 1 1 6 0v2" />
      <path d="M8 12h8" />
    </svg>
  );
};

export default function HomePage() {
  const {
    hydrated,
    dayNumber,
    phrase,
    learnedDays,
    learnedDailyCount,
    todayBestScore,
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
    canLearnToday,
    completeTodayCheckIn,
    markTodayLearned,
    saveTodaySpeechAttempt
  } = useAppState();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("Saved. Nice work today.");
  const [learnButtonOrigin, setLearnButtonOrigin] = useState({ x: 0, y: 0 });
  const [deckIndex, setDeckIndex] = useState(0);
  const [deckRevealed, setDeckRevealed] = useState(false);
  const [deckDirection, setDeckDirection] = useState<"nl_to_en" | "en_to_nl">("nl_to_en");

  const dayLabel = useMemo(() => {
    const learnedForDisplay = Math.min(learnedDailyCount, PHRASE_COUNT);
    return `Day ${learnedForDisplay} of 100`;
  }, [learnedDailyCount]);
  const xpProgress = Math.round((xpIntoLevel / 250) * 100);
  const challengeCheckInDone = todayCheckInCompleted;
  const challengeScoreDone = typeof todayBestScore === "number" && todayBestScore >= 90;
  const reviewPhrases = reviewPhraseIds
    .map((id) => phraseById.get(id))
    .filter((item): item is NonNullable<ReturnType<typeof phraseById.get>> => Boolean(item));
  const activeDeckCard = reviewPhrases.length > 0 ? reviewPhrases[deckIndex % reviewPhrases.length] : null;
  const achievements: { key: AchievementKey; label: string; unlocked: boolean }[] = [
    { key: "streak_3", label: "First 3-day streak", unlocked: currentStreak >= 3 || longestStreak >= 3 },
    { key: "level_5", label: "Level 5 learner", unlocked: level >= 5 },
    { key: "typed_50", label: "50 typed reps", unlocked: totalTypedAttempts >= 50 },
    { key: "learned_20", label: "20 phrases learned", unlocked: learnedDays.length >= 20 }
  ];

  const handleConfirmLearn = async () => {
    const shouldCelebrate = !todayCompleted && canLearnToday;
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 450));
    await markTodayLearned();
    setSaving(false);
    setConfirmOpen(false);
    if (shouldCelebrate) {
      fireStroopwafelConfetti(learnButtonOrigin.x, learnButtonOrigin.y);
    }
    setToastMessage("Day complete. Streak protected.");
    setShowToast(true);
    window.setTimeout(() => setShowToast(false), 2400);
  };

  const handleOpenCompleteConfirm = (event: MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setLearnButtonOrigin({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    });
    setConfirmOpen(true);
  };

  const handleShare = async () => {
    const text = [
      `I am on a ${currentStreak}-day Dutch streak in The Flying Dutchman.`,
      `Level ${level}, ${totalXp} XP, ${learnedDays.length}/100 phrases complete.`,
      `Today's phrase: "${phrase?.dutch ?? ""}"`
    ].join("\n");

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      }
      setToastMessage("Progress summary copied. Post it.");
    } catch {
      setToastMessage("Could not copy automatically. Try again.");
    }
    setShowToast(true);
    window.setTimeout(() => setShowToast(false), 2400);
  };

  if (!hydrated || !phrase) {
    return <div className="rounded-3xl border border-stroke bg-card p-6 shadow-soft">Loading your sentence...</div>;
  }

  return (
    <>
      <div className="space-y-4">
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-stroke bg-card px-3 py-3 shadow-soft">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Streak</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{currentStreak}</p>
            <p className="text-xs text-muted">Best {longestStreak}</p>
          </div>
          <div className="rounded-2xl border border-stroke bg-card px-3 py-3 shadow-soft">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Level</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{level}</p>
            <p className="text-xs text-muted">{xpToNextLevel} XP to next</p>
          </div>
          <div className="rounded-2xl border border-stroke bg-card px-3 py-3 shadow-soft">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Total XP</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{totalXp}</p>
            <p className="text-xs text-muted">{totalTypedAttempts} practices</p>
          </div>
          <button
            type="button"
            onClick={handleShare}
            className="rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 to-sky-50 px-3 py-3 text-left shadow-soft transition hover:brightness-105"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wider text-teal-700">Share</p>
            <p className="mt-1 text-sm font-semibold text-teal-900">Copy progress card</p>
            <p className="text-xs text-teal-700">Build your streak social proof</p>
          </button>
        </section>

        <section className="rounded-3xl border border-stroke bg-card p-5 shadow-soft">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-ink">XP Progress</p>
            <p className="text-sm font-semibold text-slate-700">{xpIntoLevel}/250</p>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 transition-all duration-500"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-700">
              {challengeCheckInDone ? "✅" : "⬜"} Finish daily check-in
            </div>
            <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-700">
              {challengeScoreDone ? "✅" : "⬜"} Hit score 90+ today
            </div>
            <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-700">
              {todayCompleted ? "✅" : "⬜"} Mark day complete
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-stroke bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">Achievements</h2>
            <p className="text-xs font-semibold text-muted">
              {achievements.filter((item) => item.unlocked).length}/{achievements.length}
            </p>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {achievements.map((item) => (
              <div
                key={item.label}
                className={`rounded-xl border px-3 py-2 text-sm ${
                  item.unlocked
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-slate-200 bg-slate-50 text-slate-600"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <AchievementIcon kind={item.key} unlocked={item.unlocked} />
                  <span>{item.label}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <PhraseCard
          phrase={phrase}
          completed={todayCompleted}
          bestScore={todayBestScore}
          onSpeechResult={saveTodaySpeechAttempt}
        />

        <DailyCheckIn phrase={phrase.dutch} completed={todayCheckInCompleted} onComplete={completeTodayCheckIn} />

        <button
          type="button"
          onClick={handleOpenCompleteConfirm}
          disabled={!canLearnToday}
          className="w-full rounded-2xl bg-gradient-to-r from-accent to-sky-500 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {todayCompleted
            ? "Completed for today"
            : !todayCheckInCompleted
              ? "Complete daily check-in to unlock"
              : "Mark sentence as learned"}
        </button>

        <ProgressBar dayLabel={dayLabel} progressPercent={progressPercent} />

        {reviewPhrases.length > 0 ? (
          <section className="rounded-3xl border border-stroke bg-card p-5 shadow-soft">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-ink">Comeback Deck</h2>
              <Link href="/history" className="text-xs font-semibold text-accent hover:underline">
                Open history
              </Link>
            </div>
            <p className="mt-1 text-xs text-muted">Rehearse past cards as flashcards and switch direction anytime.</p>

            {activeDeckCard ? (
              <div className="mt-3 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDeckDirection("nl_to_en");
                      setDeckRevealed(false);
                    }}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                      deckDirection === "nl_to_en"
                        ? "bg-slate-900 text-white"
                        : "border border-stroke bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    NL → EN
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeckDirection("en_to_nl");
                      setDeckRevealed(false);
                    }}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                      deckDirection === "en_to_nl"
                        ? "bg-slate-900 text-white"
                        : "border border-stroke bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    EN → NL
                  </button>
                  <span className="ml-auto rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    {deckIndex + 1}/{reviewPhrases.length}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setDeckRevealed((current) => !current)}
                  className="w-full rounded-2xl border border-stroke bg-slate-50 px-4 py-5 text-left transition hover:bg-slate-100"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                    {deckRevealed ? "Answer" : "Prompt"}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {deckRevealed
                      ? deckDirection === "nl_to_en"
                        ? activeDeckCard.english
                        : activeDeckCard.dutch
                      : deckDirection === "nl_to_en"
                        ? activeDeckCard.dutch
                        : activeDeckCard.english}
                  </p>
                  <p className="mt-2 text-xs text-muted">Tap card to {deckRevealed ? "hide answer" : "reveal answer"}.</p>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDeckIndex((current) => (current - 1 + reviewPhrases.length) % reviewPhrases.length);
                      setDeckRevealed(false);
                    }}
                    className="rounded-xl border border-stroke bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeckIndex((current) => (current + 1) % reviewPhrases.length);
                      setDeckRevealed(false);
                    }}
                    className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        <section className="rounded-3xl border border-stroke bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-ink">Want to learn more</h2>
              <p className="mt-1 text-xs text-muted">Practice extra high-frequency phrases whenever you want.</p>
            </div>
            <Link
              href="/learn-more"
              className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Open
            </Link>
          </div>
        </section>

        <p className="text-center text-xs text-muted">
          Day track: {dayNumber} / 100. You only get one sentence per local calendar day.
        </p>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Mark sentence as learned?"
        body="This will count today toward your 100-day progress."
        confirmLabel="Yes, mark learned"
        busy={saving}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirmLearn}
      />

      <Toast show={showToast} message={toastMessage} />
    </>
  );
}
