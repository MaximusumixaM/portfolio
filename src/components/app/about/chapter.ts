import type { CollectionEntry } from "astro:content";

/** A place in the About story as the page hands it to the island: the entry's data plus its id. */
export type Chapter = CollectionEntry<"chapters">["data"] & { id: string };

/** The story always has at least one place to start from. */
export type Chapters = readonly [Chapter, ...Chapter[]];
