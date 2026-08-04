import type Lenis from "lenis";
import { useSyncExternalStore } from "react";

// Shared 0–1 hero→nav progress (ScrollTrigger writes it); canvas reads imperatively, DOM via useHeroProgress.

/** Id of the tall track in MaxHero.astro that the pinned hero scrolls through. */
export const HERO_TRACK_ID = "hero-track";
/** Id of the content below the hero, for the "Enter" cue to jump to. */
export const PORTFOLIO_ID = "portfolio";

/** Height of the settled logo in CSS pixels — the pill reserves exactly this. */
export const NAV_LOGO_HEIGHT_PX = 32;

// Mirrors NavPill's `top-m` (16) + `py-s` (8); the border is a non-layout SVG overlay.
const NAV_PILL_TOP_PX = 16;
const NAV_PILL_PADDING_Y_PX = 8;

/** Vertical centre of the settled logo, in CSS pixels from the top of the viewport. */
export const NAV_LOGO_CENTER_Y_PX =
  NAV_PILL_TOP_PX + NAV_PILL_PADDING_Y_PX + NAV_LOGO_HEIGHT_PX / 2;

let heroProgress = 0;
const listeners = new Set<() => void>();

export function setHeroProgress(progress: number): void {
  if (progress === heroProgress) return;
  heroProgress = progress;
  for (const notify of listeners) notify();
}

/** Imperative read, for per-frame consumers that must not trigger React renders. */
export function getHeroProgress(): number {
  return heroProgress;
}

function subscribe(notify: () => void): () => void {
  listeners.add(notify);
  return () => {
    listeners.delete(notify);
  };
}

/** Server render always starts at 0 — the hero is at rest before any scrolling. */
function getServerProgress(): number {
  return 0;
}

export function useHeroProgress(): number {
  return useSyncExternalStore(subscribe, getHeroProgress, getServerProgress);
}

/** Smoothstep, so the transform eases at both ends rather than tracking scroll linearly. */
export function easeSettle(progress: number): number {
  return progress * progress * (3 - 2 * progress);
}

// Scroll sub-ranges staging the intro (arcs → reveal → rise → morph); puck and letters share these beats.
export const PUCK_PHASES = {
  arcs: [0.0, 0.22],
  reveal: [0.2, 0.42],
  rise: [0.44, 0.7],
  morph: [0.72, 0.94],
} as const;

/** Remaps `progress` to 0–1 across the given sub-range, clamped outside it. */
export function phase(progress: number, [start, end]: readonly [number, number]): number {
  if (end <= start) return progress >= end ? 1 : 0;
  return Math.min(1, Math.max(0, (progress - start) / (end - start)));
}

// Live Lenis instance, set by HeroScrollController; type-only import keeps lenis out of the server bundle.
let lenis: Lenis | null = null;

export function registerLenis(instance: Lenis | null): void {
  lenis = instance;
}

/** Scrolls to an element through Lenis, so it doesn't fight the smoothing. */
export function scrollToElement(elementId: string): void {
  const target = document.getElementById(elementId);
  if (target === null) return;
  if (lenis !== null) lenis.scrollTo(target);
  else target.scrollIntoView({ behavior: "smooth", block: "start" });
}
