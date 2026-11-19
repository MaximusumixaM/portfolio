import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { useOpenProject } from "./openProject";
import { projectTileId, type Project } from "./project";
import { ProjectPage } from "./ProjectPage";

import { revealElement } from "@/components/app/scroll/smoothScroll";
import { usePrefersReducedMotion } from "@/components/lib/usePrefersReducedMotion";

const GROW_MS = 650;
const SHRINK_MS = 500;
/** The content fades in over the end of the grow, and out before the shrink. */
const CONTENT_IN_MS = 300;
const CONTENT_OUT_MS = 150;
/** Reduced motion: a plain cross-fade instead of the grow. */
const FADE_MS = 200;
const EASE_IN_OUT = "cubic-bezier(0.65, 0, 0.35, 1)";
const FULL_CLIP = "inset(0px 0px 0px 0px round 0px)";

/** The clip that crops the full-screen view to exactly its tile's box, or null if the tile is gone. */
function findTileClip(projectId: string, layer: HTMLElement): string | null {
  const tile = document.getElementById(projectTileId(projectId));
  if (tile === null) return null;
  const box = tile.getBoundingClientRect();
  const frame = layer.getBoundingClientRect();
  const radius = getComputedStyle(tile).borderTopLeftRadius;
  return `inset(${box.top - frame.top}px ${frame.right - box.right}px ${frame.bottom - box.bottom}px ${box.left - frame.left}px round ${radius})`;
}

export interface ProjectViewProps {
  projects: readonly Project[];
  /** Server-render this project already open, for a page loaded at its URL. */
  initialProjectId: string | undefined;
}

// A project, full screen over the grid: it grows out of its tile and shrinks back into it.
export function ProjectView({ projects, initialProjectId }: ProjectViewProps) {
  const openProjectId = useOpenProject();
  /** Lags `openProjectId` on the way out, so the view stays mounted while it shrinks away. */
  const [shownProjectId, setShownProjectId] = useState(initialProjectId);
  const layerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const closingProjectId = useRef<string | null>(null);
  const hasMounted = useRef(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  // Read as each animation starts, so the setting arriving after mount never replays one.
  const reducedMotion = useRef(prefersReducedMotion);

  useEffect(() => {
    reducedMotion.current = prefersReducedMotion;
  }, [prefersReducedMotion]);

  // Opening shows it (the grow plays below); closing shrinks it into its tile, then lets it go.
  useEffect(() => {
    if (openProjectId !== null) {
      closingProjectId.current = openProjectId;
      setShownProjectId(openProjectId);
      return;
    }
    const projectId = closingProjectId.current;
    const layer = layerRef.current;
    const content = contentRef.current;
    if (projectId === null || layer === null || content === null) return;
    // After stepping through projects on a phone, its tile can be off-screen down the stack.
    const tile = document.getElementById(projectTileId(projectId));
    if (tile !== null) revealElement(tile);
    const tileClip = findTileClip(projectId, layer);
    const animations =
      reducedMotion.current || tileClip === null
        ? [
            layer.animate(
              { opacity: [1, 0] },
              { duration: FADE_MS, fill: "forwards" },
            ),
          ]
        : [
            content.animate(
              { opacity: [1, 0] },
              { duration: CONTENT_OUT_MS, fill: "forwards" },
            ),
            layer.animate(
              { clipPath: [FULL_CLIP, tileClip] },
              { duration: SHRINK_MS, easing: EASE_IN_OUT, fill: "forwards" },
            ),
          ];
    const last = animations.at(-1);
    if (last !== undefined) {
      last.onfinish = () => {
        closingProjectId.current = null;
        setShownProjectId(undefined);
        document
          .getElementById(projectTileId(projectId))
          ?.focus({ preventScroll: true });
      };
    }
    // Reopened mid-shrink: drop the shrink, and it's simply open again.
    return () => {
      for (const animation of animations) animation.cancel();
    };
  }, [openProjectId]);

  // The grow, each time a project appears from the grid (not for one already open when the page
  // loads); stepping to another project just fades its page in.
  const previousShownId = useRef(initialProjectId);
  useLayoutEffect(() => {
    const wasShowing = previousShownId.current;
    previousShownId.current = shownProjectId;
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }
    const layer = layerRef.current;
    const content = contentRef.current;
    if (shownProjectId === undefined || layer === null || content === null) {
      return;
    }
    headingRef.current?.focus({ preventScroll: true });
    if (wasShowing !== undefined) {
      const fade = content.animate({ opacity: [0, 1] }, { duration: FADE_MS });
      return () => {
        fade.cancel();
      };
    }
    const tileClip = findTileClip(shownProjectId, layer);
    const animations =
      reducedMotion.current || tileClip === null
        ? [layer.animate({ opacity: [0, 1] }, { duration: FADE_MS })]
        : [
            layer.animate(
              { clipPath: [tileClip, FULL_CLIP] },
              { duration: GROW_MS, easing: EASE_IN_OUT },
            ),
            content.animate(
              { opacity: [0, 1] },
              {
                duration: CONTENT_IN_MS,
                delay: GROW_MS - CONTENT_IN_MS,
                fill: "backwards",
              },
            ),
          ];
    return () => {
      for (const animation of animations) animation.cancel();
    };
  }, [shownProjectId]);

  const index = projects.findIndex(({ id }) => id === shownProjectId);
  const project = projects[index];
  if (project === undefined) return null;
  // No wrapping round: the first has no previous, the last no next.
  const previous = index > 0 ? projects[index - 1] : undefined;
  const next = projects[index + 1];

  return (
    <div
      ref={layerRef}
      // Shrinking away, it no longer takes clicks or keys.
      inert={openProjectId === null}
      className="fixed inset-0 z-40 bg-background-default"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-15"
        style={{ backgroundColor: project.color }}
      />
      <ProjectPage
        // A fresh page per project, so stepping to the next starts at its top.
        key={project.id}
        project={project}
        previous={previous}
        next={next}
        scrollerRef={contentRef}
        headingRef={headingRef}
      />
    </div>
  );
}
