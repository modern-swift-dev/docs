import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

const guides = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: "./.build/content",
    generateId: ({ entry }) => entry.replace(/\.md$/, ""),
  }),
  schema: z.object({ title: z.string(), description: z.string() }),
});

export const collections = { guides };
