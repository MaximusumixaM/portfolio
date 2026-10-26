import { Suspense, lazy, useEffect, useMemo, useState } from "react";

import { CornerLabels } from "@/components/app/CornerLabels";
import { AboutSection } from "@/components/app/journey/AboutSection";
import type { Chapter } from "@/components/app/journey/chapter";
import { buildJourneyLayout } from "@/components/app/journey/journeyLayout";
import { useLeaderLine } from "@/components/app/journey/useLeaderLine";
import { HeroSection } from "@/components/app/max-hero/HeroSection";
import { PHASES } from "@/components/app/max-hero/heroTransition";
import { NavPill } from "@/components/app/max-hero/NavPill";
import { ProjectsSection } from "@/components/app/projects/ProjectsSection";
import { ScrollController } from "@/components/app/scroll/ScrollController";
import { scrollToSection } from "@/components/app/scroll/smoothScroll";
import { useSectionPast } from "@/components/app/scroll/timeline";

// three and three-globe both reach for `window` as they load, so the canvas waits for the client.
const LazyMaxScene = lazy(async () => {
  const { MaxScene } = await import("@/components/app/max-hero/MaxScene");
  return { default: MaxScene };
});

export interface SiteExperienceProps {
  chapters: readonly Chapter[];
}

function logScrollError(error: unknown) {
  console.error(error);
}

// The whole page as one scroll: hero → About journey → projects, over a single fixed canvas that
// every section's 3D shares.
export function SiteExperience({ chapters }: SiteExperienceProps) {
  const [isMounted, setIsMounted] = useState(false);
  const isRevealed = useSectionPast("hero", PHASES.reveal[0]);
  const layout = useMemo(
    () => buildJourneyLayout(chapters.length),
    [chapters.length],
  );
  const { overlayRef, labelRef, lineRef, cityDotRef, drawFrom } =
    useLeaderLine();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <>
      <ScrollController />
      {isMounted && (
        <Suspense fallback={null}>
          <LazyMaxScene
            isRevealed={isRevealed}
            chapters={chapters}
            layout={layout}
            onAnchorMove={drawFrom}
          />
        </Suspense>
      )}

      <main>
        <HeroSection />
        <AboutSection chapters={chapters} layout={layout} titleRef={labelRef} />
        <ProjectsSection />
      </main>

      {/* The one layer that has to clear the canvas, or the globe buries the line running out of
          its own pin. Stacked layouts put the text under the globe, where a line says nothing. */}
      <div
        ref={overlayRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-30 hidden md:block"
      >
        <svg className="h-full w-full">
          <polyline
            ref={lineRef}
            fill="none"
            strokeWidth="1"
            pathLength={1}
            strokeDasharray="1"
            className="stroke-foreground-default"
            style={{ opacity: 0, strokeDashoffset: 1 }}
          />
          <circle
            ref={cityDotRef}
            r="2"
            className="fill-foreground-default"
            style={{ opacity: 0 }}
          />
        </svg>
      </div>

      <CornerLabels />
      <NavPill
        onAbout={() => {
          // Lands with the first chapter fully arrived: pin, line and title all in place.
          void scrollToSection("about", {
            mode: "cut",
            intoScreens: layout.segments[0]?.readStart ?? 0,
          }).catch(logScrollError);
        }}
        onProjects={() => {
          void scrollToSection("projects", { mode: "cut" }).catch(
            logScrollError,
          );
        }}
      />
    </>
  );
}
