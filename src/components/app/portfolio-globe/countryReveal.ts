import * as THREE from "three";

import { easeSettle } from "@/components/app/max-hero/heroTransition";

/** Share of the phase spent staggering, so far-side borders finish after the facing ones. */
const STAGGER = 0.55;

export interface CountryOutline {
  /** three-globe's per-polygon group: the border line plus the fill it sits on. */
  group: THREE.Object3D;
  stroke: THREE.LineSegments;
  /** Indices in the finished outline — the draw range grows to this. */
  total: number;
  /** 0 for a border facing the camera, 1 at the antipode; borders draw outward from centre. */
  order: number;
}

/** three-globe stamps this on the group it builds per polygon (cap/side mesh + stroke line). */
function isPolygonGroup(object: THREE.Object3D): boolean {
  if (!("__globeObjType" in object)) return false;
  const type = object.__globeObjType;
  return typeof type === "string" && type === "polygon";
}

/** `instanceof` here would narrow to three's `any`-parameterised class; the type tag is exact. */
function isLineSegments(object: THREE.Object3D): object is THREE.LineSegments {
  return object.type === "LineSegments";
}

function indexCount(geometry: THREE.BufferGeometry): number {
  if (geometry.index !== null) return geometry.index.count;
  return geometry.hasAttribute("position")
    ? geometry.getAttribute("position").count
    : 0;
}

/**
 * Finds the border lines three-globe built for the polygon layer, ordered by how far each one
 * sits from `focus` — the globe-space direction currently facing the camera.
 *
 * Returns an empty list until the layer has built its objects, so callers should keep asking.
 */
export function collectCountryOutlines(
  root: THREE.Object3D,
  focus: THREE.Vector3,
): CountryOutline[] {
  const outlines: CountryOutline[] = [];
  const centre = new THREE.Vector3();

  root.traverse((object) => {
    if (!isPolygonGroup(object)) return;
    for (const child of object.children) {
      if (!isLineSegments(child)) continue;
      const total = indexCount(child.geometry);
      if (total === 0) continue;
      child.geometry.computeBoundingSphere();
      const bounds = child.geometry.boundingSphere;
      if (bounds === null) continue;
      centre.copy(bounds.center).normalize();
      outlines.push({
        group: object,
        stroke: child,
        total,
        order: (1 - centre.dot(focus)) / 2,
      });
    }
  });

  return outlines;
}

/**
 * Grows every border's draw range with the phase, staggered by `order`. A country's fill is held
 * back with its border, so nothing of the polygon layer shows before the outline starts drawing.
 */
export function drawCountryOutlines(
  outlines: readonly CountryOutline[],
  progress: number,
): void {
  for (const outline of outlines) {
    const local = Math.min(
      1,
      Math.max(0, (progress - outline.order * STAGGER) / (1 - STAGGER)),
    );
    const drawn = Math.round(outline.total * easeSettle(local));
    outline.group.visible = drawn > 1;
    outline.stroke.visible = true;
    outline.stroke.geometry.setDrawRange(0, drawn);
  }
}
