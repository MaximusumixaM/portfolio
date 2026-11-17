import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { AboutBackButton } from "@/components/app/about/AboutBackButton";
import { AboutPanel } from "@/components/app/about/AboutPanel";
import {
  useAboutRoute,
  type SiteView,
} from "@/components/app/about/aboutRoute";
import {
  useAboutProgressEffect,
  useIsAboutOpen,
} from "@/components/app/about/aboutView";
import type { Chapters } from "@/components/app/about/chapter";
import { useLeaderLine } from "@/components/app/about/useLeaderLine";
import { AboutLink } from "@/components/app/AboutLink";
import { CornerLabels } from "@/components/app/CornerLabels";
import { HeroSection } from "@/components/app/max-hero/HeroSection";
import { NavPill } from "@/components/app/max-hero/NavPill";
import { ProjectsSection } from "@/components/app/projects/ProjectsSection";
import { ScrollController } from "@/components/app/scroll/ScrollController";
import { usePrefersReducedMotion } from "@/components/lib/usePrefersReducedMotion";

// three and three-globe both reach for `window` as they load, so the canvas waits for the client.
const LazyMaxScene = lazy(async () => {
  const { MaxScene } = await import("@/components/app/max-hero/MaxScene");
  return { default: MaxScene };
});

export interface SiteExperienceProps {
  /** The About story's places, in order. */
  chapters: Chapters;
  /** `about` for a page loaded at /about: it opens straight onto About. */
  initialView?: SiteView;
}

// The whole page as one scroll — the hero, then straight into the portfolio as the globe docks in
// the corner — with About a screen off to the right, panned across to from the globe. All over a
// single fixed canvas that every section's 3D shares.
export function SiteExperience({
  chapters,
  initialView = "portfolio",
}: SiteExperienceProps) {
  const { overlayRef, labelRef, lineRef, cityDotRef, drawFrom } =
    useLeaderLine();
  const [isMounted, setIsMounted] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const isAboutOpen = useIsAboutOpen();
  const prefersReducedMotion = usePrefersReducedMotion();
  /** Rendered already on About from the server, so a page loaded at /about never flashes the portfolio. */
  const startsOnAbout = initialView === "about";
  useAboutRoute(initialView);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // The portfolio pans off to the left as About comes in from the right (or fades, for reduced
  // motion). Cleared at rest, so nothing transformed sits round the sticky hero.
  useAboutProgressEffect(
    useCallback(
      (eased: number) => {
        const main = mainRef.current;
        if (main === null) return;
        main.style.transform =
          eased > 0 && !prefersReducedMotion
            ? `translateX(${String(-eased * 100)}%)`
            : "";
        main.style.opacity = prefersReducedMotion ? String(1 - eased) : "";
      },
      [prefersReducedMotion],
    ),
  );

  return (
    <>
      <ScrollController />
      {isMounted && (
        <Suspense fallback={null}>
          <LazyMaxScene chapters={chapters} onAnchorMove={drawFrom} />
        </Suspense>
      )}

      <main
        ref={mainRef}
        inert={isAboutOpen}
        style={startsOnAbout ? { transform: "translateX(-100%)" } : undefined}
      >
        <HeroSection />
        <ProjectsSection />
      </main>
      <AboutPanel
        startsOpen={startsOnAbout}
        chapters={chapters}
        titleRef={labelRef}
      />

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

      <CornerLabels startsHidden={startsOnAbout} />
      <AboutBackButton startsShown={startsOnAbout} />
      <AboutLink />
      <NavPill />
    </>
  );
}
