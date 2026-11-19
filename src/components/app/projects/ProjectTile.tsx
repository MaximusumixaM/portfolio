import { projectTileId, type Project } from "./project";
import { enterProject, isPlainClick, projectPath } from "./projectRoute";

import { cn } from "@/components/lib/utils";
import { BodyText, Heading, Helper } from "@/components/peduncle/Typography";

export interface ProjectTileProps {
  project: Project;
}

/**
 * One project: a block washed faintly in its colour (where its image will go), with its title and
 * tags set inside at the bottom; the summary slides open beneath them on hover. The whole block is
 * the link into the project, which grows out of it. Stacked on phones; in the grid it takes
 * whatever height its row leaves.
 */
export function ProjectTile({ project }: ProjectTileProps) {
  const isFeature = project.tile === "feature";

  return (
    <li
      className={cn(
        // Stacked on phones, each its own shape (Tulip taller); in the grid, its row's height.
        "relative flex focus-within:z-10 hover:z-10 md:aspect-auto md:min-h-0",
        isFeature ? "aspect-square md:col-span-2 lg:row-span-2" : "aspect-4/3",
      )}
    >
      <a
        id={projectTileId(project.id)}
        href={projectPath(project.id)}
        onClick={(event) => {
          if (!isPlainClick(event)) return;
          event.preventDefault();
          enterProject(project.id);
        }}
        // Grows a touch on hover or keyboard focus, lifted over its neighbours (by the li) so the
        // growth isn't clipped.
        className="group relative flex w-full flex-col justify-end overflow-hidden rounded-xl p-m transition-transform duration-500 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus motion-safe:hover:scale-102 motion-safe:focus-visible:scale-102"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-15 transition-opacity duration-500 ease-out group-hover:opacity-25 group-focus-visible:opacity-25"
          style={{ backgroundColor: project.color }}
        />
        <div className="relative flex flex-col gap-xs">
          <Heading level="h3">{project.title}</Heading>
          <ul aria-label="Tags" className="flex flex-wrap gap-xs">
            {project.tags.map((tag) => (
              <li key={tag}>
                <Helper className="rounded-round bg-background-secondary px-s text-small text-foreground-secondary">
                  {tag}
                </Helper>
              </li>
            ))}
          </ul>
          {/* With a mouse it opens on hover (or keyboard focus); touch has no hover, so it stays open. */}
          <div className="grid grid-rows-[1fr] transition-[grid-template-rows,opacity] duration-500 ease-out pointer-fine:grid-rows-[0fr] pointer-fine:opacity-0 pointer-fine:group-hover:grid-rows-[1fr] pointer-fine:group-hover:opacity-100 pointer-fine:group-focus-visible:grid-rows-[1fr] pointer-fine:group-focus-visible:opacity-100">
            <div className="overflow-hidden">
              <BodyText className="line-clamp-2 text-foreground-secondary">
                {project.summary}
              </BodyText>
            </div>
          </div>
        </div>
      </a>
    </li>
  );
}
