// The hero section's choreography: its beats, as sub-ranges of the "hero" timeline progress.

import { STACKED_BREAKPOINT_PX } from "./sceneMetrics";

/** Height of the settled logo in CSS pixels — the nav reserves exactly this. */
export const NAV_LOGO_HEIGHT_PX = 32;

/**
 * The header is one row: `m` from the top and as tall as the wordmark, with the role (or About's
 * back button), the wordmark and the about icon all centred in it.
 */
export const HEADER_ROW_TOP_PX = 16;
export const HEADER_ROW_HEIGHT_PX = NAV_LOGO_HEIGHT_PX;

/** Vertical centre of the settled logo — and of the whole header row — from the top of the viewport. */
export const NAV_LOGO_CENTER_Y_PX =
  HEADER_ROW_TOP_PX + HEADER_ROW_HEIGHT_PX / 2;

/** The header's height: its row plus `m` beneath. */
export const HEADER_HEIGHT_PX = HEADER_ROW_TOP_PX + HEADER_ROW_HEIGHT_PX + 16;

// Scroll sub-ranges staging the intro. The circle the arcs draw becomes the globe's silhouette:
// rings draw onto it, then the borders as the wordmark leaves for the nav and the globe sweeps from
// under it straight up into the top-right corner, still drawing, with the portfolio rising too.
// Overlaps are deliberate — the beats should knit.
export const PHASES = {
  arcs: [0.0, 0.15],
  graticule: [0.14, 0.4],
  rise: [0.28, 0.6],
  countries: [0.4, 0.97],
  dock: [0.41, 1],
  reveal: [0.97, 1],
} as const;

/** The hero's words fade (drifting in towards MAX) as it shrinks into the circle. */
export const HERO_LINES_FADE: readonly [number, number] = [0, 0.12];

/** Where the portfolio's title comes up into view: the moment the globe starts its climb. */
export const PORTFOLIO_RISE_AT = PHASES.dock[0];

/** Hero progress from which the globe counts as docked: settled into the corner, its link live. */
export const DOCKED_AT = PHASES.dock[1] - 0.02;

/** The header tightens on phones: smaller type and icon, `m` side margins (`l` from tablets up). */
export type HeaderLayout = "compact" | "wide";

export function headerLayoutFor(viewportWidth: number): HeaderLayout {
  return viewportWidth >= STACKED_BREAKPOINT_PX ? "wide" : "compact";
}

/** The query that's true for the wide header, for DOM that can't read the canvas's width. */
export const WIDE_HEADER_QUERY = `(min-width: ${String(STACKED_BREAKPOINT_PX)}px)`;

export interface DockMetrics {
  /** The Earth icon the docked globe rests as, in CSS pixels square. */
  iconSize: number;
  /** The docked globe's radius at rest: exactly the icon's circle (radius 10 on its 24 grid). */
  radius: number;
  /** How far the circle sits in from the icon's box, so growing keeps it tucked into the corner. */
  inset: number;
  /** The icon's top edge, centring it in the header row. */
  top: number;
  /** The gap between the icon and the right edge: the header's side margin (`right-m md:right-l`). */
  right: number;
}

/** Where the docked globe rests as its icon, for each header layout. */
export function dockMetrics(layout: HeaderLayout): DockMetrics {
  const iconSize = layout === "wide" ? 20 : 16;
  const radius = (iconSize * 10) / 24;
  return {
    iconSize,
    radius,
    inset: iconSize / 2 - radius,
    top: HEADER_ROW_TOP_PX + (HEADER_ROW_HEIGHT_PX - iconSize) / 2,
    right: layout === "wide" ? 32 : 16,
  };
}

/** The radius it slowly grows to while hovered. */
export const DOCK_HOVER_RADIUS_PX = 64;
/** How long a hover rests on the icon before it turns into the globe and starts to grow. */
export const DOCK_HOVER_GROW_DELAY_MS = 1000;
/** Roughly how long the grow then takes to settle. */
export const DOCK_HOVER_GROW_MS = 3000;

/** Scroll the hero's sequence takes, in screens, on top of its one pinned screen. */
export const HERO_SCROLL_SCREENS = 1;

/** Fraction of the settle where the wordmark's click target (the hockey easter egg) comes live. */
export const NAV_WORDMARK_SETTLED_AT =
  PHASES.rise[0] + 0.7 * (PHASES.rise[1] - PHASES.rise[0]);
