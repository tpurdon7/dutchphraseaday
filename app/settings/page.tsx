"use client";

import { useState } from "react";
import Link from "next/link";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Toast } from "@/components/Toast";
import { useAppState } from "@/lib/useAppState";

export default function SettingsPage() {
  const { clearAllProgress, learnedDays, currentStreak, longestStreak, totalXp, level, totalTypedAttempts } = useAppState();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("Progress reset. Day 1 starts today.");

  const handleReset = () => {
    clearAllProgress();
    setConfirmOpen(false);
    setToastMessage("Progress reset. Day 1 starts today.");
    setShowToast(true);
    window.setTimeout(() => setShowToast(false), 2200);
  };

  const handleCopySnapshot = async () => {
    const snapshot = {
      exportedAt: new Date().toISOString(),
      streak: currentStreak,
      bestStreak: longestStreak,
      totalXp,
      level,
      learned: learnedDays.length,
      typedReps: totalTypedAttempts
    };

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(JSON.stringify(snapshot, null, 2));
      }
      setToastMessage("Progress snapshot copied.");
    } catch {
      setToastMessage("Could not copy snapshot.");
    }
    setShowToast(true);
    window.setTimeout(() => setShowToast(false), 2200);
  };

  return (
    <section className="space-y-5">
      <div>
        <h1 className="font-[var(--font-cormorant)] text-4xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted">Manage local progress on this device.</p>
      </div>

      <div className="rounded-3xl border border-stroke bg-card p-5 shadow-soft">
        <h2 className="text-lg font-semibold text-ink">Stats snapshot</h2>
        <p className="mt-2 text-sm text-muted">Copy your current stats as JSON to back up or share your run.</p>
        <button
          type="button"
          onClick={() => {
            void handleCopySnapshot();
          }}
          className="mt-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-100"
        >
          Copy progress snapshot
        </button>
      </div>

      <div className="rounded-3xl border border-stroke bg-card p-5 shadow-soft">
        <h2 className="text-lg font-semibold text-ink">Sharable profile</h2>
        <p className="mt-2 text-sm text-muted">
          Your public-style stat line: Level {level}, {totalXp} XP, {currentStreak}-day streak.
        </p>
        <Link
          href="/"
          className="mt-4 inline-flex rounded-xl border border-stroke bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Back to today&apos;s mission
        </Link>
      </div>

      <div className="rounded-3xl border border-stroke bg-card p-5 shadow-soft">
        <h2 className="text-lg font-semibold text-ink">Reset progress</h2>
        <p className="mt-2 text-sm text-muted">
          This clears your learned history and restarts the 100-day journey from today.
        </p>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
        >
          Reset all data
        </button>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Reset all progress?"
        body="Your learned sentence history will be permanently removed from localStorage."
        confirmLabel="Yes, reset now"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleReset}
      />

      <Toast show={showToast} message={toastMessage} />
    </section>
  );
}
