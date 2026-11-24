import { useEffect } from "react";

import {
  closeAbout,
  isAboutSection,
  openAbout,
  showAboutImmediately,
  showAboutSection,
  useAboutSection,
  useIsAboutOpen,
  type AboutSection,
} from "./aboutView";

import {
  jumpToSectionEnd,
  setScrollLocked,
} from "@/components/app/scroll/smoothScroll";
import type { SiteView } from "@/components/app/siteView";

const ABOUT_PATH = "/about";
/** `/about` (the story) or `/about/<section>`. */
const ABOUT_PATH_PATTERN = /^\/about(?:\/([^/]+))?\/?$/;

/** The story is About's own URL; each other section has `/about/<section>`. */
export function aboutPath(section: AboutSection): string {
  return section === "story" ? ABOUT_PATH : `${ABOUT_PATH}/${section}`;
}

/** What we stamp on the history entry we push for About, so leaving can step back over it. */
interface AboutEntry {
  view: "about";
}

function isAboutEntry(state: unknown): state is AboutEntry {
  return (
    typeof state === "object" &&
    state !== null &&
    "view" in state &&
    state.view === "about"
  );
}

/** The section the current URL is for, if it's an About URL (an unknown section reads as the story). */
function findPathSection(): AboutSection | undefined {
  const match = ABOUT_PATH_PATTERN.exec(window.location.pathname);
  if (match === null) return undefined;
  const section = match[1];
  return section !== undefined && isAboutSection(section) ? section : "story";
}

/** Opens About and gives it its own URL (and a history entry, so browser back closes it). */
export function enterAbout(): void {
  if (findPathSection() === undefined) {
    window.history.pushState(
      { view: "about" } satisfies AboutEntry,
      "",
      ABOUT_PATH,
    );
  }
  openAbout();
}

/** Back to the portfolio: steps back over our own history entry, or rewrites a landed-on /about. */
export function leaveAbout(): void {
  const state: unknown = window.history.state;
  if (isAboutEntry(state)) {
    // popstate (below) does the closing, so the browser's back button and ours behave the same.
    window.history.back();
    return;
  }
  window.history.replaceState(null, "", "/");
  closeAbout();
}

/**
 * Keeps About and the URL in step: lands on About (at its section) for a page loaded at an About
 * URL, gives each section its URL as the tabs change (replacing, so back still leaves About),
 * follows the browser's back/forward, holds the page still while About is open, and closes it on
 * Escape.
 */
export function useAboutRoute(initialView: SiteView): void {
  const isOpen = useIsAboutOpen();
  const section = useAboutSection();
  const initialSection =
    initialView.kind === "about" ? initialView.section : undefined;

  useEffect(() => {
    if (initialSection !== undefined) {
      // Behind About, the portfolio waits at its start, the hero played out.
      jumpToSectionEnd("hero");
      showAboutImmediately(initialSection);
    }
    function handlePopState() {
      const pathSection = findPathSection();
      if (pathSection === undefined) {
        closeAbout();
        return;
      }
      openAbout();
      showAboutSection(pathSection);
    }
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [initialSection]);

  useEffect(() => {
    if (!isOpen) return;
    const path = aboutPath(section);
    if (window.location.pathname.replace(/\/$/, "") === path) return;
    window.history.replaceState(window.history.state, "", path);
  }, [isOpen, section]);

  useEffect(() => {
    setScrollLocked(isOpen);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") leaveAbout();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);
}
