import { useEffect } from "react";

import {
  closeAbout,
  openAbout,
  showAboutImmediately,
  useIsAboutOpen,
} from "./aboutView";

import {
  jumpToSectionEnd,
  setScrollLocked,
} from "@/components/app/scroll/smoothScroll";

const ABOUT_PATH = "/about";

export type SiteView = "portfolio" | "about";

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

function isAboutPath(): boolean {
  return window.location.pathname.replace(/\/$/, "") === ABOUT_PATH;
}

/** Opens About and gives it its own URL (and a history entry, so browser back closes it). */
export function enterAbout(): void {
  if (!isAboutPath()) {
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
 * Keeps About and the URL in step: lands on About for a page loaded at /about, follows the
 * browser's back/forward, holds the page still while About is open, and closes it on Escape.
 */
export function useAboutRoute(initialView: SiteView): void {
  const isOpen = useIsAboutOpen();

  useEffect(() => {
    if (initialView === "about") {
      // Behind About, the portfolio waits at its start, the hero played out.
      jumpToSectionEnd("hero");
      showAboutImmediately();
    }
    function handlePopState() {
      if (isAboutPath()) openAbout();
      else closeAbout();
    }
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [initialView]);

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
