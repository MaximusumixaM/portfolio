import type Lenis from "lenis";

import { sectionTrackId, type SectionId } from "./timeline";

// Live Lenis instance, set by ScrollController; type-only import keeps lenis out of the server bundle.
let lenis: Lenis | null = null;

export function registerLenis(instance: Lenis | null): void {
  lenis = instance;
}

const GLIDE_SECONDS = 2.4;

/** Document scroll position where a section's pinned screen has played out, or null if absent. */
function sectionEndTop(id: SectionId): number | null {
  const track = document.getElementById(sectionTrackId(id));
  if (track === null) return null;
  return (
    track.getBoundingClientRect().top +
    window.scrollY +
    track.offsetHeight -
    window.innerHeight
  );
}

/** Runs a section out to its end state, for anyone who'd rather not scroll it themselves. */
export async function scrollToSectionEnd(id: SectionId): Promise<void> {
  const top = sectionEndTop(id);
  if (top === null) return;
  if (lenis === null) {
    window.scrollTo({ top, behavior: "smooth" });
    return;
  }
  const instance = lenis;
  await new Promise<void>((resolve) => {
    instance.scrollTo(top, {
      duration: GLIDE_SECONDS,
      onComplete: () => {
        resolve();
      },
    });
  });
}

/** Lands on a section's end state at once. */
export function jumpToSectionEnd(id: SectionId): void {
  const top = sectionEndTop(id);
  if (top === null) return;
  if (lenis === null) window.scrollTo({ top, behavior: "instant" });
  else lenis.scrollTo(top, { immediate: true, force: true });
}

/** Brings an element into view at once, centred, unless it's already fully on screen. */
export function revealElement(element: HTMLElement): void {
  const box = element.getBoundingClientRect();
  if (box.top >= 0 && box.bottom <= window.innerHeight) return;
  const top =
    box.top +
    window.scrollY -
    Math.max(0, (window.innerHeight - box.height) / 2);
  // Through Lenis when it's running the page, or it would carry on from its old position.
  if (lenis === null) window.scrollTo({ top, behavior: "instant" });
  else lenis.scrollTo(top, { immediate: true, force: true });
}

/** Holds the page still (or lets it go) — while About is over it, the portfolio stays put. */
export function setScrollLocked(isLocked: boolean): void {
  if (isLocked) lenis?.stop();
  else lenis?.start();
  // Without Lenis (reduced motion), native scrolling has to be held directly.
  document.documentElement.style.overflow = isLocked ? "hidden" : "";
}
