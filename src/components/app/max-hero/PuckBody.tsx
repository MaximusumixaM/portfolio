import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { PUCK_PHASES, getHeroProgress, phase } from "./heroTransition";
import { useThemeColor } from "./useThemeColor";

/** Puck dimensions in the assembly's local space (where the MAX letters are ~3.4 tall). */
export const PUCK_RADIUS = 2.4;
export const PUCK_THICKNESS = 1.05;

const ARC_SEGMENTS = 40;
/** Tube radius of the arcs, ~2px on screen at the formation scale. Round by construction. */
const ARC_TUBE_RADIUS = 0.014;
/** Arcs sit a hair above the top face so they don't z-fight the cap. */
const ARC_Z = PUCK_THICKNESS / 2 + 0.02;
/** Start angles at N, E, S, W; each arc sweeps 90° clockwise to close the circle. */
const CARDINALS = [
  { id: "n", start: Math.PI / 2 },
  { id: "e", start: 0 },
  { id: "s", start: -Math.PI / 2 },
  { id: "w", start: Math.PI },
] as const;

/** Half-length of the settled pill's straight middle, in local units before PILL_SCALE. */
const PILL_HALF_LENGTH = 3.4;
/** Uniform in-plane scale from the puck radius down to the settled pill's end-cap radius. */
const PILL_SCALE = 0.42;

/** Arcs finish their job as the body reveals, then fade before the rise. */
const ARC_FADE = [0.34, 0.46] as const;
/**
 * Body fades over the last quarter of the rise — the same marker the tilt flattens on —
 * so it's gone by the time it reaches the top, handing the shape to the glassy DOM pill.
 */
const BODY_FADE: readonly [number, number] = [
  PUCK_PHASES.rise[0] + 0.75 * (PUCK_PHASES.rise[1] - PUCK_PHASES.rise[0]),
  PUCK_PHASES.rise[1],
];

function buildArcGeometry(startAngle: number): THREE.TubeGeometry {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= ARC_SEGMENTS; i++) {
    const angle = startAngle - (i / ARC_SEGMENTS) * (Math.PI / 2);
    points.push(
      new THREE.Vector3(
        Math.cos(angle) * PUCK_RADIUS,
        Math.sin(angle) * PUCK_RADIUS,
        ARC_Z,
      ),
    );
  }
  const curve = new THREE.CatmullRomCurve3(points);
  return new THREE.TubeGeometry(curve, ARC_SEGMENTS, ARC_TUBE_RADIUS, 8, false);
}

/** Rounded edge as a fraction of thickness — bevels the rim like a real puck. */
const BEVEL_RATIO = 0.13;

/** Extruded stadium (capsule) outline with rounded rim: two caps joined by straight edges. */
function buildStadiumGeometry(): THREE.ExtrudeGeometry {
  const hl = PILL_HALF_LENGTH;
  const r = PUCK_RADIUS;
  const shape = new THREE.Shape();
  shape.moveTo(-hl, -r);
  shape.lineTo(hl, -r);
  shape.absarc(hl, 0, r, -Math.PI / 2, Math.PI / 2, false);
  shape.lineTo(-hl, r);
  shape.absarc(-hl, 0, r, Math.PI / 2, Math.PI * 1.5, false);
  shape.closePath();
  const bevel = PUCK_THICKNESS * BEVEL_RATIO;
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: PUCK_THICKNESS - 2 * bevel,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 5,
    curveSegments: 64,
    steps: 1,
  });
  // Centre the thickness on z = 0 regardless of how the bevel extends the depth.
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  if (box !== null) geometry.translate(0, 0, -(box.max.z + box.min.z) / 2);
  return geometry;
}

/**
 * The hockey puck. Its shape travels: four arcs sweep in to draw a 2D circle, the body
 * reveals and tilts to a 3D puck, then it flattens and stretches into the 2D pill shape
 * before the glassy DOM nav pill takes over.
 *
 * The body geometry is the *full* pill (earcut-filled, so the middle is solid). A vertex
 * shader compresses the two halves together — `transformed.x -= sign(x) * uCompress` — to
 * a circle at the start; releasing that compression opens it back into the pill. Morphing
 * this direction avoids the torn middle that splitting a disc apart would leave.
 *
 * Self-driven by scroll progress; position/tilt/rise are the parent HeroStage's job.
 */
export function PuckBody() {
  const bodyRef = useRef<THREE.Mesh>(null);
  // Arcs start strong and ease to the default border colour as they draw in.
  const arcColorStart = useThemeColor("--color-border-strong", "#999999");
  const arcColorEnd = useThemeColor("--color-border-default", "#e5e5e5");

  const arcGeometries = useMemo(
    () => CARDINALS.map((c) => buildArcGeometry(c.start)),
    [],
  );
  const arcMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false }),
    [],
  );
  const arcIndexCount = arcGeometries[0]?.index?.count ?? 0;

  const bodyGeometry = useMemo(buildStadiumGeometry, []);

  const { bodyMaterial, compress } = useMemo(() => {
    const uCompress = { value: PILL_HALF_LENGTH };
    const material = new THREE.MeshStandardMaterial({
      color: "#ffffff",
      roughness: 0.45,
      metalness: 0.0,
      transparent: true,
    });
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uCompress = uCompress;
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nuniform float uCompress;")
        .replace(
          "#include <begin_vertex>",
          "#include <begin_vertex>\ntransformed.x -= sign(position.x) * uCompress;",
        );
    };
    return { bodyMaterial: material, compress: uCompress };
  }, []);

  useEffect(() => {
    return () => {
      arcMaterial.dispose();
      bodyGeometry.dispose();
      bodyMaterial.dispose();
      for (const geometry of arcGeometries) geometry.dispose();
    };
  }, [arcGeometries, arcMaterial, bodyGeometry, bodyMaterial]);

  useFrame(() => {
    const progress = getHeroProgress();
    const draw = phase(progress, PUCK_PHASES.arcs);
    const reveal = phase(progress, PUCK_PHASES.reveal);
    const morph = phase(progress, PUCK_PHASES.morph);
    const arcVisibility = 1 - phase(progress, ARC_FADE);
    const bodyVisibility = 1 - phase(progress, BODY_FADE);

    const drawn = Math.floor(arcIndexCount * draw);
    for (const geometry of arcGeometries) geometry.setDrawRange(0, drawn);
    arcMaterial.opacity = arcVisibility;
    arcMaterial.color.copy(arcColorStart).lerp(arcColorEnd, draw);

    bodyMaterial.opacity = reveal * bodyVisibility;
    // Stays a full circle through the rise; only opens into the pill once parked at the top.
    compress.value = PILL_HALF_LENGTH * (1 - morph);

    const body = bodyRef.current;
    if (body === null) return;
    const inPlane = THREE.MathUtils.lerp(1, PILL_SCALE, morph);
    const thickness = THREE.MathUtils.lerp(1, 0.06, morph);
    body.scale.set(inPlane, inPlane, thickness);
    body.visible = reveal > 0.001 && bodyVisibility > 0.001;
  });

  return (
    <group>
      <mesh ref={bodyRef} geometry={bodyGeometry} material={bodyMaterial} />
      {CARDINALS.map((cardinal, index) => {
        const geometry = arcGeometries[index];
        if (geometry === undefined) return null;
        return (
          <mesh key={cardinal.id} geometry={geometry} material={arcMaterial} />
        );
      })}
    </group>
  );
}
