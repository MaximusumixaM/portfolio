import { Environment, Lightformer } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";

import { HeroHud } from "./HeroHud";
import { MaxWordmark } from "./MaxWordmark";

/**
 * Fullscreen 3D hero: the MAX wordmark as a living, flexing faceted material.
 * Rendered as a `client:only` island (touches WebGL/window, so it must skip SSR).
 * The existing portfolio flows directly beneath it — native scroll (or the HUD's
 * "Enter" cue) carries you down into the site.
 */
export function MaxHero() {
  return (
    <section className="relative h-screen w-full overflow-hidden bg-background-default">
      <Canvas
        className="absolute inset-0"
        camera={{ position: [0, 0, 9], fov: 40 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.35} />
        <directionalLight position={[4, 5, 6]} intensity={1.4} />
        <directionalLight position={[-6, -2, 2]} intensity={0.4} color="#6a8cff" />

        <MaxWordmark />

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

      <HeroHud />
    </section>
  );
}
