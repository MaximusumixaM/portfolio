import { phase } from "@/components/app/scroll/timeline";

// The About track measured in screens (one viewport height of scroll each). Every chapter runs
// arrive (it grows out of the globe) → read → retract → the spin onwards; the last has no spin.

const ARRIVE_SCREENS = 0.5;
/** Generous on purpose: a stray flick past the text shouldn't send the globe on. */
const READ_SCREENS = 0.9;
const RETRACT_SCREENS = 0.2;
const SPIN_SCREENS = 0.4;

/**
 * Arrival beats, as sub-ranges of the arrive stretch: the country's province lines draw from the
 * city, the country (lightly) and the city's province shade in, the pin rises, and the leader line
 * runs out to the text.
 */
export const ARRIVAL = {
  provinces: [0, 0.6],
  shade: [0.3, 0.7],
  pin: [0.35, 0.65],
  line: [0.5, 0.85],
  textAt: 0.8,
} as const;

export interface ChapterSegment {
  start: number;
  /** Arrival is done; the text is up from here. */
  readStart: number;
  /** Reading time is up; the text goes and the arrival marks retract from here. */
  exitStart: number;
  /** Retraction is done; crossing this sends the globe on to the next stop. */
  spinStart: number;
  end: number;
}

export interface JourneyLayout {
  segments: readonly ChapterSegment[];
  totalScreens: number;
}

export function buildJourneyLayout(chapterCount: number): JourneyLayout {
  const segments = Array.from({ length: chapterCount }).reduce<
    ChapterSegment[]
  >((built, _chapter, index) => {
    const start = built.at(-1)?.end ?? 0;
    const readStart = start + ARRIVE_SCREENS;
    const exitStart = readStart + READ_SCREENS;
    const spinStart = exitStart + RETRACT_SCREENS;
    const isLast = index === chapterCount - 1;
    return [
      ...built,
      {
        start,
        readStart,
        exitStart,
        spinStart,
        end: spinStart + (isLast ? 0 : SPIN_SCREENS),
      },
    ];
  }, []);
  return { segments, totalScreens: segments.at(-1)?.end ?? 0 };
}

/** Scroll distance into the journey, in screens, from the About section's 0–1 progress. */
export function journeyScreens(
  layout: JourneyLayout,
  progress: number,
): number {
  return progress * layout.totalScreens;
}

/** How much of each arrival mark is showing, 0–1 — scrubbed in on arrival, out on retraction. */
export interface ArrivalMarks {
  /** The chapter the marks belong to, or -1 when none are showing. */
  chapter: number;
  provinces: number;
  shade: number;
  pin: number;
  line: number;
  isTextShown: boolean;
}

const NO_MARKS: ArrivalMarks = {
  chapter: -1,
  provinces: 0,
  shade: 0,
  pin: 0,
  line: 0,
  isTextShown: false,
};

export function arrivalMarks(
  layout: JourneyLayout,
  screens: number,
): ArrivalMarks {
  const chapter = layout.segments.findIndex(
    (segment) => screens >= segment.start && screens < segment.spinStart,
  );
  const segment = layout.segments[chapter];
  if (segment === undefined) return NO_MARKS;
  const arrival = phase(screens, [segment.start, segment.readStart]);
  const remaining = 1 - phase(screens, [segment.exitStart, segment.spinStart]);
  return {
    chapter,
    provinces: phase(arrival, ARRIVAL.provinces) * remaining,
    shade: phase(arrival, ARRIVAL.shade) * remaining,
    pin: phase(arrival, ARRIVAL.pin) * remaining,
    line: phase(arrival, ARRIVAL.line) * remaining,
    isTextShown: arrival >= ARRIVAL.textAt && screens < segment.exitStart,
  };
}

/**
 * Stop the globe should be on: -1 before the journey (the default theme, still facing the first
 * stop), then one more for every spin crossed.
 */
export function journeyStop(layout: JourneyLayout, progress: number): number {
  if (progress <= 0) return -1;
  const screens = journeyScreens(layout, progress);
  return layout.segments
    .slice(0, -1)
    .filter((segment) => screens >= segment.spinStart).length;
}

/** Past the last chapter, where the globe leaves (for now it simply goes) for the projects. */
export function isJourneyOver(layout: JourneyLayout, screens: number): boolean {
  return screens >= layout.totalScreens;
}
