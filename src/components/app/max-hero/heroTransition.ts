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
// rings draw onto it, the wordmark leaves for the nav while the globe slides out from under it,
// then the borders draw and the globe is handed to the visitor, with the About journey straight
// after. Overlaps are deliberate — the beats should knit.
export const PHASES = {
  arcs: [0.0, 0.15],
  graticule: [0.14, 0.4],
  rise: [0.28, 0.6],
  shift: [0.41, 0.6],
  countries: [0.57, 0.97],
  reveal: [0.97, 1],
} as const;

/** Scroll the hero's sequence takes, in screens, on top of its one pinned screen. */
export const HERO_SCROLL_SCREENS = 1;

/** Where the journey takes over: the first chapter's provinces start as the borders reach 90%. */
export const JOURNEY_HANDOFF_AT =
  PHASES.countries[0] + 0.9 * (PHASES.countries[1] - PHASES.countries[0]);

/** Fraction of the settle where the pill fades in behind the arriving logo. */
export const NAV_PILL_APPEAR_AT =
  PHASES.rise[0] + 0.7 * (PHASES.rise[1] - PHASES.rise[0]);
/** Progress where the logo has parked and the pill's border starts drawing. */
export const NAV_PILL_BORDER_AT = PHASES.rise[1] + 0.02;
