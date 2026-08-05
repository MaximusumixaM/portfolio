import { useEffect, useRef, useState } from "react";

import {
  NAV_LOGO_HEIGHT_PX,
  NAV_PILL_APPEAR_AT,
  NAV_PILL_BORDER_AT,
  useHeroPast,
} from "./heroTransition";
import { BORDER_DRAW_MS, NavPillBorder } from "./NavPillBorder";

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

interface Size {
  width: number;
  height: number;
}

export interface NavPillProps {
  onOpenAbout: () => void;
}

// Resting place for the settled wordmark (the 3D logo animates into this slot) and the easter-egg dialog trigger. Border is the SVG overlay so the pill starts borderless.
export function NavPill({ onOpenAbout }: NavPillProps) {
  const isSettled = useHeroPast(NAV_PILL_APPEAR_AT);
  const isBorderDrawn = useHeroPast(NAV_PILL_BORDER_AT);
  // The side actions unfold only once the pill's own border has finished closing.
  const areActionsShown = useDelayed(isBorderDrawn, BORDER_DRAW_MS);

  const [pillRef, pillSize] = useMeasuredSize<HTMLButtonElement>();

  return (
    <Dialog>
      <nav
        aria-label="Primary"
        className={cn(
          // Full-width strip stays click-through; only the pills themselves are interactive. It sits
          // under the (click-through) canvas so the 3D logo lands on top of the pill, not behind it.
          "pointer-events-none fixed inset-x-0 top-m z-10 flex justify-center transition-all duration-300",
          isSettled ? "translate-y-0 opacity-100" : "-translate-y-s opacity-0",
        )}
      >
        {/* Only the wordmark's pill takes part in the layout, so it stays dead centre however
            wide the actions flanking it turn out to be. */}
        <div className="relative">
          {/* Placeholder until this side earns a purpose. */}
          <NavAction side="left" label="lorem" isShown={areActionsShown} />

          <DialogTrigger
            ref={pillRef}
            className={cn(
              "relative z-10 flex items-center gap-m rounded-round bg-background-default/80 px-l py-s backdrop-blur-medium",
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

          <NavAction
            side="right"
            label="about"
            isShown={areActionsShown}
            onClick={onOpenAbout}
          />
        </div>
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

interface NavActionProps {
  label: string;
  side: "left" | "right";
  isShown: boolean;
  onClick?: () => void;
}

/** A smaller pill that slides out from behind the wordmark's, drawing its own border as it lands. */
function NavAction({ label, side, isShown, onClick }: NavActionProps) {
  const [actionRef, actionSize] = useMeasuredSize<HTMLButtonElement>();
  const isLeft = side === "left";
  // The end tucked under the wordmark's pill: squared off, and where the border draws out from.
  const innerEnd = isLeft ? "right" : "left";

  return (
    <Button
      ref={actionRef}
      variant="ghost"
      onClick={onClick}
      tabIndex={isShown ? undefined : -1}
      className={cn(
        "absolute top-1/2 z-0 -translate-y-1/2 rounded-round bg-background-default/80 py-s tracking-widest backdrop-blur-medium transition-all duration-500",
        // Squared off where it tucks under: two facing curves showing through each other read as a seam.
        isLeft
          ? "right-full -mr-m rounded-r-none pl-m pr-l"
          : "left-full -ml-m rounded-l-none pl-l pr-m",
        isShown
          ? "pointer-events-auto translate-x-0 opacity-100"
          : cn("opacity-0", isLeft ? "translate-x-l" : "-translate-x-l"),
      )}
    >
      {label}
      <NavPillBorder
        width={actionSize.width}
        height={actionSize.height}
        drawn={isShown}
        flatEnd={innerEnd}
        origin={innerEnd}
      />
    </Button>
  );
}

/** Measures an element's box, so the drawn border can trace whatever the content came out as. */
function useMeasuredSize<T extends HTMLElement>(): [
  React.RefObject<T | null>,
  Size,
] {
  const ref = useRef<T>(null);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;
    if (element === null) return;
    const observer = new ResizeObserver(() => {
      setSize({ width: element.clientWidth, height: element.clientHeight });
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, []);

  return [ref, size];
}

/** Trails `isOn` by `delayMs` on the way up; drops the moment it turns off. */
function useDelayed(isOn: boolean, delayMs: number): boolean {
  const [isDelayed, setIsDelayed] = useState(false);

  useEffect(() => {
    if (!isOn) {
      setIsDelayed(false);
      return;
    }
    const timer = setTimeout(() => {
      setIsDelayed(true);
    }, delayMs);
    return () => {
      clearTimeout(timer);
    };
  }, [isOn, delayMs]);

  return isDelayed;
}
