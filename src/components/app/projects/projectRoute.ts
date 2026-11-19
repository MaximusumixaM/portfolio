import { useEffect } from "react";

import { closeProject, openProject, useOpenProject } from "./openProject";

import {
  jumpToSectionEnd,
  setScrollLocked,
} from "@/components/app/scroll/smoothScroll";
import type { SiteView } from "@/components/app/siteView";

const PROJECT_PATH = /^\/work\/([^/]+)\/?$/;

/** What we stamp on the history entry we push for a project, so leaving can step back over it. */
interface ProjectEntry {
  view: "project";
  projectId: string;
}

function isProjectEntry(state: unknown): state is ProjectEntry {
  return (
    typeof state === "object" &&
    state !== null &&
    "view" in state &&
    state.view === "project"
  );
}

/** The project the current URL is for, if it's a /work/<id> URL. */
function findPathProjectId(): string | undefined {
  return PROJECT_PATH.exec(window.location.pathname)?.[1];
}

export function projectPath(projectId: string): string {
  return `/work/${projectId}`;
}

/** A plain left click, which the page handles itself; modified clicks (new tab etc.) stay the browser's. */
export function isPlainClick(event: React.MouseEvent): boolean {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

/** Opens a project and gives it its own URL (and a history entry, so browser back closes it). */
export function enterProject(projectId: string): void {
  if (findPathProjectId() !== projectId) {
    window.history.pushState(
      { view: "project", projectId } satisfies ProjectEntry,
      "",
      projectPath(projectId),
    );
  }
  openProject(projectId);
}

/**
 * Moves to another project in place (previous/next). Replaces the history entry rather than adding
 * one, so ✕ and browser back still lead to the grid, not back through every project visited.
 */
export function switchProject(projectId: string): void {
  const state: unknown = window.history.state;
  window.history.replaceState(
    isProjectEntry(state)
      ? ({ view: "project", projectId } satisfies ProjectEntry)
      : state,
    "",
    projectPath(projectId),
  );
  openProject(projectId);
}

/** Back to the grid: steps back over our own history entry, or rewrites a landed-on /work URL. */
export function leaveProject(): void {
  const state: unknown = window.history.state;
  if (isProjectEntry(state)) {
    // popstate (below) does the closing, so the browser's back button and ours behave the same.
    window.history.back();
    return;
  }
  window.history.replaceState(null, "", "/");
  closeProject();
}

/**
 * Keeps the open project and the URL in step: lands on the project for a page loaded at its URL
 * (with the grid waiting behind it), follows back/forward, holds the page still while a project is
 * open, and closes it on Escape.
 */
export function useProjectRoute(initialView: SiteView): void {
  const isOpen = useOpenProject() !== null;
  const initialProjectId =
    initialView.kind === "project" ? initialView.projectId : undefined;

  useEffect(() => {
    if (initialProjectId !== undefined) {
      jumpToSectionEnd("projects");
      openProject(initialProjectId);
    }
    function handlePopState() {
      const projectId = findPathProjectId();
      if (projectId === undefined) closeProject();
      else openProject(projectId);
    }
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [initialProjectId]);

  useEffect(() => {
    setScrollLocked(isOpen);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") leaveProject();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);
}
