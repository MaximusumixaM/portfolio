import type { Project } from "./project";
import { ProjectTile } from "./ProjectTile";

import {
  DOCK_RADIUS_PX,
  DOCK_TOP_PX,
  HERO_SCROLL_SCREENS,
  PORTFOLIO_RISE_AT,
} from "@/components/app/max-hero/heroTransition";
import { sectionTrackId } from "@/components/app/scroll/timeline";
import { Heading } from "@/components/peduncle/Typography";

/** The header's lowest point: the docked globe at rest. The work starts just below it. */
const HEADER_BOTTOM_PX = DOCK_TOP_PX + DOCK_RADIUS_PX * 2;
const HEADER_CLEARANCE = `calc(${String(HEADER_BOTTOM_PX)}px + var(--spacing-s))`;

// Pulled up over the hero's tail so the title (not the section's edge) comes into view at
// PORTFOLIO_RISE_AT. The clearance is capped so the page always scrolls far enough to finish the hero.
const HERO_OVERLAP_VH = (1 - PORTFOLIO_RISE_AT) * HERO_SCROLL_SCREENS * 100;
const MAX_CLEARANCE_VH = PORTFOLIO_RISE_AT * HERO_SCROLL_SCREENS * 100;
const MARGIN_TOP = `calc(${String(-HERO_OVERLAP_VH)}vh - min(${HEADER_CLEARANCE}, ${String(MAX_CLEARANCE_VH)}vh))`;

export interface ProjectsSectionProps {
  projects: readonly Project[];
}

// The selected work. From tablets up it's one screen: Tulip takes a bigger block, the rest one tile
// each, the rows sharing whatever height is left under the header; as the page's last screen it
// settles exactly into view. Phones stack the tiles and scroll. Paints over the hero's pinned
// screen, under the canvas (z-20).
export function ProjectsSection({ projects }: ProjectsSectionProps) {
  return (
    <section
      id={sectionTrackId("projects")}
      aria-labelledby="projects-heading"
      className="relative z-10 flex min-h-dvh w-full flex-col gap-m bg-background-default px-m pb-m md:h-dvh md:px-l md:pb-l"
      style={{ marginTop: MARGIN_TOP, paddingTop: HEADER_CLEARANCE }}
    >
      <Heading level="h2" id="projects-heading">
        Selected work
      </Heading>
      <ul className="flex flex-col gap-s md:grid md:min-h-0 md:flex-1 md:auto-rows-fr md:grid-cols-2 lg:grid-cols-3 lg:gap-m">
        {projects.map((project) => (
          <ProjectTile key={project.id} project={project} />
        ))}
      </ul>
    </section>
  );
}
