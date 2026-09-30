import { z } from 'astro/zod';

/*
  Pages CMS writes cleared fields as an empty string, and YAML turns an empty
  key into `null`. These helpers normalise both to `undefined` / `[]`, so
  clearing a field in the CMS cannot break the build.
*/

/** Optional single-line or multi-line text; blank becomes `undefined`. */
export const text = () =>
  z
    .union([z.string(), z.number(), z.null()])
    .optional()
    .transform((value) => {
      if (value === null || value === undefined) return undefined;
      const trimmed = String(value).trim();
      return trimmed ? trimmed : undefined;
    });

/** Optional array of `item`; missing or null becomes `[]`. */
export const list = <T extends z.ZodType>(item: T) =>
  z
    .array(item)
    .nullish()
    .transform((value) => value ?? []);

export { z };
