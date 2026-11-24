import { getCollection } from "astro:content";

import type { Experience } from "@/components/app/about/experience";

/** The Experience tab's lists, in file order. Server-side: pages load them and hand them to the island. */
export async function loadExperience(): Promise<Experience> {
  const [work, awards, skills] = await Promise.all([
    getCollection("work"),
    getCollection("awards"),
    getCollection("skills"),
  ]);
  return {
    work: work.map(({ id, data }) => ({ id, ...data })),
    awards: awards.map(({ id, data }) => ({ id, ...data })),
    skills: skills.map(({ id, data }) => ({ id, ...data })),
  };
}
