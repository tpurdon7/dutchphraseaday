"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getPracticeForDate, setPracticeForDate } from "@/lib/practice-storage";
import { scoreLabel, scorePronunciationAttempt } from "@/lib/pronunciation-score";
import type { PracticeRecord } from "@/lib/types";

type PracticeState = "idle" | "playing_audio" | "listening" | "processing" | "showing_result" | "finished";

type PracticeModeProps = {
  dateKey: string;
  targetText: string;
  onRunningChange?: (running: boolean) => void;
  onScored?: (score: number, transcript: string) => void;
};

type RecognitionErrorCode =
  | "aborted"
  | "audio-capture"
  | "bad-grammar"
  | "language-not-supported"
  | "network"
  | "no-speech"
  | "not-allowed"
  | "phrases-not-supported"
  | "service-not-allowed";

type PermissionError = {
  name?: string;
};

type SpeechRecognitionAlternativeLike = {
  transcript: string;
};

type SpeechRecognitionResultLike = {
  0: SpeechRecognitionAlternativeLike;
  isFinal: boolean;
  length: number;
};

type SpeechRecognitionResultListLike = {
  [index: number]: SpeechRecognitionResultLike;
  length: number;
};

type SpeechRecognitionEventLike = Event & {
  resultIndex: number;
  results: SpeechRecognitionResultListLike;
};

type SpeechRecognitionErrorEventLike = Event & {
  error: RecognitionErrorCode;
};

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: ((event: Event) => void) | null;
  onend: ((event: Event) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

const MAX_ATTEMPTS = 3;
const MIN_LISTEN_MS = 5_000;
const MAX_LISTEN_MS = 10_000;
const PRACTICE_AUDIO_MS = 4_000;

const getDutchVoice = (voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null => {
  const exact = voices.find((voice) => voice.lang.toLowerCase() === "nl-nl");
  if (exact) {
    return exact;
  }

  const dutch = voices.find((voice) => voice.lang.toLowerCase().startsWith("nl"));
  return dutch ?? null;
};

const recognitionErrorMessage = (code: RecognitionErrorCode): string => {
  if (code === "no-speech") {
    return "I didn’t hear anything. Try speaking a bit louder or closer to the mic.";
  }
  if (code === "not-allowed" || code === "service-not-allowed") {
    return "Microphone permission blocked. Enable it in browser settings.";
  }
  if (code === "audio-capture") {
    return "No microphone was found. Check your audio input and retry.";
  }
  if (code === "network") {
    return "Speech recognition had a network issue. Please try again.";
  }
  return "Could not process speech this time. Please try again.";
};

const normalizeSpaces = (value: string): string => value.replace(/\s+/g, " ").trim();

const buildDefaultPractice = (dateKey: string): PracticeRecord => ({
  dateKey,
  attemptsUsed: 0,
  bestScore: 0,
  lastTranscript: "",
  updatedAt: new Date().toISOString()
});

export const PracticeMode = ({ dateKey, targetText, onRunningChange, onScored }: PracticeModeProps) => {
  const [supported, setSupported] = useState(false);
  const [state, setState] = useState<PracticeState>("idle");
  const [secondsLeft, setSecondsLeft] = useState(10);
  const [attemptsUsed, setAttemptsUsed] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [latestScore, setLatestScore] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recognitionCtorRef = useRef<SpeechRecognitionConstructor | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const sessionIdRef = useRef(0);
  const mountedRef = useRef(true);
  const manualStopRef = useRef(false);
  const finalResultSeenRef = useRef(false);
  const minUntilRef = useRef(0);
  const maxUntilRef = useRef(0);
  const maxTimerRef = useRef<number | null>(null);
  const countdownRef = useRef<number | null>(null);
  const restartTimerRef = useRef<number | null>(null);
  const audioPhaseTimerRef = useRef<number | null>(null);
  const finalRef = useRef("");
  const interimRef = useRef("");
  const onScoredRef = useRef(onScored);

  useEffect(() => {
    onScoredRef.current = onScored;
  }, [onScored]);

  const running = state !== "idle";

  useEffect(() => {
    onRunningChange?.(running);
  }, [onRunningChange, running]);

  const clearTimers = useCallback(() => {
    if (maxTimerRef.current !== null) {
      window.clearTimeout(maxTimerRef.current);
      maxTimerRef.current = null;
    }

    if (countdownRef.current !== null) {
      window.clearInterval(countdownRef.current);
      countdownRef.current = null;
    }

    if (restartTimerRef.current !== null) {
      window.clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }

    if (audioPhaseTimerRef.current !== null) {
      window.clearTimeout(audioPhaseTimerRef.current);
      audioPhaseTimerRef.current = null;
    }
  }, []);

  const hardStopRecognition = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      return;
    }

    try {
      recognition.stop();
    } catch {
      // no-op
    }

    try {
      recognition.abort();
    } catch {
      // no-op
    }

    recognitionRef.current = null;
  }, []);

  const cancelTts = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const hardResetPractice = useCallback(() => {
    sessionIdRef.current += 1;
    manualStopRef.current = true;
    finalResultSeenRef.current = false;
    clearTimers();
    hardStopRecognition();
    cancelTts();

    if (mountedRef.current) {
      setState("idle");
      setSecondsLeft(10);
      setInterimTranscript("");
      setFinalTranscript("");
      setLatestScore(null);
      setError(null);
    }
    finalRef.current = "";
    interimRef.current = "";
  }, [cancelTts, clearTimers, hardStopRecognition]);

  const persistPracticeResult = useCallback(
    (score: number, transcript: string) => {
      const existing = getPracticeForDate(dateKey) ?? buildDefaultPractice(dateKey);
      const nextAttempts = Math.min(existing.attemptsUsed + 1, MAX_ATTEMPTS);
      const nextBest = Math.max(existing.bestScore, score);

      const next: PracticeRecord = {
        dateKey,
        attemptsUsed: nextAttempts,
        bestScore: nextBest,
        lastTranscript: transcript,
        updatedAt: new Date().toISOString()
      };

      setPracticeForDate(next);
      setAttemptsUsed(next.attemptsUsed);
      setBestScore(next.bestScore);

      onScoredRef.current?.(score, transcript);
    },
    [dateKey]
  );

  const finalizeAttempt = useCallback(
    (rawTranscript: string) => {
      const cleaned = normalizeSpaces(rawTranscript);
      setFinalTranscript(cleaned);
      setInterimTranscript("");
      finalRef.current = cleaned;
      interimRef.current = "";

      if (!cleaned) {
        setLatestScore(null);
        setError("I didn’t hear anything. Try speaking a bit louder or closer to the mic.");
        setState("showing_result");
        return;
      }

      const computedScore = scorePronunciationAttempt(targetText, cleaned);
      persistPracticeResult(computedScore, cleaned);
      setLatestScore(computedScore);
      setError(null);

      const nextAttempts = Math.min(attemptsUsed + 1, MAX_ATTEMPTS);
      if (nextAttempts >= MAX_ATTEMPTS) {
        setState("finished");
      } else {
        setState("showing_result");
      }
    },
    [attemptsUsed, persistPracticeResult, targetText]
  );

  const startRecognition = useCallback(
    (sessionId: number) => {
      const Ctor = recognitionCtorRef.current;
      if (!Ctor) {
        setError("Speech recognition is supported in Chrome on desktop and Android.");
        setState("showing_result");
        return;
      }

      const recognition = new Ctor();
      recognition.lang = "nl-NL";
      recognition.interimResults = true;
      recognition.continuous = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        if (!mountedRef.current || sessionId !== sessionIdRef.current) {
          return;
        }

        const now = Date.now();
        const remainingMs = Math.max(0, maxUntilRef.current - now);
        setState("listening");
        setSecondsLeft(Math.max(0, Math.ceil(remainingMs / 1000)));
        setError(null);

        clearTimers();
        countdownRef.current = window.setInterval(() => {
          const next = Math.max(0, Math.ceil((maxUntilRef.current - Date.now()) / 1000));
          setSecondsLeft(next);
        }, 200);

        maxTimerRef.current = window.setTimeout(() => {
          if (!mountedRef.current || sessionId !== sessionIdRef.current) {
            return;
          }

          clearTimers();
          hardStopRecognition();
          setState("processing");
          finalizeAttempt(`${finalRef.current} ${interimRef.current}`);
        }, remainingMs);
      };

      recognition.onresult = (event) => {
        if (!mountedRef.current || sessionId !== sessionIdRef.current) {
          return;
        }

        let nextInterim = "";
        let nextFinal = finalRef.current;
        let sawFinal = false;

        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const result = event.results[index];
          const chunk = result?.[0]?.transcript ?? "";

          if (result?.isFinal) {
            sawFinal = true;
            nextFinal = normalizeSpaces(`${nextFinal} ${chunk}`);
          } else {
            nextInterim = normalizeSpaces(`${nextInterim} ${chunk}`);
          }
        }

        finalRef.current = nextFinal;
        interimRef.current = nextInterim;
        setFinalTranscript(nextFinal);
        setInterimTranscript(nextInterim);

        if (sawFinal) {
          finalResultSeenRef.current = true;
          clearTimers();
          hardStopRecognition();
          setState("processing");
          finalizeAttempt(nextFinal);
        }
      };

      recognition.onerror = (event) => {
        if (!mountedRef.current || sessionId !== sessionIdRef.current) {
          return;
        }

        const now = Date.now();
        const beforeMin = now < minUntilRef.current;
        const beforeMax = now < maxUntilRef.current;

        if ((event.error === "no-speech" || event.error === "aborted") && beforeMax) {
          clearTimers();
          hardStopRecognition();
          setState("listening");
          setError(null);
          setLatestScore(null);

          restartTimerRef.current = window.setTimeout(() => {
            if (!mountedRef.current || sessionId !== sessionIdRef.current || recognitionRef.current) {
              return;
            }
            startRecognition(sessionId);
          }, beforeMin ? 120 : 220);
          return;
        }

        clearTimers();
        hardStopRecognition();
        setState("showing_result");
        setLatestScore(null);
        setError(recognitionErrorMessage(event.error));
      };

      recognition.onend = () => {
        if (!mountedRef.current || sessionId !== sessionIdRef.current) {
          return;
        }

        clearTimers();
        recognitionRef.current = null;

        if (manualStopRef.current || finalResultSeenRef.current) {
          manualStopRef.current = false;
          finalResultSeenRef.current = false;
          return;
        }

        if (Date.now() < maxUntilRef.current) {
          setState("listening");
          restartTimerRef.current = window.setTimeout(() => {
            if (!mountedRef.current || sessionId !== sessionIdRef.current || recognitionRef.current) {
              return;
            }
            startRecognition(sessionId);
          }, 180);
          return;
        }

        setState("showing_result");
      };

      recognitionRef.current = recognition;
      recognition.start();
    },
    [clearTimers, finalizeAttempt, hardStopRecognition]
  );

  const startPractice = useCallback(async () => {
    if (attemptsUsed >= MAX_ATTEMPTS) {
      setState("finished");
      return;
    }

    sessionIdRef.current += 1;
    const sessionId = sessionIdRef.current;
    manualStopRef.current = false;
    finalResultSeenRef.current = false;

    setState("playing_audio");
    setInterimTranscript("");
    setFinalTranscript("");
    finalRef.current = "";
    interimRef.current = "";
    setLatestScore(null);
    setError(null);
    const now = Date.now();
    minUntilRef.current = now + MIN_LISTEN_MS;
    maxUntilRef.current = now + MAX_LISTEN_MS;

    cancelTts();
    hardStopRecognition();

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setState("showing_result");
        setError("Microphone access is not available in this browser.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
    } catch (caught) {
      const permissionError = caught as PermissionError;
      const blocked = permissionError?.name === "NotAllowedError" || permissionError?.name === "PermissionDeniedError";
      setState("showing_result");
      setError(
        blocked
          ? "Microphone permission blocked. Enable it in browser settings."
          : "Could not access microphone. Please try again."
      );
      return;
    }

    if (!mountedRef.current || sessionId !== sessionIdRef.current) {
      return;
    }

    if (typeof window === "undefined" || !("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      startRecognition(sessionId);
      return;
    }

    const synthesis = window.speechSynthesis;
    const voices = synthesis.getVoices();
    const utterance = new SpeechSynthesisUtterance(targetText);
    const dutchVoice = getDutchVoice(voices);

    if (dutchVoice) {
      utterance.voice = dutchVoice;
      utterance.lang = dutchVoice.lang;
    } else {
      utterance.lang = "nl-NL";
    }

    utterance.rate = 0.95;

    utterance.onend = () => {
      // Intentionally no-op: we always move to recording after fixed 4s.
    };

    utterance.onerror = () => {
      // If playback fails, we still continue to recording after fixed 4s.
    };

    synthesis.speak(utterance);

    audioPhaseTimerRef.current = window.setTimeout(() => {
      if (!mountedRef.current || sessionId !== sessionIdRef.current) {
        return;
      }

      synthesis.cancel();
      startRecognition(sessionId);
    }, PRACTICE_AUDIO_MS);
  }, [attemptsUsed, cancelTts, hardStopRecognition, startRecognition, targetText]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const speechWindow = window as SpeechWindow;
    const Ctor = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    recognitionCtorRef.current = Ctor ?? null;
    setSupported(Boolean(Ctor));
  }, []);

  useEffect(() => {
    hardResetPractice();
    const existing = getPracticeForDate(dateKey) ?? buildDefaultPractice(dateKey);
    setAttemptsUsed(existing.attemptsUsed);
    setBestScore(existing.bestScore);
  }, [dateKey, hardResetPractice]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      clearTimers();
      hardStopRecognition();
      cancelTts();
    };
  }, [cancelTts, clearTimers, hardStopRecognition]);

  const canTryAgain = attemptsUsed < MAX_ATTEMPTS && (state === "showing_result" || state === "finished");
  const currentAttempt = Math.min(attemptsUsed + 1, MAX_ATTEMPTS);
  const latestLabel = latestScore === null ? null : scoreLabel(latestScore);

  if (!supported) {
    return (
      <div className="mt-4 rounded-2xl border border-dashed border-stroke bg-slate-50 px-4 py-3 text-sm text-muted">
        Practice mode is supported in Chrome on desktop and Android.
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border border-stroke bg-slate-50/60 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            void startPractice();
          }}
          disabled={running || attemptsUsed >= MAX_ATTEMPTS}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent to-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Practice (Repeat after me)
        </button>

        <button
          type="button"
          onClick={hardResetPractice}
          disabled={state === "idle"}
          className="rounded-xl border border-stroke px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          Stop practice
        </button>

        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">Attempt {currentAttempt} of 3</span>
        <span className="rounded-full bg-accentSoft px-3 py-1 text-xs font-semibold text-teal-700">Best {bestScore}/100</span>
      </div>

      {state === "playing_audio" ? <p className="mt-3 text-sm text-slate-700">Playing phrase for 4 seconds...</p> : null}
      {state === "listening" ? <p className="mt-3 text-sm text-slate-700">Now record your practice... ({secondsLeft}s)</p> : null}

      {(state === "listening" || interimTranscript || finalTranscript) ? (
        <p className="mt-2 text-sm text-slate-700">
          Heard: <span className="font-medium text-slate-900">{finalTranscript || "..."}</span>
          {interimTranscript ? <span className="text-slate-500"> {interimTranscript}</span> : null}
        </p>
      ) : null}

      {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}

      {finalTranscript && latestScore !== null ? (
        <p className="mt-3 text-sm text-slate-700">
          Score: <span className="font-semibold text-slate-900">{latestScore}/100</span> ({latestLabel})
        </p>
      ) : null}

      {canTryAgain ? (
        <button
          type="button"
          onClick={() => {
            void startPractice();
          }}
          className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
        >
          Try again
        </button>
      ) : null}

      {attemptsUsed >= MAX_ATTEMPTS ? (
        <p className="mt-3 text-xs font-medium text-muted">Practice limit reached for today.</p>
      ) : null}
    </div>
  );
};
