import type { CollectionEntry } from "astro:content";

/** A journey stop as the page hands it to the island: the collection entry's data plus its id. */
export type Chapter = CollectionEntry<"chapters">["data"] & { id: string };
