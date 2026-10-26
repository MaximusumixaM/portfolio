import { Billboard } from "@react-three/drei";
import type * as THREE from "three";

import { teardropFillGeometry, teardropOutlineGeometry } from "./pinShape";

/** Lifts the tip clear of the outlines sitting just above the sphere. */
export const PIN_ALTITUDE = 0.012;
/** Pin height in globe units (the globe's radius is 100). */
export const PIN_HEIGHT = 4.5;

export interface JourneyPinProps {
  /** GlobeStage places and grows the pin each frame through this. */
  ref: React.Ref<THREE.Group>;
  color: THREE.Color;
}

// The marker the active chapter's city gets, facing the camera whichever way the globe has turned.
export function JourneyPin({ ref, color }: JourneyPinProps) {
  return (
    <group ref={ref} visible={false}>
      <Billboard>
        <lineLoop geometry={teardropOutlineGeometry} renderOrder={10}>
          <lineBasicMaterial color={color} transparent depthTest={false} />
        </lineLoop>
        <mesh geometry={teardropFillGeometry} renderOrder={11}>
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.85}
            depthTest={false}
          />
        </mesh>
      </Billboard>
    </group>
  );
}
