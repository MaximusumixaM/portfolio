import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import {
  PHASES,
  easeSettle,
  getHeroProgress,
  phase,
} from "@/components/app/max-hero/heroTransition";
import { useThemeColor } from "@/components/lib/useThemeColor";

/** Great circles through the poles; each one carries a meridian and its antimeridian. */
const MERIDIAN_COUNT = 6;
const PARALLEL_LATITUDES = [-60, -30, 0, 30, 60];
const RING_SEGMENTS = 96;
/** Lifts the rings over both polygon tiers, so land doesn't punch holes in the cage. */
const RING_ALTITUDE = 1.008;
/** Share of the phase spent staggering the starts, so rings draw in one after another. */
const STAGGER = 0.35;
/** Ink while the rings draw themselves on — the moment they're the only thing on the globe. */
const DRAW_OPACITY = 0.65;
/** What they ease back to once the cage is complete, sitting under the country outlines. */
const IDLE_OPACITY = 0.3;
/** Point in the phase where the drawn rings start easing back to `IDLE_OPACITY`. */
const SETTLE_AT = 0.7;
// Scaffolding, not scenery: the cage clears out as the borders take over, gone by the last beat.
const FADE_RANGE: readonly [number, number] = [
  PHASES.countries[0],
  PHASES.reveal[1],
];
const DEG_TO_RAD = Math.PI / 180;

interface Ring {
  id: string;
  /** Built imperatively: `<line>` in JSX resolves to the SVG element, not three's. */
  line: THREE.Line;
  /** Where along the ring the line starts drawing from, as a vertex index. */
  startIndex: number;
  /** 0–1 offset into the stagger window. */
  delay: number;
}

/** Deterministic 0–1 scatter, so rings differ from each other but not between renders. */
function scatter(seed: number): number {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

/** Two laps' worth of points, so a draw range can start anywhere and wrap round the ring. */
function buildRing(
  pointAt: (angle: number) => THREE.Vector3,
): THREE.BufferGeometry {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= RING_SEGMENTS * 2; i++) {
    points.push(pointAt((i / RING_SEGMENTS) * Math.PI * 2));
  }
  return new THREE.BufferGeometry().setFromPoints(points);
}

function buildRings(radius: number, material: THREE.LineBasicMaterial): Ring[] {
  const meridians = Array.from({ length: MERIDIAN_COUNT }, (_unused, index) => {
    // three-globe places lng 0 on +x and winds towards +z, so a meridian plane spans (u, up).
    const theta = (90 - (index * 180) / MERIDIAN_COUNT) * DEG_TO_RAD;
    const u = new THREE.Vector3(Math.cos(theta), 0, Math.sin(theta));
    return (angle: number) =>
      new THREE.Vector3(
        u.x * Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        u.z * Math.cos(angle) * radius,
      );
  });

  const parallels = PARALLEL_LATITUDES.map((latitude) => {
    const y = Math.sin(latitude * DEG_TO_RAD) * radius;
    const ringRadius = Math.cos(latitude * DEG_TO_RAD) * radius;
    return (angle: number) =>
      new THREE.Vector3(
        Math.cos(angle) * ringRadius,
        y,
        Math.sin(angle) * ringRadius,
      );
  });

  return [...meridians, ...parallels].map((pointAt, index) => ({
    id:
      index < MERIDIAN_COUNT
        ? `meridian-${String(index)}`
        : `parallel-${String(index)}`,
    line: new THREE.Line(buildRing(pointAt), material),
    startIndex: Math.floor(scatter(index + 1) * RING_SEGMENTS),
    delay: scatter(index + 11.7) * STAGGER,
  }));
}

export interface GraticuleProps {
  /** Sphere radius in globe units — the rings hug it. */
  radius: number;
}

// The lat/long cage: each ring draws itself on from its own start point, picking up where the
// formation arcs left off, then settles back to a quiet guide under the country outlines.
export function Graticule({ radius }: GraticuleProps) {
  // Drawn in the ink the borders use, then eased back by opacity alone so it stays neutral.
  const color = useThemeColor("--color-foreground-default", "#000000");
  const groupRef = useRef<THREE.Group>(null);

  const material = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      }),
    [],
  );
  const rings = useMemo(
    () => buildRings(radius * RING_ALTITUDE, material),
    [radius, material],
  );

  useEffect(() => {
    material.color.copy(color);
  }, [material, color]);

  useEffect(() => {
    return () => {
      material.dispose();
      for (const ring of rings) ring.line.geometry.dispose();
    };
  }, [rings, material]);

  useFrame(() => {
    const progress = getHeroProgress();
    const drawn = phase(progress, PHASES.graticule);
    const remaining = 1 - phase(progress, FADE_RANGE);

    const group = groupRef.current;
    if (group !== null) group.visible = drawn > 0.001 && remaining > 0.001;
    if (drawn <= 0.001) return;

    // Full ink while they draw; they only ease back once the cage is nearly complete.
    const settled = Math.max(0, (drawn - SETTLE_AT) / (1 - SETTLE_AT));
    material.opacity =
      THREE.MathUtils.lerp(DRAW_OPACITY, IDLE_OPACITY, settled) * remaining;

    for (const ring of rings) {
      const local = easeSettle(
        Math.min(1, Math.max(0, (drawn - ring.delay) / (1 - STAGGER))),
      );
      ring.line.geometry.setDrawRange(
        ring.startIndex,
        Math.round(RING_SEGMENTS * local) + 1,
      );
    }
  });

  return (
    <group ref={groupRef}>
      {rings.map((ring) => (
        <primitive key={ring.id} object={ring.line} />
      ))}
    </group>
  );
}
