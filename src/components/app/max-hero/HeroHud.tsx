import { scrollToSectionEnd } from "@/components/app/scroll/smoothScroll";
import { useSectionProgress } from "@/components/app/scroll/timeline";
import { cn } from "@/components/lib/utils";
import { Button } from "@/components/peduncle/Button";

/** The cue clears out as soon as the intro is under way (within ~12vh of scroll). */
const CUE_FADE_RATE = 8.6;

// The page's one real heading, and the cue to start scrolling.
export function HeroHud() {
  const progress = useSectionProgress("hero");
  const cueOpacity = Math.max(0, 1 - progress * CUE_FADE_RATE);

  return (
    <div className="pointer-events-none absolute inset-0 z-40 select-none p-m">
      <h1 className="visually-hidden">
        Max Nobell-Cluff — interaction designer
      </h1>

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
