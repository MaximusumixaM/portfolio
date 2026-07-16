import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { createFlexMaterial, type FlexMaterial } from "./flexMaterial";
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

export function MaxWordmark() {
  const groupRef = useRef<THREE.Group>(null);
  const meshes = useRef(new Map<string, THREE.Mesh>());
  const viewport = useThree((state) => state.viewport);

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
    return Math.min(byWidth, byHeight, 1);
  }, [viewport.width, viewport.height, wordmark.width, wordmark.height]);

  useFrame((state, delta) => {
    const reduced = reducedMotionRef.current;
    // Freeze the living material to a calm still frame when reduced motion is requested.
    const time = reduced ? 0.4 : state.clock.elapsedTime;

    for (const item of items) {
      item.material.userData.flexUniforms.uTime.value = time;
      const mesh = meshes.current.get(item.letter.id);
      if (mesh === undefined) continue;
      mesh.position.y = reduced
        ? item.letter.position[1]
        : item.letter.position[1] +
          Math.sin(time * item.floatSpeed + item.phase) * item.floatAmp;
      mesh.rotation.z = reduced
        ? 0
        : Math.sin(time * item.floatSpeed * 0.7 + item.phase) * item.swayAmp;
    }

    const group = groupRef.current;
    if (group === null) return;
    group.scale.setScalar(fitScale);
    // Parallax "head turn" toward the pointer, eased. Held flat under reduced motion.
    const targetY = reduced ? 0 : state.pointer.x * 0.34;
    const targetX = reduced ? 0 : -state.pointer.y * 0.2;
    group.rotation.y = THREE.MathUtils.damp(group.rotation.y, targetY, 3.2, delta);
    group.rotation.x = THREE.MathUtils.damp(group.rotation.x, targetX, 3.2, delta);
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
