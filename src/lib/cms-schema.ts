import { z } from 'astro/zod';

export const text = () =>
  z
    .union([z.string(), z.number(), z.null()])
    .optional()
    .transform((value) => {
      if (value === null || value === undefined) return undefined;
      const trimmed = String(value).trim();
      return trimmed ? trimmed : undefined;
    });

export const list = <T extends z.ZodType>(item: T) =>
  z
    .array(item)
    .nullish()
    .transform((value) => value ?? []);

export { z };
