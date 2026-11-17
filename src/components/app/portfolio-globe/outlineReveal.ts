import * as THREE from "three";

import { isGlobePolygon, type GlobePolygon } from "./globePolygons";

import { easeSettle } from "@/components/app/scroll/timeline";

/** Share of the phase spent staggering, so far-side borders finish after the facing ones. */
const STAGGER = 0.55;

export interface PolygonOutline {
  /** three-globe's per-polygon group: the border line plus the fill it sits on. */
  group: THREE.Object3D;
  stroke: THREE.LineSegments;
  /** Indices in the finished outline — the draw range grows to this. */
  total: number;
  /** 0 for the outline nearest the focus, 1 for the farthest; outlines draw outward in this order. */
  order: number;
}

/** three-globe stamps this on the group it builds per polygon (cap/side mesh + stroke line). */
function isPolygonGroup(object: THREE.Object3D): boolean {
  if (!("__globeObjType" in object)) return false;
  const type = object.__globeObjType;
  return typeof type === "string" && type === "polygon";
}

/** The polygon three-globe built a group from: its digest binds `{ data: polygon, … }` as `__data`. */
export function findGroupPolygon(
  object: THREE.Object3D,
): GlobePolygon | undefined {
  if (!("__data" in object)) return undefined;
  const bound = object.__data;
  if (typeof bound !== "object" || bound === null || !("data" in bound)) {
    return undefined;
  }
  const { data } = bound;
  return typeof data === "object" && data !== null && isGlobePolygon(data)
    ? data
    : undefined;
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
 * Finds the outlines three-globe built for the polygons `include` picks, ordered by how far each
 * one sits from `focus` (a globe-space direction) relative to the rest.
 *
 * Returns an empty list until the layer has built its objects, so callers should keep asking.
 */
export function collectOutlines(
  root: THREE.Object3D,
  focus: THREE.Vector3,
  include: (polygon: GlobePolygon) => boolean,
): PolygonOutline[] {
  const outlines: PolygonOutline[] = [];
  const centre = new THREE.Vector3();

  root.traverse((object) => {
    if (!isPolygonGroup(object)) return;
    const polygon = findGroupPolygon(object);
    if (polygon === undefined || !include(polygon)) return;
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

  // Spread the stagger across this set, however tight a cluster it is (one country's provinces).
  const farthest = Math.max(0, ...outlines.map((outline) => outline.order));
  return farthest === 0
    ? outlines
    : outlines.map((outline) => ({
        ...outline,
        order: outline.order / farthest,
      }));
}

/**
 * Grows every outline's draw range with the phase, staggered by `order`. A polygon's fill is held
 * back with its outline, so nothing of it shows before the outline starts drawing.
 */
export function drawOutlines(
  outlines: readonly PolygonOutline[],
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
