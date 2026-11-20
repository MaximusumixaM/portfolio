import { Earth } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";

import { enterAbout } from "@/components/app/about/aboutRoute";
import {
  useAboutProgressEffect,
  useIsAboutOpen,
} from "@/components/app/about/aboutView";
import {
  DOCKED_AT,
  DOCK_HOVER_GROW_DELAY_MS,
  DOCK_HOVER_GROW_MS,
  DOCK_HOVER_RADIUS_PX,
  DOCK_ICON_SIZE_PX,
  DOCK_INSET_PX,
  DOCK_TOP_PX,
} from "@/components/app/max-hero/heroTransition";
import {
  setGlobeHovered,
  useIsGlobeResting,
} from "@/components/app/portfolio-globe/globeControl";
import { useGlobeDrag } from "@/components/app/portfolio-globe/useGlobeDrag";
import { useSectionPast } from "@/components/app/scroll/timeline";
import { cn } from "@/components/lib/utils";
import { Button } from "@/components/peduncle/Button";

/** Gap between the "about" label and the icon (or the grown globe), in CSS pixels: `s`. */
const LABEL_GAP_PX = 8;
/** Half the label's height at its hovered size (a `text-xl` line). */
const LABEL_HALF_HEIGHT_PX = 12;

/**
 * How far the label slides left while hovered, to stay beside the grown globe: from beside the icon
 * to clear of the globe's edge where the label's lower edge meets it.
 */
const LABEL_HOVER_SHIFT_PX = (() => {
  const centreBelowLabelEdge =
    DOCK_INSET_PX +
    DOCK_HOVER_RADIUS_PX -
    (DOCK_ICON_SIZE_PX / 2 + LABEL_HALF_HEIGHT_PX);
  const globeReach =
    DOCK_INSET_PX +
    DOCK_HOVER_RADIUS_PX +
    Math.sqrt(DOCK_HOVER_RADIUS_PX ** 2 - centreBelowLabelEdge ** 2);
  return globeReach - (DOCK_ICON_SIZE_PX + LABEL_GAP_PX) + LABEL_GAP_PX;
})();

/** Marks the About layers, so closing About knows focus was in there and brings it back here. */
export const ABOUT_LAYER_ATTRIBUTE = "data-about-layer";

// The way into About: the docked globe resting in the top-right as the Earth icon, with "about"
// slid out to its left. The link is laid exactly over the icon (the globe itself lives in the
// click-through canvas), so it's a real, keyboard-reachable target. A lingering hover turns the
// icon back into the globe, which idles round and slowly grows out of the corner (the label moving
// aside, the link's reach growing with it); dragging turns it; clicking grows it into About.
export function AboutLink() {
  const isDocked = useSectionPast("hero", DOCKED_AT);
  const isAboutOpen = useIsAboutOpen();
  const isLive = isDocked && !isAboutOpen;
  const isResting = useIsGlobeResting();
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
        // The header's side margin, as `dockRightPx` places the globe: `m`, then `l` from tablets.
        "group fixed right-m z-30 touch-none select-none rounded-round p-0 md:right-l focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
        // Hidden takes it out of the tab order too, while there's no docked globe to land on.
        !isDocked && "invisible",
        isAboutOpen && "pointer-events-none",
      )}
      style={{
        top: `${String(DOCK_TOP_PX)}px`,
        width: `${String(DOCK_ICON_SIZE_PX)}px`,
        height: `${String(DOCK_ICON_SIZE_PX)}px`,
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
        {/* While hovered, the link reaches over the whole grown globe, so the pointer can move onto
            it (and drag it) without leaving. */}
        <span
          aria-hidden="true"
          className="absolute hidden rounded-round pointer-fine:group-hover:block"
          style={{
            top: `${String(DOCK_INSET_PX)}px`,
            right: `${String(DOCK_INSET_PX)}px`,
            width: `${String(DOCK_HOVER_RADIUS_PX * 2)}px`,
            height: `${String(DOCK_HOVER_RADIUS_PX * 2)}px`,
          }}
        />
        {/* Slides out of the icon to its left once the globe has docked, and aside while the
            globe is grown. */}
        <span
          className="absolute right-full top-1/2 -translate-y-1/2 whitespace-nowrap transition-[clip-path,translate] duration-700 ease-out group-hover:-translate-x-(--label-shift) group-hover:delay-(--grow-delay) group-hover:duration-(--grow-duration) group-focus-visible:-translate-x-(--label-shift) group-focus-visible:delay-(--grow-delay) group-focus-visible:duration-(--grow-duration)"
          style={{
            marginRight: `${String(LABEL_GAP_PX)}px`,
            clipPath: isDocked ? "inset(0)" : "inset(0 0 0 100%)",
            // Moves aside in step with the globe: after the same wait, over the same slow grow.
            "--label-shift": `${String(LABEL_HOVER_SHIFT_PX)}px`,
            "--grow-delay": `${String(DOCK_HOVER_GROW_DELAY_MS)}ms`,
            "--grow-duration": `${String(DOCK_HOVER_GROW_MS)}ms`,
          }}
        >
          <span className="font-display text-large font-light tracking-widest text-foreground-secondary transition-[color,font-size,line-height] duration-300 group-hover:text-xl group-hover:text-foreground-default group-focus-visible:text-xl group-focus-visible:text-foreground-default">
            about
          </span>
        </span>
        {/* The globe at rest; it hands over to the real one when that wakes up to grow. */}
        <Earth
          aria-hidden="true"
          className={cn(
            "size-full text-foreground-default transition-opacity duration-150",
            isResting ? "opacity-100" : "opacity-0",
          )}
          strokeWidth={1.5}
        />
      </a>
    </Button>
  );
}
