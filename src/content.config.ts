import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { list, text } from './lib/cms-schema';

const galleryItem = z.object({
  image: z.string(),
  caption: text(),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string().min(1),
    /** Free text so ranges like "2024–25" work as well as a single year. */
    year: text(),
    location: text(),
    category: text(),
    /** e.g. "Studio project", "Competition entry", "Internship". */
    role: text(),
    /** One or two lines shown on the project card and at the top of the page. */
    summary: text(),
    cover: text(),
    gallery: list(galleryItem),
    /** Featured projects appear on the home page. */
    featured: z.boolean().default(false),
    /** Lower numbers sort first; projects without an order fall back to year. */
    order: z.number().nullish(),
    draft: z.boolean().default(false),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string().min(1),
    headline: text(),
    portrait: text(),
    portrait_alt: text(),
  }),
});

export const collections = { projects, pages };
