import type { CollectionEntry } from "astro:content";

type Entry<Name extends "work" | "awards" | "skills"> =
  CollectionEntry<Name>["data"] & { id: string };

/** The Experience tab's lists, as the page hands them to the island. */
export interface Experience {
  work: readonly Entry<"work">[];
  awards: readonly Entry<"awards">[];
  skills: readonly Entry<"skills">[];
}
