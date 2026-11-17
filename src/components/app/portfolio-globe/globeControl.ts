// The corner link's hover and drag, handed to the canvas: the link writes, GlobeStage reads each frame.

let isHovered = false;
let isDragging = false;
let pendingDragX = 0;
let pendingDragY = 0;

export function setGlobeHovered(hovered: boolean): void {
  isHovered = hovered;
}

export function setGlobeDragging(dragging: boolean): void {
  isDragging = dragging;
}

export function isGlobeDragging(): boolean {
  return isDragging;
}

/** Hovered (or keyboard-focused) and not being dragged — when the globe grows and idles round. */
export function isGlobeIdlingUnderPointer(): boolean {
  return isHovered && !isDragging;
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
