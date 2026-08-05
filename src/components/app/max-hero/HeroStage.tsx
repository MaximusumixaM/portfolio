import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { createFlexMaterial, type FlexMaterial } from "./flexMaterial";
import {
  NAV_LOGO_CENTER_Y_PX,
  NAV_LOGO_HEIGHT_PX,
  PHASES,
  easeSettle,
  getHeroProgress,
  phase,
} from "./heroTransition";
import { buildWordmark, type LetterGeometry } from "./letterGeometries";
import {
  CAMERA_DISTANCE,
  FORMATION_RING_RADIUS,
  FORMATION_SPHERE_RADIUS,
} from "./sceneMetrics";
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
/** Fraction of the formation circle's diameter the MAX label spans once it has shrunk into it. */
const FACE_FILL = 0.82;
/** Peak tilt (radians) mid-rise, showing the letters' thickness on the way to the nav. */
const TILT_MAX = 0.55;
/** Clearance between the globe's surface and the letters floating in front of it. */
const FRONT_CLEARANCE = 0.05;
// The living material rigidifies as the globe takes over the circle.
const FLATTEN_RANGE: readonly [number, number] = [
  PHASES.arcs[0],
  PHASES.shift[0],
];

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

  /** Size the label shrinks to so it sits inside the circle the arcs draw. */
  const faceScale = useMemo(
    () => (2 * FORMATION_RING_RADIUS * FACE_FILL) / wordmark.width,
    [wordmark.width],
  );

  /** Half the letters' extruded depth (in wordmark units), so the back face clears the sphere. */
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
    const arcs = phase(progress, PHASES.arcs);
    const rise = easeSettle(phase(progress, PHASES.rise));
    const settle = easeSettle(phase(progress, FLATTEN_RANGE));
    const time = reduced ? 0.4 : state.clock.elapsedTime;
    // Idle life fades out as the circle closes, not as the whole settle completes.
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
      // Hero depth-layering collapses as the circle closes, so no letter sinks behind the globe.
      mesh.position.z = item.letter.position[2] * (1 - arcs);
    }

    // Shrink the label into the circle.
    const face = faceRef.current;
    if (face !== null) {
      face.scale.setScalar(THREE.MathUtils.lerp(heroScale, faceScale, arcs));
    }

    const assembly = assemblyRef.current;
    if (assembly === null) return;

    // Float the whole assembly clear of the globe in world units — a lift inside it would shrink
    // with the rise and let the sphere swallow the letters on their way up.
    const liftZ =
      (FORMATION_SPHERE_RADIUS +
        letterHalfDepth * faceScale +
        FRONT_CLEARANCE) *
      arcs;
    // Being nearer the camera magnifies the wordmark; cancelling that exactly keeps the lift
    // purely a depth-ordering trick, so the nav landing stays framed on the pill's own slot.
    const perspective = (CAMERA_DISTANCE - liftZ) / CAMERA_DISTANCE;

    // Rise + shrink into the nav slot, converting the pill's pixel metrics to world units.
    const pixelToWorld = viewport.height / size.height;
    const navLogoWorldHeight = NAV_LOGO_HEIGHT_PX * pixelToWorld;
    const navScale = navLogoWorldHeight / (wordmark.height * faceScale);
    const navY = viewport.height / 2 - NAV_LOGO_CENTER_Y_PX * pixelToWorld;
    assembly.scale.setScalar(
      THREE.MathUtils.lerp(1, navScale, rise) * perspective,
    );
    assembly.position.set(
      0,
      THREE.MathUtils.lerp(0, navY, rise) * perspective,
      liftZ,
    );

    // Lean back on the way up (top leans away, showing the underside), flat again once parked. Flip TILT_MAX's sign for the opposite edge.
    const tilt = -TILT_MAX * Math.sin(Math.PI * rise);
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
