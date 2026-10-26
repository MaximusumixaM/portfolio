import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { PHASES } from "@/components/app/max-hero/heroTransition";
import { FORMATION_RING_RADIUS } from "@/components/app/max-hero/sceneMetrics";
import { getSectionProgress, phase } from "@/components/app/scroll/timeline";
import { useThemeColor } from "@/components/lib/useThemeColor";

const ARC_SEGMENTS = 40;
/** Tube radius of the arcs, ~2px on screen at the formation scale. Round by construction. */
const ARC_TUBE_RADIUS = 0.014;
/** Start angles at N, E, S, W; each arc sweeps 90° clockwise to close the circle. */
const CARDINALS = [
  { id: "n", start: Math.PI / 2 },
  { id: "e", start: 0 },
  { id: "s", start: -Math.PI / 2 },
  { id: "w", start: Math.PI },
] as const;
// The rings take the circle over, so it's gone well before the globe leaves the centre.
const FADE_RANGE: readonly [number, number] = [
  PHASES.graticule[0],
  PHASES.graticule[0] + 0.45 * (PHASES.graticule[1] - PHASES.graticule[0]),
];

function buildArcGeometry(startAngle: number): THREE.TubeGeometry {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= ARC_SEGMENTS; i++) {
    const angle = startAngle - (i / ARC_SEGMENTS) * (Math.PI / 2);
    points.push(
      new THREE.Vector3(
        Math.cos(angle) * FORMATION_RING_RADIUS,
        Math.sin(angle) * FORMATION_RING_RADIUS,
        0,
      ),
    );
  }
  const curve = new THREE.CatmullRomCurve3(points);
  return new THREE.TubeGeometry(curve, ARC_SEGMENTS, ARC_TUBE_RADIUS, 8, false);
}

// Four arcs sweeping in from the cardinals to close a circle — the outline the globe then fills.
// It rides the globe's placement group, so it travels along as the globe leaves the centre, fading out.
export function FormationRing() {
  const arcColorStart = useThemeColor("--color-border-strong", "#999999");
  const arcColorEnd = useThemeColor("--color-border-default", "#e5e5e5");

  const geometries = useMemo(
    () => CARDINALS.map((cardinal) => buildArcGeometry(cardinal.start)),
    [],
  );
  // Depth-tested, so the letters in front of the circle stay in front of it.
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      }),
    [],
  );
  const indexCount = geometries[0]?.index?.count ?? 0;
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    return () => {
      material.dispose();
      for (const geometry of geometries) geometry.dispose();
    };
  }, [geometries, material]);

  useFrame(() => {
    const progress = getSectionProgress("hero");
    const draw = phase(progress, PHASES.arcs);
    const opacity = 1 - phase(progress, FADE_RANGE);

    const drawn = Math.floor(indexCount * draw);
    for (const geometry of geometries) geometry.setDrawRange(0, drawn);
    material.opacity = opacity;
    material.color.copy(arcColorStart).lerp(arcColorEnd, draw);

    const group = groupRef.current;
    if (group !== null) group.visible = opacity > 0.001;
  });

  return (
    <group ref={groupRef}>
      {CARDINALS.map((cardinal, index) => {
        const geometry = geometries[index];
        if (geometry === undefined) return null;
        return (
          <mesh key={cardinal.id} geometry={geometry} material={material} />
        );
      })}
    </group>
  );
}
