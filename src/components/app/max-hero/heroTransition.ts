import type Lenis from "lenis";
import { useSyncExternalStore } from "react";

/**
 * Shared state for the hero → nav transition.
 *
 * GSAP ScrollTrigger owns the scroll maths (see HeroScrollController) and pushes a single
 * 0–1 progress value in here. Both the 3D wordmark (canvas island) and the DOM chrome
 * (HUD, nav pill) are separate React roots, so they read from this module singleton
 * rather than sharing context. The canvas reads it imperatively inside useFrame; the DOM
 * subscribes via `useHeroProgress`.
 */

/** Id of the tall track in MaxHero.astro that the pinned hero scrolls through. */
export const HERO_TRACK_ID = "hero-track";
/** Id of the content below the hero, for the "Enter" cue to jump to. */
export const PORTFOLIO_ID = "portfolio";

/** Height of the settled logo in CSS pixels — the pill reserves exactly this. */
export const NAV_LOGO_HEIGHT_PX = 32;

/**
 * The pill's own box metrics, mirroring its Tailwind classes in NavPill: `top-m` (16px),
 * a 1px border, and `py-s` (8px). Kept here so the logo's resting centre is computed
 * rather than hand-tuned — otherwise resizing the logo silently misaligns the two.
 * If the pill's offset, border or padding classes change, update these to match.
 */
const NAV_PILL_TOP_PX = 16;
const NAV_PILL_BORDER_PX = 1;
const NAV_PILL_PADDING_Y_PX = 8;

/** Vertical centre of the settled logo, in CSS pixels from the top of the viewport. */
export const NAV_LOGO_CENTER_Y_PX =
  NAV_PILL_TOP_PX +
  NAV_PILL_BORDER_PX +
  NAV_PILL_PADDING_Y_PX +
  NAV_LOGO_HEIGHT_PX / 2;

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

/**
 * The live Lenis instance, registered by HeroScrollController. Held here (behind a
 * type-only import, so nothing from lenis reaches the server bundle) to keep the
 * server-rendered HUD from having to import the controller's client-only dependencies.
 */
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
