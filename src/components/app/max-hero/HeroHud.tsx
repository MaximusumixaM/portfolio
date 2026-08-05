import { scrollPastIntro, useHeroProgress } from "./heroTransition";

import { cn } from "@/components/lib/utils";
import { Button } from "@/components/peduncle/Button";
import { Helper } from "@/components/peduncle/Typography";

/** The cue clears out as soon as the intro is under way. */
const CUE_FADE_RATE = 12;
// Chrome, not headings — the page's one real heading is the visually-hidden h1 below. Light and
// widely spaced, so they hold their corners without competing with the wordmark.
const CORNER_LABEL =
  "font-display text-large font-extralight tracking-widest text-foreground-default";

// The top corners hold their places for the whole sequence — the scene rearranges around them.
export function HeroHud() {
  const progress = useHeroProgress();
  const cueOpacity = Math.max(0, 1 - progress * CUE_FADE_RATE);

  return (
    <div className="pointer-events-none absolute inset-0 z-40 select-none p-m">
      <h1 className="visually-hidden">
        Max Nobell-Cluff — interaction designer
      </h1>

      <Helper className={cn("absolute left-m top-m", CORNER_LABEL)}>
        Max Nobell-Cluff
      </Helper>

      <Helper className={cn("absolute right-m top-m", CORNER_LABEL)}>
        Interaction designer
      </Helper>

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
          onClick={scrollPastIntro}
          className="tracking-widest font-light text-foreground-tertiary"
        >
          enter ↓
        </Button>
      </div>
    </div>
  );
}
