import { Heading } from "@/components/peduncle/Typography";
import type { ResolvedProject } from "@/types/project";

export interface ProjectCardProps {
  project: ResolvedProject;
  onSelect: (slug: string) => void;
}

export function ProjectCard({ project, onSelect }: ProjectCardProps) {
  return (
    <button
      type="button"
      className="group relative aspect-square cursor-pointer overflow-hidden border-none bg-background-default-hover p-0 shadow-[0_0_7px_var(--color-border-strong)]"
      aria-haspopup="dialog"
      onClick={() => {
        onSelect(project.slug);
      }}
    >
      <img
        className="block h-full w-full object-cover transition-opacity duration-300 group-hover:opacity-50"
        src={project.thumbnail.src}
        srcSet={project.thumbnail.srcSet}
        sizes={project.thumbnail.sizes}
        width={project.thumbnail.width}
        height={project.thumbnail.height}
        alt=""
      />
      <Heading
        level="h3"
        className="absolute top-0 left-[-10px] z-[2] text-foreground-on-accent opacity-0 transition-all duration-300 group-hover:left-[20px] group-hover:opacity-100"
      >
        {project.title}
      </Heading>
    </button>
  );
}
