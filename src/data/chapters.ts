import { getCollection } from "astro:content";

import type { Chapters } from "@/components/app/about/chapter";

/** The About story's places, in order. Server-side: pages load them and hand them to the island. */
export async function loadChapters(): Promise<Chapters> {
  const [first, ...rest] = (await getCollection("chapters"))
    .sort((a, b) => a.data.order - b.data.order)
    .map(({ id, data }) => ({ id, ...data }));
  if (first === undefined) {
    throw new Error(
      "No chapters loaded from src/content/chapters — check the files against the schema in src/content.config.ts",
    );
  }
  return [first, ...rest];
}
