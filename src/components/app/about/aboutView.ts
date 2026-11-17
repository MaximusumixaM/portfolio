import { useEffect, useSyncExternalStore } from "react";

// Whether About is open, the 0–1 transition between the portfolio and it, which place is selected,
// and the 0–1 arrival of that place's marks on the globe (provinces, shading, pin, line), all
// played over time. The canvas reads them each frame; DOM layers subscribe.

const TRANSITION_SECONDS = 0.9;
/** The marks start arriving partway through the pan, as the globe settles. */
const MARKS_START = 0.6;
const MARKS_SECONDS = 1.2;
/** Leaving (or switching place), the marks clear quickly while the globe moves on. */
const MARKS_RETRACT_SECONDS = 0.35;

let isOpen = false;
let progress = 0;
let marks = 0;
/** The place the visitor picked; the globe turns to it straight away. */
let activeChapter = 0;
/** The place whose marks are on the globe — catches up with `activeChapter` once they've cleared. */
let shownChapter = 0;
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
  const isSwitching = shownChapter !== activeChapter;
  if (!isOpen || isSwitching) {
    marks = Math.max(0, marks - seconds / MARKS_RETRACT_SECONDS);
    if (marks === 0) shownChapter = activeChapter;
  } else if (progress >= MARKS_START) {
    marks = Math.min(1, marks + seconds / MARKS_SECONDS);
  }
  notify();
  const isSettled =
    progress === target &&
    shownChapter === activeChapter &&
    marks === (isOpen ? 1 : 0);
  if (isSettled) {
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

/** Picks a place: the globe turns to it, the current marks clear, and its own arrive. */
export function selectChapter(index: number): void {
  if (index === activeChapter) return;
  activeChapter = index;
  frame ??= requestAnimationFrame(step);
}

export function closeAbout(): void {
  playTowards(false);
}

/** Lands straight on About, for a page that loads at /about. */
export function showAboutImmediately(): void {
  isOpen = true;
  progress = 1;
  marks = 1;
  notify();
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
}

/** Eased 0–1: 0 is the portfolio, 1 is About. Imperative, for per-frame readers. */
export function getAboutProgress(): number {
  return easeInOutCubic(progress);
}

/** Linear 0–1 through the city marks' arrival; readers split it into beats. */
export function getAboutMarks(): number {
  return marks;
}

/** Where the transition is heading, imperatively: true from the moment About is asked for. */
export function getIsAboutOpen(): boolean {
  return isOpen;
}

export function getActiveChapter(): number {
  return activeChapter;
}

export function getShownChapter(): number {
  return shownChapter;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useActiveChapter(): number {
  return useSyncExternalStore(
    subscribe,
    () => activeChapter,
    () => 0,
  );
}

export function useShownChapter(): number {
  return useSyncExternalStore(
    subscribe,
    () => shownChapter,
    () => 0,
  );
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
