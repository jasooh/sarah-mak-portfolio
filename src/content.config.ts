import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { list, text } from './lib/cms-schema';

/*
  Project fields mirror the metadata block in the printed portfolio:

    Typology:   Residential Building
    Location:   Toronto, Ontario
    Course:     ARC2013 Integrated Urbanism Studio
    Completed:  December 2025
    Instructor: Aleris Rodgers

  Drawings sit inside a hairline frame and photographs sit bare, so each image
  carries the `kind` that decides which treatment it receives.
*/

/** `drawing` gets a hairline frame, `photo` sits bare. Anything else is a photo. */
const imageKind = () => text().transform((value) => (value === 'drawing' ? 'drawing' : 'photo'));

const galleryItem = z.object({
  image: z.string(),
  /** e.g. "Ground Floor Site Plan" */
  caption: text(),
  /** e.g. "1:150" — rendered in italic after the caption, as in the portfolio. */
  scale: text(),
  kind: imageKind(),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string().min(1),
    /** The smaller line under the title. */
    subtitle: text(),

    typology: text(),
    location: text(),
    course: text(),
    /** Free text, as printed: "December 2025". */
    completed: text(),
    instructor: text(),

    /** One line for the project card. */
    summary: text(),

    cover: text(),
    cover_kind: imageKind(),
    gallery: list(galleryItem),

    featured: z.boolean().default(false),
    /** Also the printed project number. */
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
