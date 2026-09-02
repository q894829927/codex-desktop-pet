import { useCallback, useEffect, useRef, useState } from "react";

export type PetAmbientMotion = "none" | "breathe" | "sway-left" | "sway-right";
export type PetReaction = "none" | "tap" | "happy" | "success";

type AnimationSnapshot = {
  ambient: PetAmbientMotion;
  ambientDurationMs: number;
  reaction: PetReaction;
  triggerReaction: (reaction: Exclude<PetReaction, "none">, durationMs?: number) => void;
};

const AMBIENT_MIN_DELAY_MS = 1700;
const AMBIENT_MAX_DELAY_MS = 4300;

function randomBetween(min: number, max: number) {
  return Math.round(min + Math.random() * (max - min));
}

function pickAmbientMotion(): PetAmbientMotion {
  const roll = Math.random();
  if (roll < 0.56) return "breathe";
  return roll < 0.78 ? "sway-left" : "sway-right";
}

function ambientDuration(motion: PetAmbientMotion) {
  if (motion === "breathe") return randomBetween(1500, 2300);
  return randomBetween(1050, 1550);
}

export function usePetAnimation(paused: boolean): AnimationSnapshot {
  const [ambient, setAmbient] = useState<PetAmbientMotion>("none");
  const [ambientDurationMs, setAmbientDurationMs] = useState(1800);
  const [reaction, setReaction] = useState<PetReaction>("none");

  const ambientTimer = useRef<number | null>(null);
  const ambientResetTimer = useRef<number | null>(null);
  const reactionTimer = useRef<number | null>(null);

  const clearAmbientTimers = useCallback(() => {
    if (ambientTimer.current !== null) window.clearTimeout(ambientTimer.current);
    if (ambientResetTimer.current !== null) window.clearTimeout(ambientResetTimer.current);
    ambientTimer.current = null;
    ambientResetTimer.current = null;
  }, []);

  const clearReactionTimer = useCallback(() => {
    if (reactionTimer.current !== null) window.clearTimeout(reactionTimer.current);
    reactionTimer.current = null;
  }, []);

  useEffect(() => {
    clearAmbientTimers();

    if (paused) {
      setAmbient("none");
      return;
    }

    let disposed = false;

    const scheduleNext = () => {
      if (disposed) return;
      ambientTimer.current = window.setTimeout(() => {
        const motion = pickAmbientMotion();
        const duration = ambientDuration(motion);
        setAmbientDurationMs(duration);
        setAmbient(motion);

        ambientResetTimer.current = window.setTimeout(() => {
          setAmbient("none");
          scheduleNext();
        }, duration + 80);
      }, randomBetween(AMBIENT_MIN_DELAY_MS, AMBIENT_MAX_DELAY_MS));
    };

    scheduleNext();

    return () => {
      disposed = true;
      clearAmbientTimers();
    };
  }, [paused, clearAmbientTimers]);

  const triggerReaction = useCallback(
    (next: Exclude<PetReaction, "none">, durationMs = 520) => {
      clearReactionTimer();
      setReaction("none");

      window.requestAnimationFrame(() => {
        setReaction(next);
        reactionTimer.current = window.setTimeout(() => {
          setReaction("none");
          reactionTimer.current = null;
        }, durationMs);
      });
    },
    [clearReactionTimer],
  );

  useEffect(
    () => () => {
      clearAmbientTimers();
      clearReactionTimer();
    },
    [clearAmbientTimers, clearReactionTimer],
  );

  return {
    ambient,
    ambientDurationMs,
    reaction,
    triggerReaction,
  };
}
