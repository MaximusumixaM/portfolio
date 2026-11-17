import * as THREE from "three";

import type { GlobePolygon } from "./globePolygons";
import { findGroupPolygon } from "./outlineReveal";

/** How far a marked country's fill moves from the page colour towards the ink — a light shade. */
const COUNTRY_TINT = 0.1;
/** Opacity of the wash over a marked province, which sits on top of its country's shade. */
const REGION_OPACITY = 0.35;

const tint = new THREE.Color();

/** `instanceof` here would narrow to three's `any`-parameterised class; the type tag is exact. */
function isMesh(object: THREE.Object3D): object is THREE.Mesh {
  return object.type === "Mesh";
}

function isMeshBasicMaterial(
  material: THREE.Material,
): material is THREE.MeshBasicMaterial {
  return material.type === "MeshBasicMaterial";
}

/**
 * The fill materials (cap and sides) three-globe made for polygons, grouped under the key `keyOf`
 * gives each (skipped when it gives none). They're per-polygon, so shading one never touches another.
 */
export function collectFills(
  root: THREE.Object3D,
  keyOf: (polygon: GlobePolygon) => string | undefined,
): Map<string, THREE.MeshBasicMaterial[]> {
  const fills = new Map<string, THREE.MeshBasicMaterial[]>();
  root.traverse((object) => {
    const polygon = findGroupPolygon(object);
    const key = polygon === undefined ? undefined : keyOf(polygon);
    if (key === undefined) return;
    const [conic] = object.children;
    if (conic === undefined || !isMesh(conic)) return;
    const materials: THREE.Material[] = Array.isArray(conic.material)
      ? conic.material
      : [conic.material];
    fills.set(key, [
      ...(fills.get(key) ?? []),
      ...materials.filter(isMeshBasicMaterial),
    ]);
  });
  return fills;
}

/** Tints `country`'s opaque fill towards `ink` by `amount` (0–1); the rest rest at `surface`. */
export function shadeCountry(
  fills: ReadonlyMap<string, readonly THREE.MeshBasicMaterial[]>,
  country: string | undefined,
  amount: number,
  surface: THREE.Color,
  ink: THREE.Color,
): void {
  for (const [code, materials] of fills) {
    tint.copy(surface).lerp(ink, code === country ? amount * COUNTRY_TINT : 0);
    for (const material of materials) material.color.copy(tint);
  }
}

/** Washes `region`'s clear fill in `ink` by `amount` (0–1); the rest stay clear. */
export function shadeRegion(
  fills: ReadonlyMap<string, readonly THREE.MeshBasicMaterial[]>,
  region: string | undefined,
  amount: number,
  ink: THREE.Color,
): void {
  for (const [code, materials] of fills) {
    const opacity = code === region ? amount * REGION_OPACITY : 0;
    for (const material of materials) {
      material.color.copy(ink);
      material.opacity = opacity;
    }
  }
}
