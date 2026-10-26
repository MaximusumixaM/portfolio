import type { Chapter } from "./chapter";
import {
  arrivalMarks,
  journeyScreens,
  type JourneyLayout,
} from "./journeyLayout";

import {
  HERO_SCROLL_SCREENS,
  JOURNEY_HANDOFF_AT,
} from "@/components/app/max-hero/heroTransition";
import {
  sectionTrackId,
  useSectionSelector,
} from "@/components/app/scroll/timeline";
import { cn } from "@/components/lib/utils";
import { BodyText, Heading, Helper } from "@/components/peduncle/Typography";

/**
 * Pulls the journey up over the hero's pinned screen and the tail of its sequence, so the first
 * chapter starts arriving while the globe's borders are still finishing.
 */
const HERO_OVERLAP_SCREENS = 1 + (1 - JOURNEY_HANDOFF_AT) * HERO_SCROLL_SCREENS;

export interface AboutSectionProps {
  chapters: readonly Chapter[];
  layout: JourneyLayout;
  /** Lands on the marked chapter's title — where the leader line from its pin runs to. */
  titleRef: React.Ref<HTMLHeadingElement>;
}

// The journey's pinned screen: the globe (in the shared canvas) holds the left, and each chapter's
// text takes the right, arriving at the end of the line drawn out from its pin. Every chapter is in
// the DOM; only the marked one shows.
export function AboutSection({
  chapters,
  layout,
  titleRef,
}: AboutSectionProps) {
  // The marks outlast the text (they retract after it goes), so the line keeps its target until then.
  const markedIndex = useSectionSelector(
    "about",
    (progress) =>
      arrivalMarks(layout, journeyScreens(layout, progress)).chapter,
  );
  const isTextShown = useSectionSelector(
    "about",
    (progress) =>
      arrivalMarks(layout, journeyScreens(layout, progress)).isTextShown,
  );

  return (
    <section
      aria-labelledby="about-heading"
      style={{ marginTop: `${String(-HERO_OVERLAP_SCREENS * 100)}vh` }}
    >
      <div
        id={sectionTrackId("about")}
        className="relative w-full"
        // One pinned screen plus the journey's own length in screens.
        style={{ height: `${String((layout.totalScreens + 1) * 100)}vh` }}
      >
        <div className="sticky top-0 h-screen w-full overflow-hidden">
          <Heading level="h2" id="about-heading" className="visually-hidden">
            About
          </Heading>
          <div className="absolute inset-0 flex items-end px-m pb-xl md:left-1/2 md:items-center md:px-l md:pb-0">
            <div className="grid w-full max-w-prose">
              {chapters.map((chapter, index) => (
                <ChapterText
                  key={chapter.id}
                  chapter={chapter}
                  isShown={index === markedIndex && isTextShown}
                  titleRef={index === markedIndex ? titleRef : undefined}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

interface ChapterTextProps {
  chapter: Chapter;
  isShown: boolean;
  titleRef: React.Ref<HTMLHeadingElement> | undefined;
}

function ChapterText({ chapter, isShown, titleRef }: ChapterTextProps) {
  return (
    <article
      className={cn(
        // Every chapter shares the one grid cell, so swapping them never shifts the layout.
        "col-start-1 row-start-1 flex flex-col gap-m transition-[opacity,visibility] duration-300",
        isShown ? "visible opacity-100" : "invisible opacity-0",
      )}
    >
      <div className="flex flex-col gap-xs">
        <Helper className="text-foreground-tertiary">
          {chapter.place.label}
        </Helper>
        <Heading ref={titleRef} level="h3">
          {chapter.title}
        </Heading>
      </div>
      <BodyText>{chapter.text}</BodyText>
    </article>
  );
}
