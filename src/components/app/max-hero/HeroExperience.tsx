import { Suspense, lazy, useState } from "react";

import { HeroHud } from "./HeroHud";
import { HeroScrollController } from "./HeroScrollController";
import { HERO_TRACK_ID, PHASES, useHeroPast } from "./heroTransition";
import { NavPill } from "./NavPill";

import { AboutDialog, type AboutContent } from "@/components/app/AboutDialog";
import { ProjectPanel } from "@/components/app/portfolio-globe/ProjectPanel";
import { useLeaderLine } from "@/components/app/portfolio-globe/useLeaderLine";
import { ProjectModal } from "@/components/app/ProjectModal";
import { cn } from "@/components/lib/utils";
import { Button } from "@/components/peduncle/Button";
import type { ResolvedProject } from "@/types/project";

// three and three-globe both reach for `window` as they load, so the canvas waits for the client
// while the panel ships as server-rendered HTML.
const LazyMaxScene = lazy(async () => {
  const { MaxScene } = await import("./MaxScene");
  return { default: MaxScene };
});

export interface HeroExperienceProps {
  projects: ResolvedProject[];
  /** Opened from the nav's About action, so it lives in this island rather than its own. */
  about: AboutContent;
}

// One pinned screen for the whole site: the wordmark assembles, the circle it leaves behind
// becomes the globe, and the portfolio arrives around it without the page ever moving on.
export function HeroExperience({ projects, about }: HeroExperienceProps) {
  const [activeSlug, setActiveSlug] = useState(projects[0]?.slug);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  // Doubles as the client-mount gate for the canvas: there's no element until the browser has it.
  const [stage, setStage] = useState<HTMLElement | null>(null);
  const isRevealed = useHeroPast(PHASES.reveal[0]);
  const { overlayRef, labelRef, lineRef, cityDotRef, drawFrom } =
    useLeaderLine();

  const activeProject = projects.find((project) => project.slug === activeSlug);

  return (
    <>
      <HeroScrollController />
      {stage !== null && (
        <Suspense fallback={null}>
          <LazyMaxScene
            projects={projects}
            activeSlug={activeSlug}
            isRevealed={isRevealed}
            onSelect={setActiveSlug}
            onAnchorMove={drawFrom}
            eventSource={stage}
          />
        </Suspense>
      )}

      {/* 100vh of pinned screen plus 140vh of scroll to play the sequence through. */}
      <div id={HERO_TRACK_ID} className="relative h-[240vh] w-full">
        {/* Sits under the canvas (which is click-through, so this still sees the presses r3f
            picks pins from) — that keeps the 3D wordmark landing on top of the nav pill. */}
        <main
          ref={setStage}
          className="sticky top-0 h-screen w-full overflow-hidden bg-background-default"
        >
          <HeroHud />

          <div
            className={cn(
              // Stacked, the panel takes the bottom half, clear of the HUD's own bottom corners.
              "pointer-events-none absolute inset-0 z-30 flex items-end justify-center px-m pb-xl transition-opacity duration-500 md:items-center md:justify-end md:px-l md:pb-0",
              isRevealed ? "opacity-100" : "opacity-0",
            )}
            inert={!isRevealed}
          >
            {/* A true half of the screen once there's room for it; `max-w-prose` only holds the
                line length in on stacked layouts, where the block spans the full width. */}
            <div className="pointer-events-auto w-full max-w-prose md:w-1/2 md:max-w-none">
              {activeProject !== undefined && (
                <ProjectPanel
                  key={activeProject.slug}
                  project={activeProject}
                  projects={projects}
                  labelRef={labelRef}
                  onSelectProject={setActiveSlug}
                  onOpenDetails={() => {
                    setIsDetailsOpen(true);
                  }}
                />
              )}
              <ProjectLocationNav
                projects={projects}
                activeSlug={activeSlug}
                onSelect={setActiveSlug}
              />
            </div>
          </div>
        </main>
      </div>

      {/* The one layer that has to clear the canvas, or the globe buries the rule running back
          to its own pin. Stacked layouts put the label under the globe, where it says nothing. */}
      <div
        ref={overlayRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-30 hidden md:block"
      >
        <svg className="h-full w-full">
          <polyline
            ref={lineRef}
            fill="none"
            strokeWidth="1"
            className="stroke-foreground-default transition-opacity duration-200"
            style={{ opacity: 0 }}
          />
          <circle
            ref={cityDotRef}
            r="2"
            className="fill-foreground-default transition-opacity duration-200"
            style={{ opacity: 0 }}
          />
        </svg>
      </div>

      <NavPill
        onOpenAbout={() => {
          setIsAboutOpen(true);
        }}
      />

      <AboutDialog
        isOpen={isAboutOpen}
        onOpenChange={setIsAboutOpen}
        {...about}
      />

      <ProjectModal
        project={isDetailsOpen ? activeProject : undefined}
        onOpenChange={(isOpen) => {
          if (!isOpen) setIsDetailsOpen(false);
        }}
      />
    </>
  );
}

interface ProjectLocationNavProps {
  projects: ResolvedProject[];
  activeSlug: string | undefined;
  onSelect: (slug: string) => void;
}

/** The pins live in a canvas, so this is how the keyboard reaches them. Appears once focused. */
function ProjectLocationNav({
  projects,
  activeSlug,
  onSelect,
}: ProjectLocationNavProps) {
  return (
    <nav
      aria-label="Project locations"
      className="sr-only focus-within:not-sr-only focus-within:mt-m focus-within:flex focus-within:flex-wrap focus-within:gap-xs"
    >
      {projects.map((project) => (
        <Button
          key={project.slug}
          size="sm"
          aria-current={project.slug === activeSlug ? "true" : undefined}
          onClick={() => {
            onSelect(project.slug);
          }}
        >
          {project.title} — {project.location.label}
        </Button>
      ))}
    </nav>
  );
}
