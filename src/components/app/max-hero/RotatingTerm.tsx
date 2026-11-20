import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { usePrefersReducedMotion } from "@/components/lib/usePrefersReducedMotion";
import { cn } from "@/components/lib/utils";

/** How long each term holds before the box tips to the next. */
const HOLD_MS = 2000;
const FLIP_MS = 600;
const EASE_IN_OUT = "cubic-bezier(0.65, 0, 0.35, 1)";
/** The box's height (and so its depth), in ems of the text. */
const BOX_EM = 1.2;
const HALF_BOX = `${String(BOX_EM / 2)}em`;

export interface RotatingTermProps {
  terms: readonly [string, ...string[]];
  /** Holds still (on whatever it shows) while false, e.g. once it's faded out. */
  isRunning: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Words on a flat-sided box, right-aligned within the width of the longest: the current term on its
 * front face, the next on its top. Every couple
 * of seconds the box tips forward, the top coming down to the front and the old term rolling away
 * underneath; then it quietly resets with the faces moved on a word, so it loops for ever. Holds on
 * the first term with reduced motion.
 */
export function RotatingTerm({
  terms,
  isRunning,
  className,
  style,
}: RotatingTermProps) {
  const [index, setIndex] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const flip = useRef<Animation | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const current = terms[index % terms.length] ?? terms[0];
  const next = terms[(index + 1) % terms.length] ?? terms[0];

  // Once the faces have moved on a word, stand the box back up — before paint, so no frame shows
  // the tipped box with the new words on it.
  useLayoutEffect(() => {
    flip.current?.cancel();
    flip.current = null;
  }, [index]);

  useEffect(() => {
    if (!isRunning || prefersReducedMotion || terms.length < 2) return;
    const timer = window.setInterval(() => {
      const box = boxRef.current;
      if (box === null) return;
      const animation = box.animate(
        [{ transform: "rotateX(0deg)" }, { transform: "rotateX(-90deg)" }],
        { duration: FLIP_MS, easing: EASE_IN_OUT, fill: "forwards" },
      );
      animation.onfinish = () => {
        setIndex((value) => (value + 1) % terms.length);
      };
      flip.current = animation;
    }, HOLD_MS + FLIP_MS);
    return () => {
      window.clearInterval(timer);
      flip.current?.cancel();
      flip.current = null;
    };
  }, [isRunning, prefersReducedMotion, terms.length]);

  return (
    <div className={cn("perspective-distant", className)} style={style}>
      {/* Set back by half its depth, so the front face sits at the text's true size. */}
      <div
        className="transform-3d"
        style={{ transform: `translateZ(-${HALF_BOX})` }}
      >
        <div
          ref={boxRef}
          className="relative grid transform-3d"
          style={{ height: `${String(BOX_EM)}em` }}
        >
          {/* Every term, stacked unseen in one cell: the box is as wide as the longest, so what
              follows it never shifts as the words change. */}
          {terms.map((term) => (
            <span
              key={term}
              aria-hidden="true"
              className="invisible col-start-1 row-start-1 whitespace-nowrap"
            >
              {term}
            </span>
          ))}
          <span
            className="absolute inset-0 flex items-center justify-end whitespace-nowrap backface-hidden"
            style={{ transform: `translateZ(${HALF_BOX})` }}
          >
            {current}
          </span>
          <span
            className="absolute inset-0 flex items-center justify-end whitespace-nowrap backface-hidden"
            style={{ transform: `rotateX(90deg) translateZ(${HALF_BOX})` }}
          >
            {next}
          </span>
        </div>
      </div>
    </div>
  );
}
