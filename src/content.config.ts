import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { list, text } from './lib/cms-schema';

const imageKind = () => text().transform((value) => (value === 'drawing' ? 'drawing' : 'photo'));

const galleryItem = z.object({
  image: z.string(),
  caption: text(),
  scale: text(),
  kind: imageKind(),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string().min(1),
    subtitle: text(),

    typology: text(),
    location: text(),
    course: text(),
    completed: text(),
    instructor: text(),

    summary: text(),

    cover: text(),
    cover_kind: imageKind(),
    layout: text().transform((value) => (value === 'wide' ? 'wide' : 'side')),
    gallery: list(galleryItem),

    featured: z.boolean().default(false),
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
