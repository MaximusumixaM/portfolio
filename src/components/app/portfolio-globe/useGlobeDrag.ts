import { useEffect, useRef } from "react";

import { dragGlobe, setGlobeDragging } from "./globeControl";

/** Pointer travel (px) past which a press is a drag rather than a click. */
const DRAG_SLOP_PX = 5;

interface Press {
  pointerId: number;
  lastX: number;
  lastY: number;
  travelled: number;
}

export interface GlobeDrag {
  onPointerDown: (event: React.PointerEvent<HTMLElement>) => void;
  onPointerMove: (event: React.PointerEvent<HTMLElement>) => void;
  onPointerUp: (event: React.PointerEvent<HTMLElement>) => void;
  onPointerCancel: () => void;
  /** Browsers drag links and images as files by default, which swallows the moves. */
  onDragStart: (event: React.DragEvent<HTMLElement>) => void;
  /** True if the last press turned into a drag — and resets, so check it once, in the click. */
  takeWasDragged: () => boolean;
}

/**
 * Turns the globe from a DOM element laid over it (the canvas itself is click-through). Release
 * `isEnabled` when the element goes away, so an interrupted drag doesn't leave the globe held.
 */
export function useGlobeDrag(isEnabled: boolean): GlobeDrag {
  const press = useRef<Press | null>(null);
  const wasDragged = useRef(false);

  useEffect(() => {
    if (isEnabled) return;
    press.current = null;
    setGlobeDragging(false);
  }, [isEnabled]);

  return {
    onPointerDown: (event) => {
      if (event.button !== 0) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      press.current = {
        pointerId: event.pointerId,
        lastX: event.clientX,
        lastY: event.clientY,
        travelled: 0,
      };
      wasDragged.current = false;
    },
    onPointerMove: (event) => {
      const current = press.current;
      if (current?.pointerId !== event.pointerId) return;
      const deltaX = event.clientX - current.lastX;
      const deltaY = event.clientY - current.lastY;
      current.lastX = event.clientX;
      current.lastY = event.clientY;
      current.travelled += Math.abs(deltaX) + Math.abs(deltaY);
      if (!wasDragged.current && current.travelled <= DRAG_SLOP_PX) return;
      wasDragged.current = true;
      setGlobeDragging(true);
      dragGlobe(deltaX, deltaY);
    },
    onPointerUp: (event) => {
      if (press.current?.pointerId !== event.pointerId) return;
      press.current = null;
      setGlobeDragging(false);
    },
    onPointerCancel: () => {
      press.current = null;
      setGlobeDragging(false);
    },
    onDragStart: (event) => {
      event.preventDefault();
    },
    takeWasDragged: () => {
      const dragged = wasDragged.current;
      wasDragged.current = false;
      return dragged;
    },
  };
}
