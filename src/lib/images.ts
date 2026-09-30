import type { ImageMetadata } from 'astro';

/*
  Pages CMS uploads land in `src/assets/media` and are referenced from content
  as `/src/assets/media/<file>`. Keeping them inside src (rather than public)
  means every image still goes through Astro's optimiser, so a 12MP render from
  Rhino gets resized and converted instead of shipped as-is.

  `import.meta.glob` builds the path -> ImageMetadata map at build time.
*/
const media = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/media/**/*.{jpeg,jpg,png,gif,webp,avif,tiff,svg}',
  { eager: true },
);

/** Resolve a CMS image path to optimisable image metadata, if we have the file. */
export function resolveImage(path?: string | null): ImageMetadata | undefined {
  if (!path) return undefined;
  const key = path.startsWith('/') ? path : `/${path}`;
  return media[key]?.default;
}

/** Every uploaded image, handy for debugging a path that will not resolve. */
export function knownImagePaths(): string[] {
  return Object.keys(media).sort();
}
