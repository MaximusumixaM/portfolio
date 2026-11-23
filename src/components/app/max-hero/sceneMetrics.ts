// Framing shared by the wordmark and the globe — they occupy one canvas, so both measure against these.

export const CAMERA_DISTANCE = 9;
export const CAMERA_FOV = 40;

/** Radius of the circle the formation arcs draw, in world units. */
export const FORMATION_RING_RADIUS = 2.4;

/**
 * Sphere radius whose silhouette lands on a flat ring of `FORMATION_RING_RADIUS`. A sphere of
 * radius r subtends asin(r/d) where a flat circle of radius R subtends atan(R/d), so the globe
 * has to be a shade smaller than the circle to grow inside it rather than out of it.
 */
export const FORMATION_SPHERE_RADIUS =
  FORMATION_RING_RADIUS /
  Math.hypot(1, FORMATION_RING_RADIUS / CAMERA_DISTANCE);

/** Below this viewport width (Tailwind's `md`) layouts stack instead of sitting side by side. */
export const STACKED_BREAKPOINT_PX = 768;

/** The wordmark's height in world units — camera framing is tuned to this. */
export const WORDMARK_HEIGHT = 3.4;
/** Its width to height, from the source SVG's viewBox (1047 × 389). */
export const WORDMARK_ASPECT = 1047 / 389;

/** How much of the viewport's width and height the hero wordmark may fill, before its overall scale. */
export const HERO_FIT_WIDTH = 0.86;
export const HERO_FIT_HEIGHT = 0.7;
/** Overall on-screen size of the hero wordmark, on top of that fit (and never above 1×). */
export const HERO_WORDMARK_SCALE = 0.8;

/**
 * The hero wordmark's on-screen height as CSS: the same fit HeroStage makes in world units, worked
 * through the camera into viewport units. For the DOM laid round the wordmark, and the outline that
 * stands in for it before the 3D loads.
 */
export const HERO_WORDMARK_HEIGHT_CSS = (() => {
  const viewportWorldHeight =
    2 * CAMERA_DISTANCE * Math.tan(((CAMERA_FOV / 2) * Math.PI) / 180);
  const byHeight = HERO_FIT_HEIGHT * HERO_WORDMARK_SCALE * 100;
  const atFullSize =
    (WORDMARK_HEIGHT / viewportWorldHeight) * HERO_WORDMARK_SCALE * 100;
  const byWidth =
    (HERO_FIT_WIDTH / WORDMARK_ASPECT) * HERO_WORDMARK_SCALE * 100;
  return `min(${byHeight.toFixed(2)}vh, ${atFullSize.toFixed(2)}vh, ${byWidth.toFixed(2)}vw)`;
})();
