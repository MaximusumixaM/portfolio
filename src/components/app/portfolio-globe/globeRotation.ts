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

export interface DiscFraming {
  /** How far the globe's centre sits off the camera's axis, in world units. */
  centreX: number;
  /** Globe radius, in world units. */
  radius: number;
  cameraDistance: number;
  /** Where the aimed-at coordinate should land across the drawn disc: 0 its centre, 1 its limb. */
  across: number;
}

/** Where an aimed coordinate ends up, relative to the globe's centre, after `spin` is added. */
function aimedPoint(
  lat: number,
  radius: number,
  spin: number,
): { x: number; z: number } {
  const sinLat = Math.sin(lat * DEG_TO_RAD);
  const cosLat = Math.cos(lat * DEG_TO_RAD);
  return {
    x: radius * cosLat * Math.sin(spin),
    z: radius * (sinLat * sinLat + cosLat * cosLat * Math.cos(spin)),
  };
}

/** Projected x of a point, in world units on the camera's z = 0 plane. */
function projectedX(
  framing: DiscFraming,
  point: { x: number; z: number },
): number {
  const { centreX, cameraDistance } = framing;
  return ((centreX + point.x) * cameraDistance) / (cameraDistance - point.z);
}

/**
 * The globe's silhouette as it actually renders. Off the camera's axis a perspective sphere does
 * not project centred on its own centre, so the disc has to be measured from its tangent lines.
 */
function discBounds(framing: DiscFraming): { centre: number; radius: number } {
  const { centreX, radius, cameraDistance } = framing;
  const toCentre = Math.hypot(centreX, cameraDistance);
  const halfAngle = Math.asin(radius / toCentre);
  const axisAngle = Math.atan2(-centreX, cameraDistance);
  const left = -cameraDistance * Math.tan(axisAngle + halfAngle);
  const right = -cameraDistance * Math.tan(axisAngle - halfAngle);
  return { centre: (left + right) / 2, radius: (right - left) / 2 };
}

/**
 * Extra spin, in radians, to add to a coordinate's aim so it lands where `framing.across` asks.
 *
 * Aiming a coordinate straight at the camera leaves it visibly off the middle of the drawn disc,
 * because an off-axis sphere projects its nearest point outwards rather than onto its own centre.
 * The correction is a spin about the globe's own axis — a yaw applied after the aim would do the
 * same job on screen but roll the whole globe over by the coordinate's latitude.
 *
 * Bisected rather than solved: the projection is monotonic in the spin but not invertible.
 */
export function aimSpinForCoords(lat: number, framing: DiscFraming): number {
  const disc = discBounds(framing);
  const target = disc.centre + framing.across * disc.radius;
  let low = 0;
  // Past a quarter turn the coordinate has gone round the limb, so there's nothing to reach for.
  let high = Math.PI / 2;
  for (let step = 0; step < 24; step++) {
    const mid = (low + high) / 2;
    if (projectedX(framing, aimedPoint(lat, framing.radius, mid)) < target) {
      low = mid;
    } else {
      high = mid;
    }
  }
  return (low + high) / 2;
}
