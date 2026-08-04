const DEG_TO_RAD = Math.PI / 180;

/** Globe rotation, in radians, that brings a coordinate round to face the camera. */
export function rotationForCoords(
  lat: number,
  lng: number,
): { x: number; y: number } {
  return { x: lat * DEG_TO_RAD, y: -lng * DEG_TO_RAD };
}

/** Adds `delta` to `current` along whichever way round is shorter. */
export function shortestAngleTo(current: number, target: number): number {
  const turn = Math.PI * 2;
  const delta =
    ((((target - current + Math.PI) % turn) + turn) % turn) - Math.PI;
  return current + delta;
}
