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
  FORMATION_RING_RADIUS / Math.hypot(1, FORMATION_RING_RADIUS / CAMERA_DISTANCE);

/** Below this viewport width the panel sits under the globe rather than beside it. */
export const STACKED_BREAKPOINT_PX = 768;
