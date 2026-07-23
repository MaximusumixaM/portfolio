import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { createFlexMaterial, type FlexMaterial } from "./flexMaterial";
import {
  NAV_LOGO_CENTER_Y_PX,
  NAV_LOGO_HEIGHT_PX,
  PUCK_PHASES,
  easeSettle,
  getHeroProgress,
  phase,
} from "./heroTransition";
import { buildWordmark, type LetterGeometry } from "./letterGeometries";
import { PUCK_RADIUS, PUCK_THICKNESS, PuckBody } from "./PuckBody";
import { usePointerRef } from "./usePointerRef";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

interface LetterItem {
  letter: LetterGeometry;
  material: FlexMaterial;
  /** Out-of-phase idle float so letters don't bob in sync. */
  phase: number;
  floatAmp: number;
  floatSpeed: number;
  swayAmp: number;
}

const FLOAT_SPEEDS = [0.62, 0.5, 0.7];
const FLOAT_AMPS = [0.075, 0.055, 0.065];
/** Overall on-screen size of the landing wordmark, on top of the responsive fit. */
const WORDMARK_SCALE = 0.8;
/** Fraction of the puck's diameter the MAX label spans once it's sitting on the face. */
const FACE_FILL = 0.82;
/** Peak tilt (radians) at the reveal, showing the puck's thickness before it flattens. */
const TILT_MAX = 0.55;

export function HeroStage() {
  const assemblyRef = useRef<THREE.Group>(null);
  const faceRef = useRef<THREE.Group>(null);
  const meshes = useRef(new Map<string, THREE.Mesh>());
  const viewport = useThree((state) => state.viewport);
  const size = useThree((state) => state.size);
  const pointer = usePointerRef();

  const prefersReducedMotion = usePrefersReducedMotion();
  const reducedMotionRef = useRef(prefersReducedMotion);
  reducedMotionRef.current = prefersReducedMotion;

  const wordmark = useMemo(() => buildWordmark(), []);
  const items = useMemo<LetterItem[]>(
    () =>
      wordmark.letters.map((letter, index) => ({
        letter,
        material: createFlexMaterial(index),
        phase: index * 2.4,
        floatAmp: FLOAT_AMPS[index] ?? 0.06,
        floatSpeed: FLOAT_SPEEDS[index] ?? 0.6,
        swayAmp: 0.02 + index * 0.004,
      })),
    [wordmark],
  );

  useEffect(() => {
    return () => {
      for (const { letter, material } of items) {
        letter.geometry.dispose();
        material.dispose();
      }
    };
  }, [items]);

  /** Landing size: fit the wordmark in the viewport with breathing room, capped at 1x. */
  const heroScale = useMemo(() => {
    const byWidth = (viewport.width * 0.86) / wordmark.width;
    const byHeight = (viewport.height * 0.7) / wordmark.height;
    return Math.min(byWidth, byHeight, 1) * WORDMARK_SCALE;
  }, [viewport.width, viewport.height, wordmark.width, wordmark.height]);

  /** Size the label shrinks to so it sits inside the puck face. */
  const faceScale = useMemo(
    () => (2 * PUCK_RADIUS * FACE_FILL) / wordmark.width,
    [wordmark.width],
  );

  /** Half the letters' extruded depth (in wordmark units), so they can rest on the cap. */
  const letterHalfDepth = useMemo(() => {
    const geometry = wordmark.letters[0]?.geometry;
    if (geometry === undefined) return 0.3;
    geometry.computeBoundingBox();
    const box = geometry.boundingBox;
    return box === null ? 0.3 : (box.max.z - box.min.z) / 2;
  }, [wordmark]);

  useFrame((state, delta) => {
    const reduced = reducedMotionRef.current;
    const progress = getHeroProgress();
    const arcs = phase(progress, PUCK_PHASES.arcs);
    const reveal = phase(progress, PUCK_PHASES.reveal);
    const rise = phase(progress, PUCK_PHASES.rise);
    // Last quarter of the rise: the tilt flattens, the puck fades, and the letters settle
    // back to the z = 0 plane (they were lifted only to sit on the puck).
    const [riseStart, riseEnd] = PUCK_PHASES.rise;
    const flatten = phase(progress, [riseStart + 0.75 * (riseEnd - riseStart), riseEnd]);
    const settle = easeSettle(progress);
    const time = reduced ? 0.4 : state.clock.elapsedTime;
    // Idle life fades out as the puck forms, not as the whole settle completes.
    const liveliness = reduced ? 0 : 1 - arcs;

    for (const item of items) {
      const uniforms = item.material.userData.flexUniforms;
      uniforms.uTime.value = time;
      uniforms.uFlatten.value = settle;
      // Clearcoat stops short of 0 — hitting 0 toggles USE_CLEARCOAT and recompiles.
      item.material.clearcoat = THREE.MathUtils.lerp(1.0, 0.15, settle);
      item.material.roughness = THREE.MathUtils.lerp(0.32, 0.62, settle);
      item.material.envMapIntensity = THREE.MathUtils.lerp(1.15, 0.35, settle);

      const mesh = meshes.current.get(item.letter.id);
      if (mesh === undefined) continue;
      mesh.position.y =
        item.letter.position[1] +
        Math.sin(time * item.floatSpeed + item.phase) *
          item.floatAmp *
          liveliness;
      mesh.rotation.z =
        Math.sin(time * item.floatSpeed * 0.7 + item.phase) *
        item.swayAmp *
        liveliness;
      // Hero depth-layering collapses as the puck forms, so no letter sinks behind it.
      mesh.position.z = item.letter.position[2] * (1 - arcs);
    }

    // The label: shrink from the big landing size onto the puck face and lift so the letters
    // rest on top of the cap (clearing the arcs). The lift eases back to 0 as the puck fades,
    // so the settled logo sits on the z = 0 plane and isn't nudged up by perspective.
    const face = faceRef.current;
    if (face !== null) {
      face.scale.setScalar(THREE.MathUtils.lerp(heroScale, faceScale, arcs));
      const onPuckZ = PUCK_THICKNESS / 2 + letterHalfDepth * faceScale + 0.05;
      face.position.z = onPuckZ * arcs * (1 - flatten);
    }

    const assembly = assemblyRef.current;
    if (assembly === null) return;

    // Rise + shrink into the nav slot, converting the pill's pixel metrics to world units.
    const pixelToWorld = viewport.height / size.height;
    const navLogoWorldHeight = NAV_LOGO_HEIGHT_PX * pixelToWorld;
    const navScale = navLogoWorldHeight / (wordmark.height * faceScale);
    const navY = viewport.height / 2 - NAV_LOGO_CENTER_Y_PX * pixelToWorld;
    assembly.scale.setScalar(THREE.MathUtils.lerp(1, navScale, rise));
    assembly.position.y = THREE.MathUtils.lerp(0, navY, rise);

    // Tilt up during the reveal (top leans away to expose the south side wall below the
    // letters), hold it while it rises, then flatten over the same window as the fade.
    // (Flip TILT_MAX's sign to reveal the opposite edge.) Parallax is layered on while alive.
    const tilt = -TILT_MAX * reveal * (1 - flatten);
    const targetPitch = tilt - pointer.current.y * 0.2 * liveliness;
    const targetYaw = pointer.current.x * 0.34 * liveliness;
    assembly.rotation.x = THREE.MathUtils.damp(
      assembly.rotation.x,
      targetPitch,
      3.2,
      delta,
    );
    assembly.rotation.y = THREE.MathUtils.damp(
      assembly.rotation.y,
      targetYaw,
      3.2,
      delta,
    );
  });

  return (
    <group ref={assemblyRef} dispose={null}>
      <PuckBody />
      <group ref={faceRef}>
        {items.map(({ letter, material }) => (
          <mesh
            key={letter.id}
            ref={(el) => {
              if (el === null) meshes.current.delete(letter.id);
              else meshes.current.set(letter.id, el);
            }}
            geometry={letter.geometry}
            material={material}
            position={letter.position}
            frustumCulled={false}
          />
        ))}
      </group>
    </group>
  );
}
