import type { ImageMetadata } from 'astro';

/* Uploads live in src/, not public/, so Astro still optimises them. */
const media = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/media/**/*.{jpeg,jpg,png,gif,webp,avif,tiff,svg}',
  { eager: true },
);

export function resolveImage(path?: string | null): ImageMetadata | undefined {
  if (!path) return undefined;
  const key = path.startsWith('/') ? path : `/${path}`;
  return media[key]?.default;
}
