import * as THREE from "three";

const COUNTRIES_URL = "/geo/countries.geojson";
const REGIONS_URL = "/geo/regions.geojson";

/** Both tiers live in one three-globe layer; regions sit a hair higher so they paint on top. */
export const COUNTRY_ALTITUDE = 0.004;
export const REGION_ALTITUDE = 0.006;

/** Wash strengths for the selected project's country and its province/state. */
const COUNTRY_TINT_ALPHA = 0.1;
const REGION_TINT_ALPHA = 0.5;

const TRANSPARENT = "rgba(0, 0, 0, 0)";

export type PolygonTier = "country" | "region";

export interface GlobePolygon {
  /** ISO_A3 for countries, ISO 3166-2 for regions. */
  code: string;
  tier: PolygonTier;
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
  return "tier" in value && "code" in value;
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

/** Country outlines plus the handful of provinces/states we can highlight, as one flat layer. */
export async function loadGlobePolygons(): Promise<GlobePolygon[]> {
  const [countries, regions] = await Promise.all([
    fetchFeatures(COUNTRIES_URL),
    fetchFeatures(REGIONS_URL),
  ]);

  return [
    ...countries.map((feature) => ({
      code: readCode(feature, "ISO_A3"),
      tier: "country" as const,
      geometry: feature.geometry,
    })),
    ...regions.map((feature) => ({
      code: readCode(feature, "iso"),
      tier: "region" as const,
      geometry: feature.geometry,
    })),
  ];
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

function rgba(color: THREE.Color, alpha: number): string {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export interface PolygonPalette {
  /** The page-coloured fill that leaves only country strokes reading. */
  surface: THREE.Color;
  /** Foreground token — the outlines, and the wash over the selected country and region. */
  foreground: THREE.Color;
  selectedCountryCode: string | undefined;
  selectedRegionCode: string | undefined;
}

/** Cap fill for one polygon: a wash when it's the selection, page colour or nothing otherwise. */
export function polygonCapColor(
  polygon: GlobePolygon,
  palette: PolygonPalette,
): string {
  if (polygon.tier === "region") {
    return polygon.code === palette.selectedRegionCode
      ? rgba(palette.foreground, REGION_TINT_ALPHA)
      : TRANSPARENT;
  }
  return polygon.code === palette.selectedCountryCode
    ? rgba(palette.foreground, COUNTRY_TINT_ALPHA)
    : `#${palette.surface.getHexString()}`;
}
