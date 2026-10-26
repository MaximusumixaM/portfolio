import { useCallback, useSyncExternalStore } from "react";

// Shared 0–1 progress per section (ScrollController writes it); canvas reads imperatively, DOM via the hooks.

export type SectionId = "hero" | "about" | "projects";

/** Every section, in page order. ScrollController drives whichever of these has a track mounted. */
export const SECTION_IDS: readonly SectionId[] = ["hero", "about", "projects"];

/** Id of the element a section's scroll is measured across (for pinned sections, the tall track). */
export function sectionTrackId(id: SectionId): string {
  return `${id}-track`;
}

const progressBySection = new Map<SectionId, number>();
const listeners = new Set<() => void>();

export function setSectionProgress(id: SectionId, progress: number): void {
  if (progress === getSectionProgress(id)) return;
  progressBySection.set(id, progress);
  for (const notify of listeners) notify();
}

/** Imperative read, for per-frame consumers that must not trigger React renders. */
export function getSectionProgress(id: SectionId): number {
  return progressBySection.get(id) ?? 0;
}

function subscribe(notify: () => void): () => void {
  listeners.add(notify);
  return () => {
    listeners.delete(notify);
  };
}

/** Server render always starts at 0 — every section is at rest before any scrolling. */
function getServerProgress(): number {
  return 0;
}

export function useSectionProgress(id: SectionId): number {
  const getSnapshot = useCallback(() => getSectionProgress(id), [id]);
  return useSyncExternalStore(subscribe, getSnapshot, getServerProgress);
}

/**
 * Derives a value from a section's progress, re-rendering only when that value changes — so a
 * component gating on a beat doesn't re-render every scroll frame the way `useSectionProgress`
 * does. Keep `select` returning a primitive, or every read counts as a change.
 */
export function useSectionSelector<T extends string | number | boolean>(
  id: SectionId,
  select: (progress: number) => T,
): T {
  return useSyncExternalStore(
    subscribe,
    () => select(getSectionProgress(id)),
    () => select(0),
  );
}

/** Whether a section has run past `threshold`. */
export function useSectionPast(id: SectionId, threshold: number): boolean {
  return useSectionSelector(id, (progress) => progress > threshold);
}

/** Smoothstep, so transforms ease at both ends rather than tracking scroll linearly. */
export function easeSettle(progress: number): number {
  return progress * progress * (3 - 2 * progress);
}

/** Remaps `progress` to 0–1 across the given sub-range, clamped outside it. */
export function phase(
  progress: number,
  [start, end]: readonly [number, number],
): number {
  if (end <= start) return progress >= end ? 1 : 0;
  return Math.min(1, Math.max(0, (progress - start) / (end - start)));
}
