import { useCallback, useEffect, useRef } from "react";

import { useAboutProgressEffect, useIsAboutOpen } from "./aboutView";

import { useGlobeDrag } from "@/components/app/portfolio-globe/useGlobeDrag";
import { usePrefersReducedMotion } from "@/components/lib/usePrefersReducedMotion";
import { BodyText, Heading } from "@/components/peduncle/Typography";

// The About page: a screen sitting just off to the right of the portfolio, panned across into view
// as the globe rides over from the corner into its left half. Content is a placeholder for now.
export interface AboutPanelProps {
  /** Server-render it already in place, for a page loaded at /about. */
  startsOpen: boolean;
}

export function AboutPanel({ startsOpen }: AboutPanelProps) {
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
          <Heading
            ref={headingRef}
            level="h2"
            id="about-heading"
            tabIndex={-1}
            className="outline-none"
          >
            About
          </Heading>
          <BodyText className="text-foreground-secondary">
            Placeholder: About goes here.
          </BodyText>
        </div>
      </section>
    </div>
  );
}
