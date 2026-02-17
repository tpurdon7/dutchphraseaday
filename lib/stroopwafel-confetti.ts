"use client";

import confetti from "canvas-confetti";

const ORANGE_BLUE_COLORS = ["#ff7a00", "#ff9f1c", "#21468b", "#3b82f6"];

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export const fireStroopwafelConfetti = (originX: number, originY: number): void => {
  if (typeof window === "undefined") {
    return;
  }

  const x = clamp(originX / window.innerWidth, 0.05, 0.95);
  const y = clamp(originY / window.innerHeight, 0.05, 0.95);

  const confettiWithShape = confetti as typeof confetti & {
    shapeFromText?: (options: { text: string; scalar?: number }) => unknown;
  };

  const waffleShape = confettiWithShape.shapeFromText?.({ text: "🧇", scalar: 1.9 });

  confetti({
    particleCount: 24,
    spread: 62,
    startVelocity: 38,
    gravity: 1.05,
    scalar: 1.15,
    origin: { x, y },
    colors: ORANGE_BLUE_COLORS,
    ...(waffleShape ? { shapes: [waffleShape] } : {})
  });

  confetti({
    particleCount: 40,
    spread: 80,
    startVelocity: 30,
    decay: 0.9,
    gravity: 0.95,
    scalar: 0.9,
    origin: { x, y },
    colors: ORANGE_BLUE_COLORS
  });
};
