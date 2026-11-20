import { useEffect } from "react";

import { NAV_LOGO_HEIGHT_PX, NAV_WORDMARK_SETTLED_AT } from "./heroTransition";
import { setWordmarkHovered } from "./wordmarkControl";

import { HockeyGame } from "@/components/app/HockeyGame";
import { useSectionPast } from "@/components/app/scroll/timeline";
import { cn } from "@/components/lib/utils";
import { Button } from "@/components/peduncle/Button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
} from "@/components/peduncle/Dialog";
import { Heading } from "@/components/peduncle/Typography";

/** Wordmark aspect ratio, from the source SVG viewBox (1047 x 389). */
const LOGO_ASPECT = 1047 / 389;

// Where the settled 3D wordmark lands (top-centre), and the hockey easter egg's way in: an invisible
// click target over the wordmark, which itself lives in the click-through canvas. Hovering it (or
// keyboard focus) grows the wordmark a little.
export function NavWordmark() {
  const isSettled = useSectionPast("hero", NAV_WORDMARK_SETTLED_AT);

  // Hiding doesn't fire a pointer-leave, so scrolling back into the hero would leave it grown.
  useEffect(() => {
    if (!isSettled) setWordmarkHovered(false);
  }, [isSettled]);

  return (
    <Dialog>
      <nav
        aria-label="Primary"
        // Full-width strip stays click-through; only the wordmark's target is interactive.
        className="pointer-events-none fixed inset-x-0 top-m z-10 flex justify-center"
      >
        <DialogTrigger
          className={cn(
            "rounded-large focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
            // Out of the tab order until the wordmark has arrived to be clicked.
            isSettled ? "pointer-events-auto cursor-pointer" : "invisible",
          )}
          onPointerEnter={(event) => {
            // Touch has no hover: a tap is just a tap.
            if (event.pointerType === "mouse") setWordmarkHovered(true);
          }}
          onPointerLeave={(event) => {
            if (event.pointerType === "mouse") setWordmarkHovered(false);
          }}
          onFocus={(event) => {
            // Keyboard focus grows it too; focus left behind by a click doesn't.
            if (event.currentTarget.matches(":focus-visible")) {
              setWordmarkHovered(true);
            }
          }}
          onBlur={() => {
            setWordmarkHovered(false);
          }}
        >
          <span className="visually-hidden">Max Nobell-Cluff</span>
          {/* The slot the 3D logo lands in, sized from the shared constant. */}
          <div
            aria-hidden="true"
            style={{
              height: `${String(NAV_LOGO_HEIGHT_PX)}px`,
              width: `${String(Math.round(NAV_LOGO_HEIGHT_PX * LOGO_ASPECT))}px`,
            }}
          />
        </DialogTrigger>
      </nav>

      <DialogContent title="Canucks">
        <div className="flex flex-col gap-l p-l">
          <div className="flex items-start justify-between gap-m">
            <Heading level="h3">Canucks</Heading>
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-xxl leading-none"
                aria-label="Close dialog"
              >
                &times;
              </Button>
            </DialogClose>
          </div>
          <HockeyGame />
        </div>
      </DialogContent>
    </Dialog>
  );
}
