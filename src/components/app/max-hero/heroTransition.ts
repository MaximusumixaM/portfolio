// The hero section's choreography: its beats, as sub-ranges of the "hero" timeline progress.

/** Height of the settled logo in CSS pixels — the pill reserves exactly this. */
export const NAV_LOGO_HEIGHT_PX = 32;

// Mirrors NavPill's `top-m` (16) + `py-s` (8); the border is a non-layout SVG overlay.
const NAV_PILL_TOP_PX = 16;
const NAV_PILL_PADDING_Y_PX = 8;

/** Vertical centre of the settled logo, in CSS pixels from the top of the viewport. */
export const NAV_LOGO_CENTER_Y_PX =
  NAV_PILL_TOP_PX + NAV_PILL_PADDING_Y_PX + NAV_LOGO_HEIGHT_PX / 2;

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

/** Where the portfolio starts rising in under the hero, partway through the globe's sweep. */
export const PORTFOLIO_RISE_AT = 0.5;

/** The docked globe's radius on screen, in CSS pixels. */
export const DOCK_RADIUS_PX = 64;
/** Its radius while hovered. */
export const DOCK_HOVER_RADIUS_PX = 70;
/** Gap between the docked globe and the right edge — matches the corner labels' `right-m`. */
export const DOCK_RIGHT_PX = 16;
/** Top edge of the docked globe — level with the corner labels' `top-m`. */
export const DOCK_TOP_PX = 16;

/** Scroll the hero's sequence takes, in screens, on top of its one pinned screen. */
export const HERO_SCROLL_SCREENS = 1;

/** Fraction of the settle where the pill fades in behind the arriving logo. */
export const NAV_PILL_APPEAR_AT =
  PHASES.rise[0] + 0.7 * (PHASES.rise[1] - PHASES.rise[0]);
/** Progress where the logo has parked and the pill's border starts drawing. */
export const NAV_PILL_BORDER_AT = PHASES.rise[1] + 0.02;
