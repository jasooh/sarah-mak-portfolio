import { getCollection, type CollectionEntry } from 'astro:content';

type Project = CollectionEntry<'projects'>;

/** Explicit `order` wins; otherwise newest year first, then alphabetical. */
function compare(a: Project, b: Project): number {
  const orderA = a.data.order ?? Number.POSITIVE_INFINITY;
  const orderB = b.data.order ?? Number.POSITIVE_INFINITY;
  if (orderA !== orderB) return orderA - orderB;

  const yearA = a.data.year ?? '';
  const yearB = b.data.year ?? '';
  if (yearA !== yearB) return yearB.localeCompare(yearA);

  return a.data.title.localeCompare(b.data.title);
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
