// Region-level zoom: the globe grows *away* from the camera, so the surface facing it (the city)
// keeps its depth and its surroundings magnify, without moving the camera the wordmark shares.

/** How much a chapter's arrival magnifies the globe at full zoom. */
export const ZOOM_MAGNIFICATION = 2;

export interface ZoomFraming {
  /** Resting centre and radius, in world units on the z = 0 plane. */
  x: number;
  y: number;
  radius: number;
  cameraDistance: number;
  /** Furthest right the disc's edge may reach as it swells, keeping clear of the text column. */
  maxRight: number;
}

export interface ZoomedGlobe {
  /** Where the globe's centre goes, in world space. */
  position: { x: number; y: number; z: number };
  /** Camera to globe centre, for maths that assumes the centre sits on z = 0. */
  distance: number;
  /** The disc as it lands on screen, measured on the z = 0 plane. */
  screenX: number;
  screenY: number;
  screenRadius: number;
}

/** Silhouette radius, on the z = 0 plane, of a sphere `distance` from the camera. */
function silhouetteRadius(
  radius: number,
  distance: number,
  cameraDistance: number,
): number {
  return (
    cameraDistance * Math.tan(Math.asin(Math.min(0.99, radius / distance)))
  );
}

export function zoomGlobe(
  framing: ZoomFraming,
  magnification: number,
): ZoomedGlobe {
  const { x, y, radius, cameraDistance, maxRight } = framing;
  const grown = radius * magnification;
  const z = radius - grown;
  const distance = cameraDistance - z;
  const screenRadius = silhouetteRadius(grown, distance, cameraDistance);
  // Only the swelling is held back: a resting disc that already reaches further keeps its place.
  const restingRight =
    x + silhouetteRadius(radius, cameraDistance, cameraDistance);
  const screenX = Math.min(x, Math.max(maxRight, restingRight) - screenRadius);
  // Pushed back, the centre has to sit further out to land on the same spot on screen.
  const depthScale = distance / cameraDistance;
  return {
    position: { x: screenX * depthScale, y: y * depthScale, z },
    distance,
    screenX,
    screenY: y,
    screenRadius,
  };
}
