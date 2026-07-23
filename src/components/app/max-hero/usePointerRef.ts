import { useEffect, useRef, type RefObject } from "react";

/**
 * Pointer normalised to [-1, 1], tracked on window rather than via r3f's own pointer:
 * the canvas is fixed over the whole page and stays `pointer-events-none` so it doesn't
 * swallow clicks, which means it receives no pointer events of its own.
 *
 * Returned as a ref so per-frame consumers read it without triggering React renders.
 */
export function usePointerRef(): RefObject<{ x: number; y: number }> {
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
