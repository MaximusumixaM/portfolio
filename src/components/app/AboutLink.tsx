import { useCallback, useEffect, useRef } from "react";

import { enterAbout } from "@/components/app/about/aboutRoute";
import {
  useAboutProgressEffect,
  useIsAboutOpen,
} from "@/components/app/about/aboutView";
import {
  DOCK_RADIUS_PX,
  DOCK_RIGHT_PX,
  DOCK_TOP_PX,
  PHASES,
} from "@/components/app/max-hero/heroTransition";
import { setGlobeHovered } from "@/components/app/portfolio-globe/globeControl";
import { useGlobeDrag } from "@/components/app/portfolio-globe/useGlobeDrag";
import { useSectionPast } from "@/components/app/scroll/timeline";
import { cn } from "@/components/lib/utils";
import { Button } from "@/components/peduncle/Button";

/** Live only once the globe has all but settled in the corner. */
const DOCKED_AT = PHASES.dock[1] - 0.02;

/** Marks the About layers, so closing About knows focus was in there and brings it back here. */
export const ABOUT_LAYER_ATTRIBUTE = "data-about-layer";

// The way into About: a link laid exactly over the docked globe (which lives in the click-through
// canvas), labelled "about", so the globe is a real, keyboard-reachable target. Hovering grows it
// and idles it round; dragging turns it; clicking pans across to About.
export function AboutLink() {
  const isDocked = useSectionPast("hero", DOCKED_AT);
  const isAboutOpen = useIsAboutOpen();
  const isLive = isDocked && !isAboutOpen;
  const linkRef = useRef<HTMLAnchorElement>(null);
  const drag = useGlobeDrag(isLive);

  // Hiding doesn't fire a pointer-leave, so scrolling back into the hero (or opening About) would
  // leave the globe "hovered".
  useEffect(() => {
    if (!isLive) setGlobeHovered(false);
  }, [isLive]);

  // Closing About hands focus back to the way in, if it was somewhere in About.
  const wasAboutOpen = useRef(isAboutOpen);
  useEffect(() => {
    const wasOpen = wasAboutOpen.current;
    wasAboutOpen.current = isAboutOpen;
    if (!wasOpen || isAboutOpen) return;
    const focused = document.activeElement;
    const wasInAbout =
      focused === document.body ||
      focused?.closest(`[${ABOUT_LAYER_ATTRIBUTE}]`) !== null;
    if (wasInAbout) linkRef.current?.focus({ preventScroll: true });
  }, [isAboutOpen]);

  // The label fades as the globe leaves the corner for About, and back as it returns.
  useAboutProgressEffect(
    useCallback((eased: number) => {
      if (linkRef.current !== null) {
        linkRef.current.style.opacity = String(1 - eased);
      }
    }, []),
  );

  return (
    <Button
      asChild
      variant="ghost"
      className={cn(
        // `touch-none` keeps a drag on the globe from scrolling the page underneath.
        "group fixed z-30 touch-none select-none rounded-round p-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
        // Hidden takes it out of the tab order too, while there's no docked globe to land on.
        !isDocked && "invisible",
        isAboutOpen && "pointer-events-none",
      )}
      style={{
        top: `${String(DOCK_TOP_PX)}px`,
        right: `${String(DOCK_RIGHT_PX)}px`,
        width: `${String(DOCK_RADIUS_PX * 2)}px`,
        height: `${String(DOCK_RADIUS_PX * 2)}px`,
      }}
    >
      <a
        ref={linkRef}
        href="/about"
        tabIndex={isAboutOpen ? -1 : undefined}
        aria-hidden={isAboutOpen}
        // Browsers drag links as URLs by default, which swallows the pointer moves that turn the globe.
        draggable={false}
        onDragStart={drag.onDragStart}
        onPointerEnter={(event) => {
          // Touch has no hover: a tap is just a tap.
          if (event.pointerType === "mouse") setGlobeHovered(true);
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === "mouse") setGlobeHovered(false);
        }}
        onFocus={(event) => {
          // Keyboard focus gets the hover treatment; focus left behind by a click doesn't.
          if (event.currentTarget.matches(":focus-visible")) {
            setGlobeHovered(true);
          }
        }}
        onBlur={() => {
          setGlobeHovered(false);
        }}
        onPointerDown={drag.onPointerDown}
        onPointerMove={drag.onPointerMove}
        onPointerUp={drag.onPointerUp}
        onPointerCancel={drag.onPointerCancel}
        onClick={(event) => {
          event.preventDefault();
          // A press that turned into a drag was turning the globe, not asking for About.
          if (drag.takeWasDragged()) return;
          enterAbout();
        }}
      >
        {/* Faint over the globe, coming forward and up a size when the globe is hovered or focused.
            The frosted panel blurs (and lifts the colour of) what's behind it under a whisper of the
            page colour, so the word reads over the globe's lines. */}
        <span className="rounded-xl bg-background-default/20 px-s py-xs backdrop-blur-large backdrop-saturate-150">
          <span className="font-display text-large font-extralight tracking-widest text-foreground-tertiary transition-[color,font-size,line-height] duration-300 group-hover:text-xl group-hover:text-foreground-default group-focus-visible:text-xl group-focus-visible:text-foreground-default">
            about
          </span>
        </span>
      </a>
    </Button>
  );
}
