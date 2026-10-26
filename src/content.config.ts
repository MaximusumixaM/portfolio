import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { defineCollection } from "astro:content";

// Stops on the About journey, one file per country; `order` sets the route round the globe.
const chapters = defineCollection({
  loader: glob({ pattern: "*.yaml", base: "./src/content/chapters" }),
  schema: z.object({
    order: z.number().int(),
    title: z.string(),
    place: z.object({
      label: z.string(),
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }),
    /** ISO 3166-1 alpha-3, matching the globe's country and province data. */
    countryCode: z.string().length(3),
    /** ISO 3166-2 of the province/state the place is in, which the globe highlights. */
    regionCode: z.string(),
    theme: z.enum(["canada", "sweden", "germany", "boston"]),
    text: z.string(),
  }),
});

export const collections = { chapters };
