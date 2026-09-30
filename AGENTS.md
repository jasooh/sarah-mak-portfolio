## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## This project

Astro static site, Tailwind v4, content edited via Pages CMS (`.pages.yml`).

- Content lives in `src/content/projects/*.md`, `src/content/pages/about.md`,
  `src/data/site.yml` and `src/data/cv.yml`. Changing a field means updating
  both the Astro schema (`src/content.config.ts` or `src/lib/site.ts`) **and**
  the matching field in `.pages.yml`.
- CMS image paths are `/src/assets/media/<file>` strings, not imports. Render
  them with `src/components/CmsImage.astro`, never a bare `<img>`, so they go
  through `astro:assets`.
- Blank CMS fields arrive as `''` or `null`; the `text()` / `list()` helpers in
  `src/lib/cms-schema.ts` normalise them. Use them for new optional fields.
- Project pages mirror Sarah's printed portfolio: numbered italic titles,
  a `Key: Value` metadata block (Typology/Location/Course/Completed/Instructor),
  captions of the form `Name (scale 1:150)`, and images marked `drawing`
  (hairline frame) or `photo` (bare). Keep new fields consistent with it.
- Headings are lowercase italic (`.heading`); uppercase tracked `.label` is for
  site chrome only — nav, footer, counts.
- The backdrop has two implementations of one building: the SVG in
  `BuildingBackdrop.astro` and the three.js scene in `src/lib/backdrop.ts`.
  Changing the form means changing both, or the fallback stops matching.
- Run `npx astro check` and `npm run build` before considering a change done.
