import { ProjectCard } from "@/components/app/ProjectCard";
import type { ResolvedProject } from "@/types/project";

export interface ProjectGridProps {
  projects: ResolvedProject[];
  onSelectProject: (slug: string) => void;
}

export function ProjectGrid({ projects, onSelectProject }: ProjectGridProps) {
  return (
    <div className="grid grid-cols-1 gap-l p-l sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard
          key={project.slug}
          project={project}
          onSelect={onSelectProject}
        />
      ))}
    </div>
  );
}
