"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type PronunciationButtonProps = {
  text: string;
  disabled?: boolean;
};

const getDutchVoice = (voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null => {
  const exact = voices.find((voice) => voice.lang.toLowerCase() === "nl-nl");
  if (exact) {
    return exact;
  }

  const dutch = voices.find((voice) => voice.lang.toLowerCase().startsWith("nl"));
  return dutch ?? null;
};

export const PronunciationButton = ({ text, disabled = false }: PronunciationButtonProps) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const mountedRef = useRef(true);

  const setSpeakingSafe = useCallback((value: boolean) => {
    if (!mountedRef.current) {
      return;
    }
    setIsSpeaking(value);
  }, []);

  const stopSpeaking = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setSpeakingSafe(false);
  }, [setSpeakingSafe]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const hasSupport = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
    setIsSupported(hasSupport);

    if (!hasSupport) {
      return;
    }

    const synthesis = window.speechSynthesis;
    const syncVoices = () => setVoices(synthesis.getVoices());
    syncVoices();

    if (typeof synthesis.addEventListener === "function") {
      synthesis.addEventListener("voiceschanged", syncVoices);
      return () => {
        synthesis.removeEventListener("voiceschanged", syncVoices);
      };
    }

    const previous = synthesis.onvoiceschanged;
    synthesis.onvoiceschanged = syncVoices;
    return () => {
      synthesis.onvoiceschanged = previous;
    };
  }, []);

  useEffect(() => {
    stopSpeaking();
  }, [text, stopSpeaking]);

  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, [stopSpeaking]);

  const preferredVoice = useMemo(() => getDutchVoice(voices), [voices]);

  const speak = useCallback(() => {
    if (!isSupported || isSpeaking || disabled || typeof window === "undefined") {
      return;
    }

    const synthesis = window.speechSynthesis;
    synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    if (preferredVoice) {
      utterance.voice = preferredVoice;
      utterance.lang = preferredVoice.lang;
    } else {
      utterance.lang = "nl-NL";
    }

    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.onstart = () => setSpeakingSafe(true);
    utterance.onend = () => {
      utteranceRef.current = null;
      setSpeakingSafe(false);
    };
    utterance.onerror = () => {
      utteranceRef.current = null;
      setSpeakingSafe(false);
    };

    utteranceRef.current = utterance;
    setSpeakingSafe(true);
    synthesis.speak(utterance);
  }, [disabled, isSpeaking, isSupported, preferredVoice, setSpeakingSafe, text]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={speak}
        disabled={!isSupported || isSpeaking || disabled}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-stroke bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-accent/40 hover:bg-accentSoft/30 disabled:cursor-not-allowed disabled:opacity-65"
        aria-live="polite"
      >
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className={`h-5 w-5 ${isSpeaking ? "animate-pulse text-accent" : "text-slate-500"}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M11 5 6 9H3v6h3l5 4V5Z" />
          <path d="M15.5 8.5a5 5 0 0 1 0 7" />
          <path d="M18.5 6a8.5 8.5 0 0 1 0 12" />
        </svg>
        <span>Play pronunciation</span>
        {isSpeaking ? <span className="text-xs font-medium text-accent">Playing...</span> : null}
      </button>
      {!isSupported ? (
        <p className="mt-2 text-xs text-muted">Pronunciation is not supported in this browser.</p>
      ) : null}
    </div>
  );
};
