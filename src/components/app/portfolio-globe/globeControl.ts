import { useSyncExternalStore } from "react";

import { DOCK_HOVER_GROW_DELAY_MS } from "@/components/app/max-hero/heroTransition";

// The corner link's hover and drag, handed to the canvas: the link writes, GlobeStage reads each
// frame. And back the other way, whether the globe is resting in the corner as its icon.

let isHovered = false;
/** When the current hover began (`performance.now()`), for the wait before the globe grows. */
let hoveredSince = 0;
let isResting = false;
const restingListeners = new Set<() => void>();
let isDragging = false;
let pendingDragX = 0;
let pendingDragY = 0;

export function setGlobeHovered(hovered: boolean): void {
  if (hovered && !isHovered) hoveredSince = performance.now();
  isHovered = hovered;
}

export function setGlobeDragging(dragging: boolean): void {
  isDragging = dragging;
}

export function isGlobeDragging(): boolean {
  return isDragging;
}

/**
 * Hovered (or keyboard-focused), not dragged, for long enough that the icon turns into the globe,
 * which grows and idles round.
 */
export function isGlobeGrowing(): boolean {
  return (
    isHovered &&
    !isDragging &&
    performance.now() - hoveredSince >= DOCK_HOVER_GROW_DELAY_MS
  );
}

export function dragGlobe(deltaX: number, deltaY: number): void {
  pendingDragX += deltaX;
  pendingDragY += deltaY;
}

/** Takes (and clears) the drag, in CSS pixels, since the last frame. */
export function takeDrag(): { x: number; y: number } {
  const drag = { x: pendingDragX, y: pendingDragY };
  pendingDragX = 0;
  pendingDragY = 0;
  return drag;
}

/** GlobeStage reports when the docked globe has settled to icon size (and when it leaves it). */
export function setGlobeResting(resting: boolean): void {
  if (isResting === resting) return;
  isResting = resting;
  for (const listener of restingListeners) listener();
}

function subscribeResting(listener: () => void): () => void {
  restingListeners.add(listener);
  return () => {
    restingListeners.delete(listener);
  };
}

/** True while the globe rests in the corner as the Earth icon, which stands in for it. */
export function useIsGlobeResting(): boolean {
  return useSyncExternalStore(
    subscribeResting,
    () => isResting,
    () => false,
  );
}
