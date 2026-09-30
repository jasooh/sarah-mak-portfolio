import { getCollection, type CollectionEntry } from 'astro:content';

type Project = CollectionEntry<'projects'>;

/** `completed` is free text ("December 2025"), so sort on the year within it. */
function completedYear(value?: string): number {
  const match = value?.match(/\d{4}/);
  return match ? Number(match[0]) : 0;
}

/** Explicit `order` wins; otherwise most recently completed first. */
function compare(a: Project, b: Project): number {
  const orderA = a.data.order ?? Number.POSITIVE_INFINITY;
  const orderB = b.data.order ?? Number.POSITIVE_INFINITY;
  if (orderA !== orderB) return orderA - orderB;

  const yearA = completedYear(a.data.completed);
  const yearB = completedYear(b.data.completed);
  if (yearA !== yearB) return yearB - yearA;

  return a.data.title.localeCompare(b.data.title);
}

/** The printed project number: explicit `order`, else position in the list. */
export function projectNumber(project: Project, index: number): string {
  return String(project.data.order ?? index + 1).padStart(2, '0');
}

/** All projects in display order. Drafts are hidden in production builds. */
export async function getProjects(): Promise<Project[]> {
  const projects = await getCollection('projects', ({ data }) =>
    import.meta.env.PROD ? !data.draft : true,
  );
  return projects.sort(compare);
}

export async function getFeaturedProjects(limit = 6): Promise<Project[]> {
  const projects = await getProjects();
  const featured = projects.filter((project) => project.data.featured);
  return (featured.length > 0 ? featured : projects).slice(0, limit);
}

export type { Project };
