import { Environment, Lightformer } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useState } from "react";

import { HeroStage } from "./HeroStage";
import { CAMERA_DISTANCE, CAMERA_FOV } from "./sceneMetrics";

import { GlobeStage } from "@/components/app/portfolio-globe/GlobeStage";
import { cn } from "@/components/lib/utils";

// The WebGL half of the page: the wordmark and the globe share one fixed, viewport-filling canvas
// so the circle the arcs draw can hand straight over to the globe growing inside it.
export function MaxScene() {
  const [isReady, setIsReady] = useState(false);

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 z-20 transition-opacity duration-700",
        isReady ? "opacity-100" : "opacity-0",
      )}
    >
      <Canvas
        // Click-through, so the page and nav keep their own hit targets.
        style={{ pointerEvents: "none" }}
        camera={{ position: [0, 0, CAMERA_DISTANCE], fov: CAMERA_FOV }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
        onCreated={() => {
          setIsReady(true);
        }}
      >
        <ambientLight intensity={0.35} />
        <directionalLight position={[4, 5, 6]} intensity={1.4} />
        <directionalLight
          position={[-6, -2, 2]}
          intensity={0.4}
          color="#6a8cff"
        />

        <HeroStage />
        <GlobeStage />

        {/* Procedural studio environment (no CDN fetch): soft key + rim + colored accents
          give the clearcoat real specular highlights and reflections. */}
        <Environment resolution={256}>
          <Lightformer
            intensity={2.2}
            position={[0, 3, 4]}
            scale={[8, 4, 1]}
            color="#ffffff"
          />
          <Lightformer
            intensity={1.1}
            position={[-4, 1, 2]}
            scale={[3, 6, 1]}
            color="#88a0ff"
          />
          <Lightformer
            intensity={1.0}
            position={[4, -1, 2]}
            scale={[3, 6, 1]}
            color="#ff9bd0"
          />
          <Lightformer
            intensity={0.7}
            position={[0, -4, 3]}
            scale={[8, 3, 1]}
            color="#ffffff"
          />
        </Environment>
      </Canvas>
    </div>
  );
}
