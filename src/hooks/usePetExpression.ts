import { useEffect, useRef, useState } from "react";
import type { PetReaction } from "./usePetAnimation";

export type PetMode = "idle" | "focus" | "rest";
export type PetPose =
  | "idle-1"
  | "idle-2"
  | "idle-3"
  | "blink"
  | "blink-half"
  | "thinking"
  | "happy"
  | "wave"
  | "excited"
  | "success"
  | "tap"
  | "double-jump"
  | "sleepy"
  | "rest";
export type PetMood = "idle" | "focus" | "rest" | "thinking" | "happy" | "success";

type PetExpressionSnapshot = {
  pose: PetPose;
  mood: PetMood;
};

const BLINK_MIN_DELAY_MS = 2600;
const BLINK_MAX_DELAY_MS = 6800;
const IDLE_POSE_MIN_DELAY_MS = 4600;
const IDLE_POSE_MAX_DELAY_MS = 9000;
const REST_POSE_MIN_DELAY_MS = 7200;
const REST_POSE_MAX_DELAY_MS = 12000;

function randomBetween(min: number, max: number) {
  return Math.round(min + Math.random() * (max - min));
}

function pickIdlePose(): PetPose {
  const roll = Math.random();
  if (roll < 0.48) return "idle-1";
  if (roll < 0.68) return "idle-2";
  if (roll < 0.86) return "idle-3";
  return "wave";
}

export function usePetExpression(
  mode: PetMode,
  thinking: boolean,
  reaction: PetReaction,
): PetExpressionSnapshot {
  const [blinkPose, setBlinkPose] = useState<"blink" | "blink-half" | null>(null);
  const [idlePose, setIdlePose] = useState<PetPose>("idle-1");
  const [restPose, setRestPose] = useState<"sleepy" | "rest">("rest");
  const [reactionPose, setReactionPose] = useState<PetPose | null>(null);

  const blinkScheduleTimer = useRef<number | null>(null);
  const blinkResetTimer = useRef<number | null>(null);
  const idleTimer = useRef<number | null>(null);
  const restTimer = useRef<number | null>(null);

  useEffect(() => {
    if (reaction === "tap") {
      setReactionPose("tap");
      return;
    }

    if (reaction === "happy") {
      setReactionPose(Math.random() < 0.5 ? "happy" : "double-jump");
      return;
    }

    if (reaction === "success") {
      setReactionPose(Math.random() < 0.55 ? "success" : "excited");
      return;
    }

    setReactionPose(null);
  }, [reaction]);

  useEffect(() => {
    if (idleTimer.current !== null) window.clearTimeout(idleTimer.current);

    if (mode !== "idle" || thinking || reaction !== "none") return;

    let disposed = false;

    const scheduleNext = () => {
      idleTimer.current = window.setTimeout(() => {
        if (disposed) return;
        setIdlePose(pickIdlePose());
        scheduleNext();
      }, randomBetween(IDLE_POSE_MIN_DELAY_MS, IDLE_POSE_MAX_DELAY_MS));
    };

    scheduleNext();

    return () => {
      disposed = true;
      if (idleTimer.current !== null) window.clearTimeout(idleTimer.current);
      idleTimer.current = null;
    };
  }, [mode, reaction, thinking]);

  useEffect(() => {
    if (restTimer.current !== null) window.clearTimeout(restTimer.current);

    if (mode !== "rest" || thinking || reaction !== "none") {
      setRestPose("rest");
      return;
    }

    let disposed = false;

    const scheduleNext = () => {
      restTimer.current = window.setTimeout(() => {
        if (disposed) return;
        setRestPose((current) => (current === "rest" ? "sleepy" : "rest"));
        scheduleNext();
      }, randomBetween(REST_POSE_MIN_DELAY_MS, REST_POSE_MAX_DELAY_MS));
    };

    scheduleNext();

    return () => {
      disposed = true;
      if (restTimer.current !== null) window.clearTimeout(restTimer.current);
      restTimer.current = null;
    };
  }, [mode, reaction, thinking]);

  useEffect(() => {
    if (blinkScheduleTimer.current !== null) window.clearTimeout(blinkScheduleTimer.current);
    if (blinkResetTimer.current !== null) window.clearTimeout(blinkResetTimer.current);

    setBlinkPose(null);

    if (thinking || mode === "rest" || reaction !== "none") return;

    let disposed = false;

    const scheduleNext = () => {
      blinkScheduleTimer.current = window.setTimeout(() => {
        if (disposed) return;

        setBlinkPose(Math.random() < 0.72 ? "blink" : "blink-half");
        blinkResetTimer.current = window.setTimeout(() => {
          if (disposed) return;
          setBlinkPose(null);
          scheduleNext();
        }, randomBetween(90, 145));
      }, randomBetween(BLINK_MIN_DELAY_MS, BLINK_MAX_DELAY_MS));
    };

    scheduleNext();

    return () => {
      disposed = true;
      if (blinkScheduleTimer.current !== null) window.clearTimeout(blinkScheduleTimer.current);
      if (blinkResetTimer.current !== null) window.clearTimeout(blinkResetTimer.current);
      blinkScheduleTimer.current = null;
      blinkResetTimer.current = null;
    };
  }, [mode, reaction, thinking]);

  let mood: PetMood = mode;
  if (thinking) mood = "thinking";
  else if (reaction === "success") mood = "success";
  else if (reaction === "happy") mood = "happy";

  let pose: PetPose = idlePose;

  if (thinking) pose = "thinking";
  else if (reactionPose) pose = reactionPose;
  else if (mode === "rest") pose = restPose;
  else if (blinkPose) pose = blinkPose;
  else if (mode === "focus") pose = "idle-2";

  return { pose, mood };
}
