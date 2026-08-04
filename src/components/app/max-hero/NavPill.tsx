import { useEffect, useRef, useState } from "react";


import { NAV_LOGO_HEIGHT_PX, useHeroProgress } from "./heroTransition";
import { NavPillBorder } from "./NavPillBorder";

import { HockeyGame } from "@/components/app/HockeyGame";
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
/** Fraction of the settle where the pill fades in behind the arriving logo. */
const APPEAR_AT = 0.55;
/** Progress where the logo has parked (just past the rise) and the border starts drawing. */
const BORDER_AT = 0.72;

// Resting place for the settled wordmark (the 3D logo animates into this slot) and the easter-egg dialog trigger. Border is the SVG overlay so the pill starts borderless.
export function NavPill() {
  const progress = useHeroProgress();
  const isSettled = progress > APPEAR_AT;
  const isBorderDrawn = progress > BORDER_AT;

  const pillRef = useRef<HTMLButtonElement>(null);
  const [pillSize, setPillSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = pillRef.current;
    if (element === null) return;
    const observer = new ResizeObserver(() => {
      setPillSize({ width: element.clientWidth, height: element.clientHeight });
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <Dialog>
      <nav
        aria-label="Primary"
        className={cn(
          // Full-width strip stays click-through; only the pill itself is interactive.
          "pointer-events-none fixed inset-x-0 top-m z-20 flex justify-center transition-all duration-300",
          isSettled ? "translate-y-0 opacity-100" : "-translate-y-s opacity-0",
        )}
      >
        <DialogTrigger
          ref={pillRef}
          className={cn(
            "relative flex items-center gap-m rounded-round bg-background-default/80 px-l py-s backdrop-blur-medium",
            isSettled && "pointer-events-auto cursor-pointer",
          )}
        >
          <span className="visually-hidden">Max Nobell-Cluff</span>
          {/* Reserved slot the 3D logo lands in, sized from the shared constant. */}
          <div
            aria-hidden="true"
            style={{
              height: `${String(NAV_LOGO_HEIGHT_PX)}px`,
              width: `${String(Math.round(NAV_LOGO_HEIGHT_PX * LOGO_ASPECT))}px`,
            }}
          />
          <NavPillBorder
            width={pillSize.width}
            height={pillSize.height}
            drawn={isBorderDrawn}
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
