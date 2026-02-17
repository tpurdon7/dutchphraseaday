"use client";

import type { Phrase } from "@/lib/types";
import { PronunciationButton } from "@/components/PronunciationButton";
import { PronunciationCheck } from "@/components/PronunciationCheck";

type PhraseCardProps = {
  phrase: Phrase;
  completed: boolean;
  bestScore?: number;
  onSpeechResult: (score: number, transcript: string) => void;
};

export const PhraseCard = ({ phrase, completed, bestScore, onSpeechResult }: PhraseCardProps) => {
  return (
    <section className="rounded-3xl border border-stroke bg-card p-6 shadow-soft transition hover:shadow-hover">
      <div className="mb-3 flex items-center justify-between gap-4">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">Today&apos;s sentence</p>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            completed ? "bg-emerald-100 text-emerald-700" : "bg-accentSoft text-teal-700"
          }`}
        >
          {completed ? "Completed" : "Ready"}
        </span>
      </div>

      <h1 className="font-[var(--font-cormorant)] text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
        {phrase.dutch}
      </h1>
      <p className="mt-3 text-lg text-slate-700">{phrase.english}</p>
      <p className="mt-2 text-sm text-muted">
        Pronunciation: <span className="font-medium text-slate-700">{phrase.pronunciation}</span>
      </p>
      <PronunciationButton text={phrase.dutch} />
      <PronunciationCheck
        targetText={phrase.dutch}
        bestScore={bestScore}
        onResult={onSpeechResult}
      />

      {phrase.example ? (
        <div className="mt-6 rounded-2xl bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-700">Usage</p>
          <p className="mt-1 text-sm text-slate-700">{phrase.example.dutch}</p>
          <p className="mt-1 text-sm text-muted">{phrase.example.english}</p>
        </div>
      ) : null}
    </section>
  );
};
