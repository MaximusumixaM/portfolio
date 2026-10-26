import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useEffect } from "react";

import { registerLenis } from "./smoothScroll";
import { SECTION_IDS, sectionTrackId, setSectionProgress } from "./timeline";

import { usePrefersReducedMotion } from "@/components/lib/usePrefersReducedMotion";

// Owns scroll: Lenis for feel + one ScrollTrigger per section track emitting its 0–1 progress. Renders nothing; sections pin via CSS `sticky` (ScrollTrigger's pin transform would break the fixed canvas).
export function ScrollController() {
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // Reduced motion keeps native scrolling — smoothing retimes the user's own input.
    let lenis: Lenis | null = null;
    let onTick: ((time: number) => void) | undefined;
    if (!prefersReducedMotion) {
      lenis = new Lenis({ duration: 1.1, smoothWheel: true });
      registerLenis(lenis);
      lenis.on("scroll", () => {
        ScrollTrigger.update();
      });
      onTick = (time: number) => {
        lenis?.raf(time * 1000);
      };
      gsap.ticker.add(onTick);
      gsap.ticker.lagSmoothing(0);
    }

    const triggers = SECTION_IDS.flatMap((id) => {
      const track = document.getElementById(sectionTrackId(id));
      if (track === null) return [];
      return [
        ScrollTrigger.create({
          trigger: track,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
          onUpdate: (self) => {
            setSectionProgress(id, self.progress);
          },
        }),
      ];
    });

    return () => {
      for (const trigger of triggers) trigger.kill();
      if (onTick !== undefined) {
        gsap.ticker.remove(onTick);
        gsap.ticker.lagSmoothing(500, 33);
      }
      lenis?.destroy();
      registerLenis(null);
    };
  }, [prefersReducedMotion]);

  return null;
}
