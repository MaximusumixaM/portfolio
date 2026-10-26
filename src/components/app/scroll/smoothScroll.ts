import type Lenis from "lenis";

import { sectionTrackId, type SectionId } from "./timeline";

// Live Lenis instance, set by ScrollController; type-only import keeps lenis out of the server bundle.
let lenis: Lenis | null = null;

export function registerLenis(instance: Lenis | null): void {
  lenis = instance;
}

/** `glide` scrolls there smoothly; `cut` lands there at once. */
export type ScrollMode = "glide" | "cut";

const GLIDE_SECONDS = 2.4;

/** Resolves once the scroll has landed. */
function scrollToY(top: number, mode: ScrollMode): Promise<void> {
  if (lenis === null) {
    window.scrollTo({ top, behavior: mode === "glide" ? "smooth" : "instant" });
    return Promise.resolve();
  }
  const instance = lenis;
  return new Promise((resolve) => {
    const onComplete = () => {
      resolve();
    };
    if (mode === "cut") {
      instance.scrollTo(top, { immediate: true, onComplete });
    } else {
      instance.scrollTo(top, { duration: GLIDE_SECONDS, onComplete });
    }
  });
}

function findTrack(id: SectionId): HTMLElement | null {
  return document.getElementById(sectionTrackId(id));
}

function documentTop(element: HTMLElement): number {
  return element.getBoundingClientRect().top + window.scrollY;
}

export interface ScrollToSectionOptions {
  mode: ScrollMode;
  /** How far past the section's start to land, in screens (viewport heights). */
  intoScreens?: number;
}

export async function scrollToSection(
  id: SectionId,
  { mode, intoScreens = 0 }: ScrollToSectionOptions,
): Promise<void> {
  const track = findTrack(id);
  if (track === null) return;
  await scrollToY(documentTop(track) + intoScreens * window.innerHeight, mode);
}

/** Runs a section out to its end state, for anyone who'd rather not scroll it themselves. */
export async function scrollToSectionEnd(id: SectionId): Promise<void> {
  const track = findTrack(id);
  if (track === null) return;
  await scrollToY(
    documentTop(track) + track.offsetHeight - window.innerHeight,
    "glide",
  );
}
