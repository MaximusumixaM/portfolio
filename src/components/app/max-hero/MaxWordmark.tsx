import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { createFlexMaterial, type FlexMaterial } from "./flexMaterial";
import {
  NAV_LOGO_CENTER_Y_PX,
  NAV_LOGO_HEIGHT_PX,
  easeSettle,
  getHeroProgress,
} from "./heroTransition";
import { buildWordmark, type LetterGeometry } from "./letterGeometries";
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
/**
 * Overall on-screen size of the wordmark — the single knob for bigger/smaller.
 * Applied on top of the responsive viewport fit, so it holds at every screen size.
 */
const WORDMARK_SCALE = 0.8;

/**
 * Pointer normalised to [-1, 1], tracked on window rather than via r3f's own pointer:
 * the canvas is fixed over the whole page and must stay `pointer-events-none` so it
 * doesn't swallow clicks, which means it receives no pointer events of its own.
 */
function usePointerRef() {
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    function handleMove(event: PointerEvent) {
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -((event.clientY / window.innerHeight) * 2 - 1);
    }
    window.addEventListener("pointermove", handleMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handleMove);
    };
  }, []);

  return pointer;
}

export function MaxWordmark() {
  const groupRef = useRef<THREE.Group>(null);
  const meshes = useRef(new Map<string, THREE.Mesh>());
  const viewport = useThree((state) => state.viewport);
  const size = useThree((state) => state.size);
  const pointer = usePointerRef();

  // Read inside useFrame via a ref so the frame loop always sees the current value.
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

  // Fit the wordmark inside the viewport with breathing room, capped at 1x.
  const fitScale = useMemo(() => {
    const byWidth = (viewport.width * 0.86) / wordmark.width;
    const byHeight = (viewport.height * 0.7) / wordmark.height;
    return Math.min(byWidth, byHeight, 1) * WORDMARK_SCALE;
  }, [viewport.width, viewport.height, wordmark.width, wordmark.height]);

  useFrame((state, delta) => {
    const reduced = reducedMotionRef.current;
    const settle = easeSettle(getHeroProgress());
    // Freeze the living material to a calm still frame when reduced motion is requested.
    const time = reduced ? 0.4 : state.clock.elapsedTime;
    // Idle motion fades out as the wordmark settles into a nav logo.
    const liveliness = reduced ? 0 : 1 - settle;

    for (const item of items) {
      const uniforms = item.material.userData.flexUniforms;
      uniforms.uTime.value = time;
      uniforms.uFlatten.value = settle;
      // Simplify the PBR response alongside it. Clearcoat stops short of 0 on purpose —
      // hitting 0 would toggle the USE_CLEARCOAT define and recompile the shader.
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
      // Depth layering collapses so the settled logo reads as flat 2D.
      mesh.position.z = item.letter.position[2] * (1 - settle);
    }

    const group = groupRef.current;
    if (group === null) return;

    // Scale and position interpolate between the hero framing and the nav pill's slot,
    // converting the pill's CSS pixel metrics into world units at the z=0 plane.
    const pixelToWorld = viewport.height / size.height;
    const navScale = (NAV_LOGO_HEIGHT_PX * pixelToWorld) / wordmark.height;
    const navY = viewport.height / 2 - NAV_LOGO_CENTER_Y_PX * pixelToWorld;
    group.scale.setScalar(THREE.MathUtils.lerp(fitScale, navScale, settle));
    group.position.y = THREE.MathUtils.lerp(0, navY, settle);

    // Parallax "head turn" toward the pointer, eased. Settles flat as it becomes the logo.
    const targetY = pointer.current.x * 0.34 * liveliness;
    const targetX = -pointer.current.y * 0.2 * liveliness;
    group.rotation.y = THREE.MathUtils.damp(
      group.rotation.y,
      targetY,
      3.2,
      delta,
    );
    group.rotation.x = THREE.MathUtils.damp(
      group.rotation.x,
      targetX,
      3.2,
      delta,
    );
  });

  return (
    <group ref={groupRef} dispose={null}>
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
  );
}
