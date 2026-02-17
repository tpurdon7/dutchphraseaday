"use client";

import { useMemo, useState } from "react";
import { extraLearnMorePhrases } from "@/data/learn-more-extras";
import { phrases } from "@/data/phrases";
import { PronunciationCheck } from "@/components/PronunciationCheck";
import { useAppState } from "@/lib/useAppState";

export default function LearnMorePage() {
  const { learnedDays, markPhrasePracticed } = useAppState();
  const [query, setQuery] = useState("");
  const [selectedPhraseId, setSelectedPhraseId] = useState<number | null>(null);
  const [latestScore, setLatestScore] = useState<number | null>(null);
  const [latestTranscript, setLatestTranscript] = useState<string>("");

  const phrasePool = useMemo(() => [...phrases, ...extraLearnMorePhrases], []);
  const practicedSet = useMemo(() => new Set(learnedDays.map((entry) => entry.phraseId)), [learnedDays]);

  const visiblePool = useMemo(() => {
    const q = query.trim().toLowerCase();
    return phrasePool.filter((item) => {
      if (practicedSet.has(item.id)) {
        return false;
      }
      if (!q) {
        return true;
      }
      return item.dutch.toLowerCase().includes(q);
    });
  }, [phrasePool, practicedSet, query]);

  const selectedPhrase = useMemo(() => {
    if (selectedPhraseId === null) {
      return null;
    }
    return phrasePool.find((item) => item.id === selectedPhraseId) ?? null;
  }, [phrasePool, selectedPhraseId]);

  const selectedBestScore = useMemo(() => {
    if (!selectedPhrase) {
      return undefined;
    }
    const existing = learnedDays.find((entry) => entry.phraseId === selectedPhrase.id);
    return existing?.bestScore;
  }, [learnedDays, selectedPhrase]);

  const handleMarkPracticed = () => {
    if (!selectedPhrase) {
      return;
    }
    markPhrasePracticed(selectedPhrase.id, latestScore ?? undefined, latestTranscript || undefined);
    setSelectedPhraseId(null);
    setLatestScore(null);
    setLatestTranscript("");
  };

  return (
    <section className="space-y-4">
      <div>
        <h1 className="font-[var(--font-cormorant)] text-4xl font-semibold tracking-tight">Want to learn more</h1>
        <p className="mt-1 text-sm text-muted">Explore extra high-frequency Dutch phrases. Tap one to practice it.</p>
      </div>

      {selectedPhrase ? (
        <div className="rounded-3xl border border-stroke bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Practice phrase</p>
            <button
              type="button"
              onClick={() => setSelectedPhraseId(null)}
              className="rounded-xl border border-stroke px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Back to list
            </button>
          </div>

          <p className="mt-2 text-2xl font-semibold text-ink">{selectedPhrase.dutch}</p>
          <p className="mt-1 text-sm text-muted">{selectedPhrase.english || "Translation coming soon."}</p>

          <PronunciationCheck
            targetText={selectedPhrase.dutch}
            bestScore={selectedBestScore}
            onResult={(score, transcript) => {
              setLatestScore(score);
              setLatestTranscript(transcript);
            }}
          />

          <button
            type="button"
            onClick={handleMarkPracticed}
            className="mt-3 w-full rounded-2xl bg-gradient-to-r from-accent to-sky-500 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:brightness-105"
          >
            Mark phrase as practiced
          </button>
        </div>
      ) : (
        <div className="rounded-3xl border border-stroke bg-card p-4 shadow-soft">
          <div className="mb-3 flex items-center justify-between gap-3">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search Dutch phrase..."
              className="w-full rounded-xl border border-stroke bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
            />
            <span className="shrink-0 rounded-full bg-accentSoft px-3 py-1 text-xs font-semibold text-teal-700">
              {visiblePool.length}
            </span>
          </div>

          {visiblePool.length === 0 ? (
            <p className="text-sm text-muted">No phrases left in the pool. You practiced everything in this set.</p>
          ) : (
            <ul className="max-h-[62vh] space-y-2 overflow-auto pr-1">
              {visiblePool.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPhraseId(item.id);
                      setLatestScore(null);
                      setLatestTranscript("");
                    }}
                    className="w-full rounded-xl border border-stroke bg-white px-3 py-2 text-left transition hover:bg-slate-50"
                  >
                    <p className="text-sm font-medium text-slate-800">{item.dutch}</p>
                    <p className="mt-0.5 text-xs text-muted">{item.english || "Translation coming soon."}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
