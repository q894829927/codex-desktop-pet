import { useEffect, useRef, useState } from "react";
import type { PetReaction } from "./usePetAnimation";

export type PetMode = "idle" | "focus" | "rest";
export type PetPose = "idle" | "blink" | "thinking" | "happy" | "success" | "rest";
export type PetMood = "idle" | "focus" | "rest" | "thinking" | "happy" | "success";

type PetExpressionSnapshot = {
  pose: PetPose;
  mood: PetMood;
};

const BLINK_MIN_DELAY_MS = 2600;
const BLINK_MAX_DELAY_MS = 6800;

function randomBetween(min: number, max: number) {
  return Math.round(min + Math.random() * (max - min));
}

export function usePetExpression(
  mode: PetMode,
  thinking: boolean,
  reaction: PetReaction,
): PetExpressionSnapshot {
  const [blinkActive, setBlinkActive] = useState(false);
  const scheduleTimer = useRef<number | null>(null);
  const blinkTimer = useRef<number | null>(null);
  const secondBlinkTimer = useRef<number | null>(null);

  useEffect(() => {
    let disposed = false;

    const clearTimers = () => {
      if (scheduleTimer.current !== null) window.clearTimeout(scheduleTimer.current);
      if (blinkTimer.current !== null) window.clearTimeout(blinkTimer.current);
      if (secondBlinkTimer.current !== null) window.clearTimeout(secondBlinkTimer.current);
      scheduleTimer.current = null;
      blinkTimer.current = null;
      secondBlinkTimer.current = null;
    };

    const scheduleNext = () => {
      if (
        disposed ||
        thinking ||
        mode === "rest" ||
        reaction === "happy" ||
        reaction === "success"
      ) {
        return;
      }

      scheduleTimer.current = window.setTimeout(() => {
        const closeFor = randomBetween(88, 128);
        const doubleBlink = Math.random() < 0.17;

        setBlinkActive(true);
        blinkTimer.current = window.setTimeout(() => {
          setBlinkActive(false);

          if (doubleBlink) {
            secondBlinkTimer.current = window.setTimeout(() => {
              setBlinkActive(true);
              blinkTimer.current = window.setTimeout(() => {
                setBlinkActive(false);
                scheduleNext();
              }, randomBetween(82, 112));
            }, randomBetween(92, 138));
            return;
          }

          scheduleNext();
        }, closeFor);
      }, randomBetween(BLINK_MIN_DELAY_MS, BLINK_MAX_DELAY_MS));
    };

    clearTimers();
    setBlinkActive(false);
    scheduleNext();

    return () => {
      disposed = true;
      clearTimers();
    };
  }, [mode, reaction, thinking]);

  let mood: PetMood = mode;
  if (thinking) mood = "thinking";
  else if (reaction === "success") mood = "success";
  else if (reaction === "happy") mood = "happy";

  let pose: PetPose = "idle";
  if (mood === "thinking") pose = "thinking";
  else if (mood === "success") pose = "success";
  else if (mood === "happy") pose = "happy";
  else if (mood === "rest") pose = "rest";
  else if (blinkActive) pose = "blink";

  return { pose, mood };
}
