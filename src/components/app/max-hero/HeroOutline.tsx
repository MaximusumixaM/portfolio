import { useIsHeroSceneReady } from "./heroSceneReady";
import { HERO_WORDMARK_HEIGHT_CSS, WORDMARK_ASPECT } from "./sceneMetrics";

import maxWordmarkSvg from "@/assets/max-wordmark.svg?raw";
import { cn } from "@/components/lib/utils";

/** The letters' outlines, from the same SVG the 3D letters are built from (file order: X, A, M). */
const LETTER_PATHS = Array.from(
  maxWordmarkSvg.matchAll(/ d="([^"]+)"/g),
  (match) => match[1],
).filter((path) => path !== undefined);
const VIEW_BOX = /viewBox="([^"]+)"/.exec(maxWordmarkSvg)?.[1];

/** Each letter starts tracing a beat after the one before. */
const LETTER_STAGGER_MS = 120;

// The wordmark traced in a thin line, exactly where the 3D one will appear, so the hero has its
// centre from the very first paint: server-rendered, drawing itself with CSS before any script
// runs. Fades as the 3D draws its first frame; with reduced motion it simply shows, already drawn.
export function HeroOutline() {
  const isSceneReady = useIsHeroSceneReady();

  return (
    <svg
      aria-hidden="true"
      viewBox={VIEW_BOX}
      className={cn(
        "pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 overflow-visible transition-opacity duration-500",
        isSceneReady ? "opacity-0" : "opacity-100",
      )}
      style={{
        height: HERO_WORDMARK_HEIGHT_CSS,
        width: `calc(${HERO_WORDMARK_HEIGHT_CSS} * ${String(WORDMARK_ASPECT)})`,
      }}
    >
      {/* Drawn M first, as it reads. */}
      {LETTER_PATHS.toReversed().map((path, index) => (
        <path
          key={path}
          d={path}
          fill="none"
          pathLength={1}
          strokeDasharray="1"
          strokeWidth={1.5}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          className="animate-trace stroke-foreground-brand motion-reduce:animate-none"
          style={{ animationDelay: `${String(index * LETTER_STAGGER_MS)}ms` }}
        />
      ))}
    </svg>
  );
}
