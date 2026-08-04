import { Environment, Lightformer } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useState } from "react";

import { HeroStage } from "./HeroStage";

import { cn } from "@/components/lib/utils";

// The WebGL half of the hero, mounted client:only. Fixed positioning lives on the wrapper (not <Canvas>, which r3f styles inline) so the wordmark persists as the nav logo after scroll.
export function MaxScene() {
  const [isReady, setIsReady] = useState(false);

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 z-30 transition-opacity duration-700",
        isReady ? "opacity-100" : "opacity-0",
      )}
    >
      <Canvas
        // r3f sets pointer-events:auto inline on its container; force none so this full-viewport canvas doesn't eat page clicks.
        style={{ pointerEvents: "none" }}
        camera={{ position: [0, 0, 9], fov: 40 }}
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
