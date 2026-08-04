import { Suspense, lazy, useEffect, useState } from "react";

import { ProjectPanel } from "./ProjectPanel";
import { useLeaderLine } from "./useLeaderLine";

import { ProjectModal } from "@/components/app/ProjectModal";
import { Button } from "@/components/peduncle/Button";
import type { ResolvedProject } from "@/types/project";

// three-globe reaches for `window` as it loads, so it can only be pulled in on the client.
const LazyGlobeCanvas = lazy(async () => {
  const { GlobeCanvas } = await import("./GlobeCanvas");
  return { default: GlobeCanvas };
});

export interface PortfolioGlobeSectionProps {
  projects: ResolvedProject[];
}

export function PortfolioGlobeSection({
  projects,
}: PortfolioGlobeSectionProps) {
  const [activeSlug, setActiveSlug] = useState(projects[0]?.slug);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  // WebGL has no server render, so the canvas waits for the client while the panel ships as HTML.
  const [isCanvasMounted, setIsCanvasMounted] = useState(false);
  const { sectionRef, labelRef, lineRef, cityDotRef, drawFrom } =
    useLeaderLine();

  useEffect(() => {
    setIsCanvasMounted(true);
  }, []);

  const activeProject = projects.find((project) => project.slug === activeSlug);

  return (
    <>
      <section
        ref={sectionRef}
        className="relative grid min-h-screen grid-cols-1 items-center gap-l px-m py-l md:grid-cols-[1.1fr_1fr] md:px-l"
      >
        <div className="relative h-[55vh] md:h-[85vh]">
          {isCanvasMounted && (
            <Suspense fallback={null}>
              <LazyGlobeCanvas
                projects={projects}
                activeSlug={activeSlug}
                onSelect={setActiveSlug}
                onAnchorMove={drawFrom}
              />
            </Suspense>
          )}
          <ProjectLocationNav
            projects={projects}
            activeSlug={activeSlug}
            onSelect={setActiveSlug}
          />
        </div>

        <div>
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
        </div>

        {/* Stacked layouts put the label under the globe, where a leader line has nothing to say. */}
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 hidden h-full w-full md:block"
        >
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
      </section>

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
      className="sr-only focus-within:not-sr-only focus-within:absolute focus-within:inset-x-0 focus-within:bottom-0 focus-within:flex focus-within:flex-wrap focus-within:gap-xs"
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
