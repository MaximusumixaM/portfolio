import { useCallback, useEffect, useRef } from "react";

import {
  selectChapter,
  useAboutProgressEffect,
  useActiveChapter,
  useIsAboutOpen,
  useShownChapter,
} from "./aboutView";
import type { Chapter, Chapters } from "./chapter";

import { useGlobeDrag } from "@/components/app/portfolio-globe/useGlobeDrag";
import { usePrefersReducedMotion } from "@/components/lib/usePrefersReducedMotion";
import { cn } from "@/components/lib/utils";
import { Button } from "@/components/peduncle/Button";
import { BodyText, Heading } from "@/components/peduncle/Typography";

// The About page: a screen sitting just off to the right of the portfolio, panned across into view
// as the globe rides over from the corner into its left half. Every place is listed; picking one opens
// its text, moves the globe to it, and runs the line from its pin to its heading.
export interface AboutPanelProps {
  /** Server-render it already in place, for a page loaded at /about. */
  startsOpen: boolean;
  chapters: Chapters;
  /** Lands on the heading of the place whose marks are on the globe — where the leader line runs. */
  titleRef: React.Ref<HTMLHeadingElement>;
}

export function AboutPanel({
  startsOpen,
  chapters,
  titleRef,
}: AboutPanelProps) {
  const activeChapter = useActiveChapter();
  const shownChapter = useShownChapter();
  const isOpen = useIsAboutOpen();
  const panelRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const drag = useGlobeDrag(isOpen);

  useAboutProgressEffect(
    useCallback(
      (eased: number) => {
        const panel = panelRef.current;
        if (panel === null) return;
        panel.style.visibility = eased > 0 ? "visible" : "hidden";
        // Reduced motion trades the pan for a cross-fade.
        panel.style.transform = prefersReducedMotion
          ? ""
          : `translateX(${String((1 - eased) * 100)}%)`;
        panel.style.opacity = prefersReducedMotion ? String(eased) : "";
      },
      [prefersReducedMotion],
    ),
  );

  useEffect(() => {
    if (isOpen) headingRef.current?.focus({ preventScroll: true });
  }, [isOpen]);

  return (
    <div
      ref={panelRef}
      data-about-layer=""
      // Its own scroll, if the content runs long; Lenis holds the page itself still.
      data-lenis-prevent=""
      inert={!isOpen}
      className="fixed inset-0 z-10 overflow-y-auto bg-background-default"
      style={
        startsOpen
          ? { visibility: "visible" }
          : { visibility: "hidden", transform: "translateX(100%)" }
      }
    >
      {/* Over where the globe lands (it's in the click-through canvas), so it can be turned here
          too. Mirrors GlobeStage's About layout: left half beside the content, top when stacked. */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-[30%] size-[min(68vw,40vh)] -translate-x-1/2 -translate-y-1/2 touch-none rounded-round md:left-[26%] md:top-1/2 md:size-[min(64vh,44vw)]"
        onPointerDown={drag.onPointerDown}
        onPointerMove={drag.onPointerMove}
        onPointerUp={drag.onPointerUp}
        onPointerCancel={drag.onPointerCancel}
        onDragStart={drag.onDragStart}
      />

      <section
        aria-labelledby="about-heading"
        className="grid min-h-full md:grid-cols-2"
      >
        {/* The globe's half (its top, when stacked). */}
        <div className="h-[55vh] md:h-auto" />
        <div className="flex flex-col justify-center gap-m px-m pb-xl md:px-l md:pb-0">
          {/* Where focus lands on opening; the visible story starts with the city. */}
          <Heading
            ref={headingRef}
            level="h2"
            id="about-heading"
            tabIndex={-1}
            className="visually-hidden"
          >
            About
          </Heading>
          <ul className="flex max-w-prose flex-col gap-m">
            {chapters.map((chapter, index) => (
              <ChapterItem
                key={chapter.id}
                chapter={chapter}
                index={index}
                isExpanded={index === activeChapter}
                titleRef={index === shownChapter ? titleRef : undefined}
              />
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

interface ChapterItemProps {
  chapter: Chapter;
  index: number;
  isExpanded: boolean;
  titleRef: React.Ref<HTMLHeadingElement> | undefined;
}

/** One place: a heading that opens it (closing the others), and its text beneath. */
function ChapterItem({
  chapter,
  index,
  isExpanded,
  titleRef,
}: ChapterItemProps) {
  const textId = `chapter-text-${chapter.id}`;

  return (
    <li className="flex flex-col">
      <Heading ref={titleRef} level="h3">
        <Button
          variant="ghost"
          aria-expanded={isExpanded}
          aria-controls={textId}
          onClick={() => {
            selectChapter(index);
          }}
          className="h-auto justify-start p-0 text-left font-display text-heading-sm font-semibold"
        >
          {chapter.place.label}
        </Button>
      </Heading>
      {/* Opens and closes by animating the row height (0fr ↔ 1fr), so it slides rather than jumps. */}
      <div
        id={textId}
        inert={!isExpanded}
        className={cn(
          "grid transition-[grid-template-rows] duration-300",
          isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <BodyText className="pb-s pt-s">{chapter.text}</BodyText>
        </div>
      </div>
    </li>
  );
}
