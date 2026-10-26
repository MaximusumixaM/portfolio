import type { Chapter } from "./chapter";

// Drives semantic.css's chapter blend: the root holds the chapter being left, the one coming in, and how far between them the spin has got.

export type ChapterTheme = Chapter["theme"] | "default";

/** Puts the page `mix` (0–1) of the way from one chapter's theme to the next. */
export function blendChapterThemes(
  from: ChapterTheme,
  to: ChapterTheme,
  mix: number,
): void {
  const root = document.documentElement;
  // Same-value writes still notify observers (useThemeColor re-samples on every one), so skip them.
  if (root.dataset.chapter !== from) root.dataset.chapter = from;
  if (root.dataset.chapterNext !== to) root.dataset.chapterNext = to;
  const percent = `${(Math.min(1, Math.max(0, mix)) * 100).toFixed(2)}%`;
  if (root.style.getPropertyValue("--theme-chapter-mix") !== percent) {
    root.style.setProperty("--theme-chapter-mix", percent);
  }
}
