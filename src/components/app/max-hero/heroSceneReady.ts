import { useSyncExternalStore } from "react";

// Whether the hero's 3D has drawn its first frame, so what stood in for it (the traced outline) can
// go. Set once by the canvas; DOM subscribes.

let isReady = false;
const listeners = new Set<() => void>();

export function markHeroSceneReady(): void {
  if (isReady) return;
  isReady = true;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useIsHeroSceneReady(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => isReady,
    () => false,
  );
}
