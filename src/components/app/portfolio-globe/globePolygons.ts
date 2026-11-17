import * as THREE from "three";

const COUNTRIES_URL = "/geo/countries.geojson";

/** Lifts the country layer just clear of the sphere's surface. */
export const COUNTRY_ALTITUDE = 0.004;

export interface GlobePolygon {
  /** ISO_A3. */
  code: string;
  /** Read by three-globe's default `polygonGeoJsonGeometry` accessor. */
  geometry: object;
}

interface GeoFeature {
  properties: Record<string, unknown>;
  geometry: object;
}

function isFeatureCollection(value: unknown): value is { features: object[] } {
  return (
    typeof value === "object" &&
    value !== null &&
    "features" in value &&
    Array.isArray(value.features)
  );
}

function isGeoFeature(value: object): value is GeoFeature {
  return "properties" in value && "geometry" in value;
}

/** three-globe hands accessors a bare `object`; this narrows it back to what we put in. */
export function isGlobePolygon(value: object): value is GlobePolygon {
  return "code" in value && "geometry" in value;
}

async function fetchFeatures(url: string): Promise<GeoFeature[]> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to load ${url}: ${response.status} ${response.statusText}`,
    );
  }
  const data: unknown = await response.json();
  if (!isFeatureCollection(data)) {
    throw new Error(`${url} is not a GeoJSON FeatureCollection`);
  }
  return data.features.filter(isGeoFeature);
}

function readCode(feature: GeoFeature, key: string): string {
  const value = feature.properties[key];
  return typeof value === "string" ? value : "";
}

/** The world's country outlines, as one flat layer. */
export async function loadGlobePolygons(): Promise<GlobePolygon[]> {
  const countries = await fetchFeatures(COUNTRIES_URL);
  return countries.map((feature) => ({
    code: readCode(feature, "ISO_A3"),
    geometry: feature.geometry,
  }));
}

/**
 * The shared canvas keeps ACES tone mapping for the wordmark's clearcoat, which would shift the
 * map off its token colours. three-globe builds the layer's materials itself, so opt them out here.
 */
export function disableToneMapping(root: THREE.Object3D): void {
  root.traverse((object) => {
    if (!hasMaterial(object)) return;
    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material];
    for (const material of materials) material.toneMapped = false;
  });
}

/** Meshes, lines and points all carry one; `Object3D` itself doesn't. */
function hasMaterial(
  object: THREE.Object3D,
): object is THREE.Object3D & { material: THREE.Material | THREE.Material[] } {
  return "material" in object;
}
