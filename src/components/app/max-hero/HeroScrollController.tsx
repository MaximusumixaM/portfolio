import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useEffect } from "react";

import {
  HERO_TRACK_ID,
  registerLenis,
  setHeroProgress,
} from "./heroTransition";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

// Owns scroll: Lenis for feel + one ScrollTrigger emitting the 0–1 progress. Renders nothing; the hero is pinned via CSS `sticky` (ScrollTrigger's pin transform would break the fixed canvas).
export function HeroScrollController() {
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const track = document.getElementById(HERO_TRACK_ID);
    if (track === null) return;

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

    const trigger = ScrollTrigger.create({
      trigger: track,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        setHeroProgress(self.progress);
      },
    });

    return () => {
      trigger.kill();
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
