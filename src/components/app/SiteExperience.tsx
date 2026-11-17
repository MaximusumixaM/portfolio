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
  /** `about` for a page loaded at /about: it opens straight onto About. */
  initialView?: SiteView;
}

// The whole page as one scroll — the hero, then straight into the portfolio as the globe docks in
// the corner — with About a screen off to the right, panned across to from the globe. All over a
// single fixed canvas that every section's 3D shares.
export function SiteExperience({
  initialView = "portfolio",
}: SiteExperienceProps) {
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
          <LazyMaxScene />
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
      <AboutPanel startsOpen={startsOnAbout} />

      <CornerLabels startsHidden={startsOnAbout} />
      <AboutBackButton startsShown={startsOnAbout} />
      <AboutLink />
      <NavPill />
    </>
  );
}
