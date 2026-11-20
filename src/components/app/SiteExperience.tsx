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
import { useAboutRoute } from "@/components/app/about/aboutRoute";
import {
  useAboutProgressEffect,
  useIsAboutOpen,
} from "@/components/app/about/aboutView";
import type { Chapters } from "@/components/app/about/chapter";
import { useLeaderLine } from "@/components/app/about/useLeaderLine";
import { AboutLink } from "@/components/app/AboutLink";
import { HeaderBackdrop } from "@/components/app/HeaderBackdrop";
import { HeroSection } from "@/components/app/max-hero/HeroSection";
import { NavWordmark } from "@/components/app/max-hero/NavWordmark";
import { useOpenProject } from "@/components/app/projects/openProject";
import type { Project } from "@/components/app/projects/project";
import { useProjectRoute } from "@/components/app/projects/projectRoute";
import { ProjectsSection } from "@/components/app/projects/ProjectsSection";
import { ProjectView } from "@/components/app/projects/ProjectView";
import { RoleLabel } from "@/components/app/RoleLabel";
import { ScrollController } from "@/components/app/scroll/ScrollController";
import { PORTFOLIO_VIEW, type SiteView } from "@/components/app/siteView";
import { usePrefersReducedMotion } from "@/components/lib/usePrefersReducedMotion";

// three and three-globe both reach for `window` as they load, so the canvas waits for the client.
const LazyMaxScene = lazy(async () => {
  const { MaxScene } = await import("@/components/app/max-hero/MaxScene");
  return { default: MaxScene };
});

export interface SiteExperienceProps {
  /** The About story's places, in order. */
  chapters: Chapters;
  /** The selected work, in grid order. */
  projects: readonly Project[];
  /** For a page loaded at /about or a project's URL: it opens straight onto that view. */
  initialView?: SiteView;
}

// The whole page as one scroll — the hero, then straight into the portfolio as the globe docks in
// the corner — with About a screen off to the right, panned across to from the globe. All over a
// single fixed canvas that every section's 3D shares.
export function SiteExperience({
  chapters,
  projects,
  initialView = PORTFOLIO_VIEW,
}: SiteExperienceProps) {
  const { overlayRef, labelRef, lineRef, cityDotRef, drawFrom } =
    useLeaderLine();
  const [isMounted, setIsMounted] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const isAboutOpen = useIsAboutOpen();
  const prefersReducedMotion = usePrefersReducedMotion();
  /** Rendered already on About from the server, so a page loaded at /about never flashes the portfolio. */
  const startsOnAbout = initialView.kind === "about";
  const initialProjectId =
    initialView.kind === "project" ? initialView.projectId : undefined;
  const isProjectOpen = useOpenProject() !== null;
  useAboutRoute(initialView);
  useProjectRoute(initialView);

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

      {/* Everything a project opens over: inert while one is open, so Tab stays in the project.
          A plain wrapper, so the fixed layers inside still position and stack against the page. */}
      <div inert={isProjectOpen}>
        <main
          ref={mainRef}
          inert={isAboutOpen}
          style={startsOnAbout ? { transform: "translateX(-100%)" } : undefined}
        >
          <HeroSection />
          <ProjectsSection projects={projects} />
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

        <HeaderBackdrop />
        <RoleLabel startsHidden={startsOnAbout} />
        <AboutBackButton startsShown={startsOnAbout} />
        <AboutLink />
        <NavWordmark />
      </div>
      <ProjectView projects={projects} initialProjectId={initialProjectId} />
    </>
  );
}
