"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { buildMismatchTip, scoreLabel, scorePronunciationAttempt } from "@/lib/pronunciation-score";

type PronunciationCheckProps = {
  targetText: string;
  bestScore?: number;
  disabled?: boolean;
  onResult?: (score: number, transcript: string) => void;
};

const normalizeSpaces = (value: string): string => value.replace(/\s+/g, " ").trim();

export const PronunciationCheck = ({
  targetText,
  bestScore,
  disabled = false,
  onResult
}: PronunciationCheckProps) => {
  const [dictationInput, setDictationInput] = useState("");
  const [transcript, setTranscript] = useState("");
  const [score, setScore] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const onResultRef = useRef(onResult);

  const canCheckDictation = Boolean(dictationInput.trim()) && !disabled;

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  const reset = () => {
    setDictationInput("");
    setTranscript("");
    setScore(null);
    setError(null);
    setErrorCode(null);
  };

  const checkDictation = () => {
    if (!canCheckDictation) {
      return;
    }

    const spokenText = normalizeSpaces(dictationInput);
    setError(null);
    setErrorCode(null);
    setTranscript(spokenText);

    if (!spokenText) {
      setScore(null);
      setError("Enter or dictate a sentence first.");
      setErrorCode("empty-input");
      return;
    }

    const computed = scorePronunciationAttempt(targetText, spokenText);
    setScore(computed);
    onResultRef.current?.(computed, spokenText);
  };

  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetText]);

  const rating = useMemo(() => (score === null ? null : scoreLabel(score)), [score]);
  const tip = useMemo(() => {
    if (!transcript || score === null) {
      return "";
    }
    return buildMismatchTip(targetText, transcript);
  }, [transcript, score, targetText]);

  return (
    <div className="mt-4 rounded-2xl border border-stroke bg-white p-4 shadow-sm">
      <div className="rounded-xl border border-stroke bg-slate-50 p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-900">Dictation mode</p>
          <span className="rounded-full bg-accentSoft px-2.5 py-1 text-[11px] font-semibold text-teal-700">Optional</span>
        </div>
        <label htmlFor="dictation-input" className="mt-2 block text-sm text-slate-700">
          Tap here and use your keyboard mic to dictate the Dutch sentence
        </label>
        <textarea
          id="dictation-input"
          value={dictationInput}
          onChange={(event) => setDictationInput(event.target.value)}
          placeholder="Dictate or type what you said in Dutch..."
          rows={4}
          disabled={disabled}
          className="mt-2 w-full resize-none rounded-xl border border-stroke bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 disabled:cursor-not-allowed disabled:opacity-70"
        />
        <button
          type="button"
          onClick={checkDictation}
          disabled={!canCheckDictation}
          className="mt-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Check pronunciation
        </button>
      </div>
      {typeof bestScore === "number" ? (
        <div className="mt-3 border-t border-stroke pt-3">
          <span className="rounded-full bg-accentSoft px-3 py-1 text-xs font-semibold text-teal-700">
            Best score: {bestScore}
          </span>
        </div>
      ) : null}

      {transcript ? (
        <p className="mt-2 text-sm text-slate-700">
          Heard: <span className="font-medium text-slate-900">{transcript}</span>
        </p>
      ) : null}

      {error ? (
        <p className="mt-3 text-sm text-rose-700">
          {error}
          {errorCode ? <span className="ml-2 text-rose-500">({errorCode})</span> : null}
        </p>
      ) : null}

      {transcript && score !== null ? (
        <div className="mt-3 space-y-2">
          <p className="text-sm text-slate-700">
            You said: <span className="font-medium text-slate-900">&quot;{transcript}&quot;</span>
          </p>
          <p className="text-sm text-slate-700">
            Score: <span className="font-semibold text-slate-900">{score}/100</span> ({rating})
          </p>
          {tip ? <p className="text-sm text-muted">Tip: {tip}</p> : null}
        </div>
      ) : null}
    </div>
  );
};
