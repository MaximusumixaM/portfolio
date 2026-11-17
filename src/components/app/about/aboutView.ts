import { useEffect, useSyncExternalStore } from "react";

// Whether About is open, and the 0–1 transition between the portfolio and it, played over time.
// The canvas reads it each frame; DOM layers subscribe and write their own transforms.

const TRANSITION_SECONDS = 0.9;

let isOpen = false;
let progress = 0;
let frame: number | null = null;
let lastTime: number | null = null;
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

function step(time: number): void {
  const seconds = lastTime === null ? 0 : (time - lastTime) / 1000;
  lastTime = time;
  const target = isOpen ? 1 : 0;
  const travel = seconds / TRANSITION_SECONDS;
  progress =
    target > progress
      ? Math.min(target, progress + travel)
      : Math.max(target, progress - travel);
  notify();
  if (progress === target) {
    frame = null;
    lastTime = null;
    return;
  }
  frame = requestAnimationFrame(step);
}

function playTowards(open: boolean): void {
  if (isOpen === open) return;
  isOpen = open;
  frame ??= requestAnimationFrame(step);
}

export function openAbout(): void {
  playTowards(true);
}

export function closeAbout(): void {
  playTowards(false);
}

/** Lands straight on About, for a page that loads at /about. */
export function showAboutImmediately(): void {
  isOpen = true;
  progress = 1;
  notify();
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
}

/** Eased 0–1: 0 is the portfolio, 1 is About. Imperative, for per-frame readers. */
export function getAboutProgress(): number {
  return easeInOutCubic(progress);
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Where the transition is heading: true from the moment About is asked for. */
export function useIsAboutOpen(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => isOpen,
    () => false,
  );
}

/**
 * Calls `apply` with the eased progress now and on every step of the transition, without
 * re-rendering — for layers that move or fade with it. Keep `apply` stable (`useCallback`).
 */
export function useAboutProgressEffect(apply: (eased: number) => void): void {
  useEffect(() => {
    apply(getAboutProgress());
    return subscribe(() => {
      apply(getAboutProgress());
    });
  }, [apply]);
}
