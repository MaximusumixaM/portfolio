import type Lenis from "lenis";
import { useCallback, useSyncExternalStore } from "react";

// Shared 0–1 intro progress (ScrollTrigger writes it); canvas reads imperatively, DOM via the hooks.

/** Id of the tall track in HeroExperience that the pinned scene scrolls through. */
export const HERO_TRACK_ID = "hero-track";

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

/** Server render always starts at 0 — the scene is at rest before any scrolling. */
function getServerProgress(): number {
  return 0;
}

function getServerFlag(): boolean {
  return false;
}

export function useHeroProgress(): number {
  return useSyncExternalStore(subscribe, getHeroProgress, getServerProgress);
}

/**
 * Whether the intro has run past `threshold`. Re-renders only on the crossing, so components
 * gating on a beat don't re-render on every scroll frame the way `useHeroProgress` does.
 */
export function useHeroPast(threshold: number): boolean {
  const getSnapshot = useCallback(() => heroProgress > threshold, [threshold]);
  return useSyncExternalStore(subscribe, getSnapshot, getServerFlag);
}

/** Smoothstep, so transforms ease at both ends rather than tracking scroll linearly. */
export function easeSettle(progress: number): number {
  return progress * progress * (3 - 2 * progress);
}

// Scroll sub-ranges staging the intro. The circle the arcs draw becomes the globe's silhouette:
// rings draw onto it, the wordmark leaves for the nav while the globe slides out from under it,
// then the borders draw and the pins arrive. Overlaps are deliberate — the beats should knit.
export const PHASES = {
  arcs: [0.0, 0.11],
  graticule: [0.1, 0.285],
  rise: [0.2, 0.43],
  shift: [0.29, 0.43],
  countries: [0.41, 0.7],
  reveal: [0.71, 0.9],
} as const;

/** Fraction of the settle where the pill fades in behind the arriving logo. */
export const NAV_PILL_APPEAR_AT =
  PHASES.rise[0] + 0.7 * (PHASES.rise[1] - PHASES.rise[0]);
/** Progress where the logo has parked and the pill's border starts drawing. */
export const NAV_PILL_BORDER_AT = PHASES.rise[1] + 0.02;

/** Remaps `progress` to 0–1 across the given sub-range, clamped outside it. */
export function phase(
  progress: number,
  [start, end]: readonly [number, number],
): number {
  if (end <= start) return progress >= end ? 1 : 0;
  return Math.min(1, Math.max(0, (progress - start) / (end - start)));
}

// Live Lenis instance, set by HeroScrollController; type-only import keeps lenis out of the server bundle.
let lenis: Lenis | null = null;

export function registerLenis(instance: Lenis | null): void {
  lenis = instance;
}

/** Runs the intro out to its end state, for anyone who'd rather not scroll it themselves. */
export function scrollPastIntro(): void {
  const track = document.getElementById(HERO_TRACK_ID);
  if (track === null) return;
  const target = track.offsetTop + track.offsetHeight - window.innerHeight;
  if (lenis !== null) lenis.scrollTo(target, { duration: 2.4 });
  else window.scrollTo({ top: target, behavior: "smooth" });
}
