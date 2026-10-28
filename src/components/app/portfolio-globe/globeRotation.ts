import * as THREE from "three";

/**
 * The globe's turn as two nested groups apply it: `x`/`y` on the rotation group (Euler `XYZ`,
 * `z` unused) inside `z` on the roll group — together one `ZXY` rotation.
 */
export interface GlobeOrientation {
  x: number;
  y: number;
  z: number;
}

/** Adds `delta` to `current` along whichever way round is shorter. */
export function shortestAngleTo(current: number, target: number): number {
  const turn = Math.PI * 2;
  const delta =
    ((((target - current + Math.PI) % turn) + turn) % turn) - Math.PI;
  return current + delta;
}

const toCamera = new THREE.Vector3();
const screenUp = new THREE.Vector3();
const globeBasis = new THREE.Matrix4();
const worldBasis = new THREE.Matrix4();
const solved = new THREE.Euler();

/**
 * Orientation that turns a point on the globe to face the camera head-on, with its local north
 * pointing straight up the screen — so the land round it reads undistorted however far off-axis
 * the globe sits. `normal` and `north` are that point's outward and northward directions in globe
 * space; `centre` and `camera` are world positions.
 */
export function faceCamera(
  normal: THREE.Vector3,
  north: THREE.Vector3,
  centre: THREE.Vector3,
  camera: THREE.Vector3,
): GlobeOrientation {
  toCamera.subVectors(camera, centre).normalize();
  screenUp.set(0, 1, 0).addScaledVector(toCamera, -toCamera.y).normalize();
  globeBasis.makeBasis(normal, north, normal.clone().cross(north));
  worldBasis.makeBasis(toCamera, screenUp, toCamera.clone().cross(screenUp));
  // Maps the point's own (normal, north, east) frame onto (towards camera, screen up, across).
  worldBasis.multiply(globeBasis.transpose());
  solved.setFromRotationMatrix(worldBasis, "ZXY");
  return { x: solved.x, y: solved.y, z: solved.z };
}
