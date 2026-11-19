import { useSyncExternalStore } from "react";

// Which project is open over the portfolio (null for none). The project view plays its own grow and
// shrink; this is only where it's heading.

let openProjectId: string | null = null;
const listeners = new Set<() => void>();

function setOpenProject(projectId: string | null): void {
  if (openProjectId === projectId) return;
  openProjectId = projectId;
  for (const listener of listeners) listener();
}

export function openProject(projectId: string): void {
  setOpenProject(projectId);
}

export function closeProject(): void {
  setOpenProject(null);
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useOpenProject(): string | null {
  return useSyncExternalStore(
    subscribe,
    () => openProjectId,
    () => null,
  );
}
