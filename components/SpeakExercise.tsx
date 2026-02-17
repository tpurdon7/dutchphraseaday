"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { DictationToken } from "@/lib/dictation/types";

type SpeakExerciseProps = {
  expectedText: string;
  onResult?: (score: number, transcript: string) => void;
};

type ExerciseState = "idle" | "recording" | "processing" | "result" | "error";

const MAX_RECORD_SECONDS = 10;
const MIME_TYPES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"] as const;

const pickMimeType = (): string | null => {
  if (typeof MediaRecorder === "undefined") {
    return null;
  }
  for (const mime of MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(mime)) {
      return mime;
    }
  }
  return null;
};

const tokenClassName = (status: DictationToken["status"]): string => {
  if (status === "correct") {
    return "bg-emerald-100 text-emerald-800";
  }
  if (status === "missing") {
    return "bg-slate-200 text-slate-600";
  }
  return "bg-rose-100 text-rose-800";
};

const fileExtensionFromMimeType = (mimeType: string): string => {
  if (mimeType.includes("mp4")) {
    return "mp4";
  }
  return "webm";
};

export const SpeakExercise = ({ expectedText, onResult }: SpeakExerciseProps) => {
  const [state, setState] = useState<ExerciseState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [score, setScore] = useState<number | null>(null);
  const [tokens, setTokens] = useState<DictationToken[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);
  const isMountedRef = useRef(true);

  const cleanupStream = () => {
    if (mediaStreamRef.current) {
      for (const track of mediaStreamRef.current.getTracks()) {
        track.stop();
      }
    }
    mediaStreamRef.current = null;
  };

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const resetResult = () => {
    setError(null);
    setTranscript("");
    setScore(null);
    setTokens([]);
  };

  const uploadAndScore = async (audioBlob: Blob, mimeType: string) => {
    setState("processing");
    setError(null);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 35000);

    const formData = new FormData();
    const ext = fileExtensionFromMimeType(mimeType);
    formData.append("audio", new File([audioBlob], `dictation.${ext}`, { type: mimeType }));
    formData.append("expectedText", expectedText);
    formData.append("language", "nl");

    const response = await fetch("/api/dictation/transcribe", {
      method: "POST",
      body: formData,
      signal: controller.signal
    }).finally(() => {
      window.clearTimeout(timeoutId);
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error || "Could not transcribe recording.");
    }

    const nextTranscript = String(payload.transcript ?? "");
    const nextScore = Number.isFinite(payload.score) ? Number(payload.score) : 0;
    const nextTokens: DictationToken[] = Array.isArray(payload.tokens) ? payload.tokens : [];

    if (!isMountedRef.current) {
      return;
    }

    setTranscript(nextTranscript);
    setScore(nextScore);
    setTokens(nextTokens);
    setState("result");
    onResult?.(nextScore, nextTranscript);
  };

  const stopRecording = async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      return;
    }
    clearTimer();
    try {
      recorder.stop();
    } catch {
      setState("error");
      setError("Recording failure. Please try again.");
    }
  };

  const startRecording = async () => {
    if (state === "processing") {
      return;
    }

    resetResult();

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setState("error");
      setError("This browser does not support microphone recording.");
      return;
    }

    const mimeType = pickMimeType();
    if (!mimeType) {
      setState("error");
      setError("No supported audio format found in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      startedAtRef.current = Date.now();
      setSeconds(0);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        clearTimer();
        cleanupStream();
        setState("error");
        setError("Recording failure. Please try again.");
      };

      recorder.onstop = () => {
        cleanupStream();
        const blob = new Blob(chunksRef.current, { type: mimeType });
        chunksRef.current = [];

        if (!blob.size) {
          setState("error");
          setError("No audio captured. Try again and speak clearly.");
          return;
        }

        void uploadAndScore(blob, mimeType).catch((caught) => {
          if (!isMountedRef.current) {
            return;
          }
          setState("error");
          const message =
            caught instanceof DOMException && caught.name === "AbortError"
              ? "Transcription timed out. Please try a shorter recording."
              : caught instanceof Error
                ? caught.message
                : "Transcription failed.";
          setError(message);
        });
      };

      recorder.start(250);
      setState("recording");

      timerRef.current = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
        setSeconds(elapsed);
        if (elapsed >= MAX_RECORD_SECONDS) {
          void stopRecording();
        }
      }, 250);
    } catch (caught) {
      cleanupStream();
      const message =
        caught instanceof DOMException &&
        (caught.name === "NotAllowedError" || caught.name === "PermissionDeniedError")
          ? "Microphone access denied. Allow mic permission and try again."
          : "Could not start recording.";
      setState("error");
      setError(message);
    }
  };

  const statusLabel = useMemo(() => {
    if (state === "recording") {
      return `Listening... ${seconds}s / ${MAX_RECORD_SECONDS}s`;
    }
    if (state === "processing") {
      return "Processing...";
    }
    if (state === "result") {
      return "Done";
    }
    return "Tap to speak";
  }, [seconds, state]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      clearTimer();
      cleanupStream();
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        try {
          recorder.stop();
        } catch {
          // no-op
        }
      }
    };
  }, []);

  useEffect(() => {
    setState("idle");
    resetResult();
    setSeconds(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expectedText]);

  const handleMicClick = () => {
    if (state === "recording") {
      void stopRecording();
      return;
    }
    void startRecording();
  };

  const disabled = state === "processing";

  return (
    <section className="mt-4 rounded-3xl border border-stroke bg-card p-5 shadow-soft">
      <div className="flex flex-col items-center">
        <p className="text-sm font-semibold text-ink">Speak Exercise</p>
        <p className="mt-1 text-xs text-muted">Say the sentence clearly in Dutch.</p>

        <button
          type="button"
          onClick={handleMicClick}
          disabled={disabled}
          className={`mt-4 inline-flex h-24 w-24 items-center justify-center rounded-full border text-white shadow-soft transition ${
            state === "recording"
              ? "border-rose-500 bg-rose-500 hover:bg-rose-600"
              : "border-slate-900 bg-slate-900 hover:bg-slate-800"
          } disabled:cursor-not-allowed disabled:opacity-60`}
          aria-label={state === "recording" ? "Stop recording" : "Start recording"}
        >
          <svg aria-hidden viewBox="0 0 24 24" className={`h-10 w-10 ${state === "recording" ? "animate-pulse" : ""}`} fill="none">
            <path
              d="M12 3a3 3 0 0 0-3 3v6a3 3 0 1 0 6 0V6a3 3 0 0 0-3-3Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M19 10v1a7 7 0 0 1-14 0v-1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M12 18v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>

        <p className="mt-3 text-sm font-medium text-slate-700">{statusLabel}</p>
      </div>

      {state === "error" && error ? (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3">
          <p className="text-sm text-rose-700">{error}</p>
          <button
            type="button"
            onClick={() => {
              setState("idle");
              setError(null);
            }}
            className="mt-2 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700"
          >
            Retry
          </button>
        </div>
      ) : null}

      {state === "result" ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-slate-700">
            Score: <span className="font-semibold text-slate-900">{score ?? 0}%</span>
          </p>
          <p className="text-sm text-slate-700">
            Transcript: <span className="font-medium text-slate-900">{transcript || "(No speech detected)"}</span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {tokens.map((token, index) => {
              const text = token.status === "missing" ? token.expected : token.word;
              const display = text || (token.status === "missing" ? "(missing)" : "(extra)");
              return (
                <span key={`${token.status}-${token.expected}-${token.word}-${index}`} className={`rounded-md px-2 py-1 text-xs ${tokenClassName(token.status)}`}>
                  {display}
                </span>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
};
