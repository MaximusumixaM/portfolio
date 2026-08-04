import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/peduncle/Button";
import { BodyText, Heading, Helper } from "@/components/peduncle/Typography";
import type { ResolvedProject } from "@/types/project";

export interface ProjectPanelProps {
  project: ResolvedProject;
  projects: ResolvedProject[];
  /** Anchors the leader line running back to the pin on the globe. */
  labelRef: React.Ref<HTMLSpanElement>;
  onSelectProject: (slug: string) => void;
  onOpenDetails: () => void;
}

export function ProjectPanel({
  project,
  projects,
  labelRef,
  onSelectProject,
  onOpenDetails,
}: ProjectPanelProps) {
  return (
    <article className="flex max-w-prose animate-panel-in flex-col gap-m">
      <div className="flex flex-col items-start gap-xs">
        <ProjectStepper
          project={project}
          projects={projects}
          onSelectProject={onSelectProject}
        />
        <div>
          <Helper ref={labelRef} className="block">
            {project.location.label}
          </Helper>
          <Helper className="block opacity-60">{project.location.place}</Helper>
        </div>
      </div>

      <Heading level="h2">{project.title}</Heading>
      <BodyText className="leading-snug">{project.about}</BodyText>

      <div>
        <Button onClick={onOpenDetails} aria-haspopup="dialog">
          View project
        </Button>
      </div>
    </article>
  );
}

interface ProjectStepperProps {
  project: ResolvedProject;
  projects: ResolvedProject[];
  onSelectProject: (slug: string) => void;
}

/** Walks the whole portfolio, for anyone who doesn't think to click the globe. */
function ProjectStepper({
  project,
  projects,
  onSelectProject,
}: ProjectStepperProps) {
  const index = projects.findIndex((entry) => entry.slug === project.slug);
  if (projects.length < 2 || index === -1) return null;

  function step(offset: number) {
    const next = projects[(index + offset + projects.length) % projects.length];
    if (next !== undefined) onSelectProject(next.slug);
  }

  // The negative margin cancels the buttons' padding, aligning the chevron with the text below.
  return (
    <div className="-ml-s flex shrink-0 items-center gap-xs">
      <Button
        variant="ghost"
        size="sm"
        aria-label="Previous project"
        onClick={() => {
          step(-1);
        }}
      >
        <ChevronLeft className="size-m" aria-hidden="true" />
      </Button>
      <Helper className="tabular-nums">
        {index + 1} / {projects.length}
      </Helper>
      <Button
        variant="ghost"
        size="sm"
        aria-label="Next project"
        onClick={() => {
          step(1);
        }}
      >
        <ChevronRight className="size-m" aria-hidden="true" />
      </Button>
    </div>
  );
}
