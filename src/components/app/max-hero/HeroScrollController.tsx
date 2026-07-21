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

/**
 * Owns the page's scroll behaviour: Lenis for scroll feel, and a single ScrollTrigger
 * that converts progress through the hero track into the 0–1 value everything else reads.
 *
 * Renders nothing. The hero is pinned with CSS `sticky` rather than ScrollTrigger's `pin`
 * on purpose — pinning applies a transform to the pinned element, and a transformed
 * ancestor makes `position: fixed` resolve against it, which would break the canvas.
 */
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
