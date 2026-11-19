import { getCollection } from "astro:content";

import type { Project } from "@/components/app/projects/project";

/** The selected work, in grid order. Server-side: pages load it and hand it to the island. */
export async function loadProjects(): Promise<readonly Project[]> {
  const projects = (await getCollection("projects"))
    .sort((a, b) => a.data.order - b.data.order)
    .map(({ id, data }) => ({ id, ...data }));
  if (projects.length === 0) {
    throw new Error(
      "No projects loaded from src/content/projects — check the files against the schema in src/content.config.ts",
    );
  }
  return projects;
}
