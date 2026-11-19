import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { defineCollection } from "astro:content";

// Stops on the About journey, one file per country; `order` sets the route round the globe.
const chapters = defineCollection({
  loader: glob({ pattern: "*.yaml", base: "./src/content/chapters" }),
  schema: z.object({
    order: z.number().int(),
    place: z.object({
      /** "City, Province/State, Country" — the heading the place is listed under. */
      label: z.string(),
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }),
    /** Where the zoomed view centres, when it shouldn't be the place itself (e.g. so a coastal city's country shows). */
    focus: z
      .object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
      })
      .optional(),
    /** ISO 3166-1 alpha-3, matching the globe's country and province data. */
    countryCode: z.string().length(3),
    /** ISO 3166-2 of the province/state the place is in, which the globe highlights. */
    regionCode: z.string(),
    theme: z.enum(["canada", "sweden", "germany", "boston"]),
    text: z.string(),
  }),
});

// The selected work, one file per project; `order` sets its place in the grid.
const projects = defineCollection({
  loader: glob({ pattern: "*.yaml", base: "./src/content/projects" }),
  schema: z.object({
    order: z.number().int(),
    title: z.string(),
    /** `feature` takes a bigger block of the grid (Tulip). */
    tile: z.enum(["feature", "standard"]).default("standard"),
    tags: z.array(z.string()),
    /** The project's own colour (a hex), used only as a hint of it. */
    color: z.string().regex(/^#[0-9a-f]{6}$/i),
    summary: z.string(),
    /** The project's parts, in reading order: the page's spreads and its progress strip. */
    sections: z.array(z.object({ title: z.string(), text: z.string() })).min(1),
  }),
});

export const collections = { chapters, projects };
