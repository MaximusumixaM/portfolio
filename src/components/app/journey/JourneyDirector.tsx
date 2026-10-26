import { useFrame } from "@react-three/fiber";

import type { Chapter } from "./chapter";
import { blendChapterThemes, type ChapterTheme } from "./chapterTheme";
import { journeyStop, type JourneyLayout } from "./journeyLayout";
import { advanceSpin, finishSpin, getJourneySpin, spinTo } from "./journeySpin";

import {
  easeSettle,
  getSectionProgress,
} from "@/components/app/scroll/timeline";
import { usePrefersReducedMotion } from "@/components/lib/usePrefersReducedMotion";

export interface JourneyDirectorProps {
  chapters: readonly Chapter[];
  layout: JourneyLayout;
}

// Rides the canvas frame loop: turns scroll into the stop the globe should be on, plays the spin
// there, and blends the palette by the same eased amount the globe has turned.
export function JourneyDirector({ chapters, layout }: JourneyDirectorProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  useFrame((_state, delta) => {
    spinTo(journeyStop(layout, getSectionProgress("about")));
    if (prefersReducedMotion) finishSpin();
    else advanceSpin(delta);

    const spin = getJourneySpin();
    blendChapterThemes(
      themeAtStop(chapters, spin.from),
      themeAtStop(chapters, spin.to),
      easeSettle(spin.progress),
    );
  });

  return null;
}

function themeAtStop(chapters: readonly Chapter[], stop: number): ChapterTheme {
  return chapters[stop]?.theme ?? "default";
}
