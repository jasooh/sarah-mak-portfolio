import { parse } from 'yaml';
import siteRaw from '../data/site.yml?raw';
import cvRaw from '../data/cv.yml?raw';
import { list, text, z } from './cms-schema';

/*
  Global settings and the CV live in YAML so Pages CMS can edit them as single
  files. Both are parsed and validated at build time, so a malformed value
  fails the build with a readable path rather than rendering as "undefined".
*/

const siteSchema = z.object({
  name: z.string().min(1),
  role: text(),
  tagline: text(),
  intro: text(),
  email: text(),
  location: text(),
  social: list(z.object({ label: z.string(), url: z.string() })),
  seo: z
    .object({
      description: text(),
      image: text(),
    })
    .nullish()
    .transform((value) => value ?? { description: undefined, image: undefined }),
  footer_note: text(),
});

const dateRange = {
  start: text(),
  end: text(),
};

/*
  Sections follow the CV page of the printed portfolio: expertise, academic
  qualifications, activities and experience.
*/
const cvSchema = z.object({
  pdf: text(),
  expertise: list(
    z.object({
      name: z.string(),
      /** As printed: "6 years". */
      duration: text(),
    }),
  ),
  academic: list(
    z.object({
      qualification: z.string(),
      institution: text(),
      faculty: text(),
      notes: text(),
      ...dateRange,
    }),
  ),
  activities: list(
    z.object({
      role: z.string(),
      organisation: text(),
      notes: text(),
      ...dateRange,
    }),
  ),
  experience: list(
    z.object({
      role: z.string(),
      organisation: text(),
      location: text(),
      notes: text(),
      ...dateRange,
    }),
  ),
  awards: list(
    z.object({
      title: z.string(),
      issuer: text(),
      year: text(),
      notes: text(),
    }),
  ),
});

function load<T extends z.ZodType>(schema: T, raw: string, file: string): z.infer<T> {
  const result = schema.safeParse(parse(raw) ?? {});
  if (!result.success) {
    throw new Error(`Invalid ${file}:\n${result.error.issues.map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`).join('\n')}`);
  }
  return result.data;
}

export const site = load(siteSchema, siteRaw, 'src/data/site.yml');
export const cv = load(cvSchema, cvRaw, 'src/data/cv.yml');

/** "2022 — 2024", or one side alone if the other is blank. */
export function formatRange(start?: string, end?: string): string | undefined {
  if (start && end) return `${start} — ${end}`;
  return start ?? end;
}
