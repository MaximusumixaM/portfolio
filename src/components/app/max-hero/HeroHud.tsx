import { HeroOutline } from "./HeroOutline";
import { HERO_LINES_FADE } from "./heroTransition";
import { RotatingTerm } from "./RotatingTerm";
import { HERO_WORDMARK_HEIGHT_CSS } from "./sceneMetrics";

import { scrollToSectionEnd } from "@/components/app/scroll/smoothScroll";
import { phase, useSectionProgress } from "@/components/app/scroll/timeline";
import { cn } from "@/components/lib/utils";
import { Button } from "@/components/peduncle/Button";

/** The cue clears out as soon as the intro is under way (within ~12vh of scroll). */
const CUE_FADE_RATE = 8.6;

/** The words that take turns before "designer". Placeholders after the first, for Max to fill in. */
const TERMS: readonly [string, ...string[]] = [
  "user experience",
  "lorem",
  "ipsum",
  "dolor",
];

/** How far the words drift up towards MAX as they fade, in CSS pixels. */
const LINE_DRIFT_PX = 24;

/**
 * The line's centre: halfway between the wordmark's bottom edge (half its height below the middle)
 * and the bottom of the screen.
 */
const LINE_CENTRE = `calc(75% + ${HERO_WORDMARK_HEIGHT_CSS} / 4)`;

// The page's one real heading; the wordmark's traced outline, standing in until the 3D arrives;
// the line under the wordmark ("[term] designer", the term tipping over to the next every couple of
// seconds); and the cue to start scrolling.
export function HeroHud() {
  const progress = useSectionProgress("hero");
  const cueOpacity = Math.max(0, 1 - progress * CUE_FADE_RATE);
  const linesFade = phase(progress, HERO_LINES_FADE);
  const drift = linesFade * LINE_DRIFT_PX;

  return (
    <div className="pointer-events-none absolute inset-0 z-40 select-none p-m">
      <h1 className="visually-hidden">
        Max Nobell-Cluff, user experience designer
      </h1>

      <HeroOutline />

      {/* Decorative: the heading above says it for screen readers. Split at the screen's centre
          line: "designer" starts on it, the term ends a word-space before it (right-aligned, so
          the words can change without anything else moving). */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 grid grid-cols-2 items-center font-display text-heading-sm font-extralight text-foreground-brand md:text-xxl"
        style={{
          top: LINE_CENTRE,
          opacity: 1 - linesFade,
          transform: `translateY(calc(-50% - ${String(drift)}px))`,
        }}
      >
        <RotatingTerm
          terms={TERMS}
          isRunning={linesFade < 1}
          className="justify-self-end pr-s"
        />
        <span>designer</span>
      </div>

      <div
        className={cn(
          "absolute inset-x-0 bottom-l flex justify-center",
          cueOpacity > 0 ? "pointer-events-auto" : "pointer-events-none",
        )}
        style={{ opacity: cueOpacity }}
        aria-hidden={cueOpacity === 0}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            void scrollToSectionEnd("hero").catch((error: unknown) => {
              console.error(error);
            });
          }}
          className="tracking-widest font-light text-foreground-tertiary"
        >
          enter ↓
        </Button>
      </div>
    </div>
  );
}
