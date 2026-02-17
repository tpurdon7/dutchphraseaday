"use client";

import { useEffect, useMemo, useState } from "react";
import { buildDailyClozeExercise } from "@/lib/daily-checkin";

type DailyCheckInProps = {
  phrase: string;
  completed: boolean;
  onComplete: () => void;
};

type FeedbackState = "idle" | "correct" | "wrong" | "revealed";

export const DailyCheckIn = ({ phrase, completed, onComplete }: DailyCheckInProps) => {
  const exercise = useMemo(() => buildDailyClozeExercise(phrase), [phrase]);
  const [feedback, setFeedback] = useState<FeedbackState>(completed ? "correct" : "idle");
  const [selected, setSelected] = useState<string | null>(null);
  const [wrongAttempts, setWrongAttempts] = useState(0);

  useEffect(() => {
    if (completed) {
      setFeedback("correct");
      return;
    }
    setFeedback("idle");
    setSelected(null);
    setWrongAttempts(0);
  }, [phrase, completed]);

  const handlePick = (option: string) => {
    if (completed || feedback === "correct" || feedback === "revealed") {
      return;
    }

    setSelected(option);

    if (option === exercise.answer) {
      setFeedback("correct");
      onComplete();
      return;
    }

    if (wrongAttempts === 0) {
      setWrongAttempts(1);
      setFeedback("wrong");
      return;
    }

    setFeedback("revealed");
  };

  const retryExercise = () => {
    if (completed || feedback !== "revealed") {
      return;
    }
    setFeedback("idle");
    setSelected(null);
    setWrongAttempts(0);
  };

  return (
    <section className="rounded-3xl border border-stroke bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-ink">Daily Check-in</h2>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            feedback === "correct" || completed ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
          }`}
        >
          {feedback === "correct" || completed ? "Complete" : "Required"}
        </span>
      </div>

      <p className="mt-2 text-sm text-slate-700">Fill the missing word to unlock today&apos;s completion.</p>

      <div className="mt-3 rounded-2xl border border-stroke bg-slate-50 p-4">
        <p className="text-lg font-medium text-slate-900">{exercise.maskedPhrase}</p>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {exercise.options.map((option) => {
          const isSelected = selected === option;
          const isCorrect = feedback === "correct" && option === exercise.answer;
          const isRevealAnswer = feedback === "revealed" && option === exercise.answer;

          return (
            <button
              key={option}
              type="button"
              onClick={() => handlePick(option)}
              disabled={completed || feedback === "correct" || feedback === "revealed"}
              className={`rounded-xl border px-3 py-2 text-left text-sm font-medium transition ${
                isCorrect || isRevealAnswer
                  ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                  : isSelected && feedback === "wrong"
                    ? "border-rose-300 bg-rose-50 text-rose-700"
                    : "border-stroke bg-white text-slate-700 hover:bg-slate-50"
              } disabled:cursor-not-allowed disabled:opacity-90`}
            >
              {option}
            </button>
          );
        })}
      </div>

      {feedback === "correct" || completed ? (
        <p className="mt-3 animate-pulseSoft text-sm font-medium text-emerald-700">Correct. You unlocked today&apos;s mark-as-learned step.</p>
      ) : null}

      {feedback === "wrong" ? (
        <p className="mt-3 text-sm text-rose-700">Not quite. You have one retry.</p>
      ) : null}

      {feedback === "revealed" ? (
        <div className="mt-3 space-y-2">
          <p className="text-sm text-slate-700">
            Nice try. The correct answer is <span className="font-semibold text-slate-900">{exercise.answer}</span>.
          </p>
          <button
            type="button"
            onClick={retryExercise}
            className="rounded-xl border border-stroke bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Try again
          </button>
        </div>
      ) : null}
    </section>
  );
};
