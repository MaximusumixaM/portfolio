import type { CollectionEntry } from "astro:content";

/** A project as the page hands it to the island: the entry's data plus its id (also its slug). */
export type Project = CollectionEntry<"projects">["data"] & { id: string };

/** The DOM id of a project's tile link: where its view grows from, and where focus returns. */
export function projectTileId(projectId: string): string {
  return `project-tile-${projectId}`;
}
