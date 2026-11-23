import { useEffect, useRef, type RefObject } from "react";

export interface PointerState {
  /** Normalised to [-1, 1], x right and y up. */
  x: number;
  y: number;
  /** A mouse (or pen) is over the page; false for touch, before any movement, and once it leaves. */
  isHovering: boolean;
}

// Window pointer (the canvas is pointer-events-none), as a ref so per-frame reads don't re-render.
export function usePointerRef(): RefObject<PointerState> {
  const pointer = useRef<PointerState>({ x: 0, y: 0, isHovering: false });

  useEffect(() => {
    function handleMove(event: PointerEvent) {
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -((event.clientY / window.innerHeight) * 2 - 1);
      // A finger dragging isn't hovering, so touch never leaves the letters distorted.
      pointer.current.isHovering = event.pointerType !== "touch";
    }
    function handleLeave(event: MouseEvent) {
      if (event.relatedTarget === null) pointer.current.isHovering = false;
    }
    window.addEventListener("pointermove", handleMove, { passive: true });
    document.addEventListener("mouseout", handleLeave);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      document.removeEventListener("mouseout", handleLeave);
    };
  }, []);

  return pointer;
}
