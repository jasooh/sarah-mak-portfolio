# Sarah Mak — Portfolio

Architecture portfolio built with [Astro](https://astro.build), edited through
[Pages CMS](https://pagescms.org), and deployed as a static site to Cloudflare
Pages.

## Stack

| Piece | Choice |
| --- | --- |
| Framework | Astro 7, static output (no adapter) |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite`, tokens in `src/styles/global.css` |
| Type | IBM Plex Mono, self-hosted — matches the printed portfolio |
| Content | Astro content collections (Markdown + YAML) |
| Editing | Pages CMS, hosted at [app.pagescms.org](https://app.pagescms.org) |
| Images | `astro:assets` — responsive, converted to WebP at build time |
| Hosting | Cloudflare Pages |

## Commands

```sh
npm install
npm run dev      # dev server at localhost:4321
npm run build    # static build into dist/
npm run preview  # serve the built site
npx astro check  # type-check .astro and .ts files
```

## Formatting

Project pages follow the printed portfolio: a running head reading
`Selected Works | <project>`, a numbered italic title (`01| Example Project`)
with an optional subtitle, then a `Key: Value` metadata block —

    Typology:   Residential Building
    Location:   Toronto, Ontario
    Course:     ARC2013 Integrated Urbanism Studio
    Completed:  December 2025
    Instructor: Instructor name

— justified body copy, and a gallery whose captions read
`Ground Floor Site Plan (scale 1:150)`. Each image is marked as a **drawing**
or a **photograph**: drawings get a hairline frame and sit on the page colour,
photographs fill their frame. The CV page uses the same sections as the
printed one: expertise, academic qualifications, activities, experience.

## Content model

Everything an editor touches lives in these four places, and each one is mapped
to a Pages CMS screen in [`.pages.yml`](./.pages.yml).

| What | Where | Format |
| --- | --- | --- |
| Projects | `src/content/projects/*.md` | Markdown + frontmatter |
| About page | `src/content/pages/about.md` | Markdown + frontmatter |
| CV | `src/data/cv.yml` | YAML |
| Site settings | `src/data/site.yml` | YAML |

Uploads are split by kind:

- **Images** → `src/assets/media/`, referenced as `/src/assets/media/<file>`.
  They live inside `src/` on purpose: that is what lets Astro resize and convert
  them, so a full-resolution render does not get served as-is.
- **Documents** (the CV PDF) → `public/files/`, referenced as `/files/<file>`
  and served unchanged.

`src/lib/images.ts` maps a stored path back to the real file with
`import.meta.glob`, and `src/components/CmsImage.astro` renders it — falling back
to a neutral placeholder when a field is still empty.

## Connecting Pages CMS

1. Push this repository to GitHub.
2. Go to [app.pagescms.org](https://app.pagescms.org) and sign in with GitHub.
3. Install the Pages CMS GitHub App on the account that owns the repository, and
   grant it access to this repository.
4. Open the repository in Pages CMS. It reads `.pages.yml` and the Projects,
   About, CV and Site settings screens appear.
5. Invite Sarah as a collaborator so she can edit without touching Git.

Every save is a commit, so each edit triggers a fresh Cloudflare Pages build.

## Deploying to Cloudflare Pages

Create a Pages project connected to this repository with:

- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Node version:** 22 (already pinned in `.node-version`)

Then set `site` in [`astro.config.mjs`](./astro.config.mjs) to the real domain —
it is used for canonical URLs, Open Graph tags and `sitemap-index.xml`.

## Adding a project by hand

```sh
cat > src/content/projects/riverside-pavilion.md <<'MD'
---
title: Riverside Pavilion
year: '2025'
location: London, UK
category: Studio project
role: Individual work
summary: A timber pavilion negotiating a tidal edge.
cover: /src/assets/media/riverside-01.jpg
gallery:
  - image: /src/assets/media/riverside-02.jpg
    caption: Long section, 1:50
featured: true
order: 1
draft: false
---

Project description in Markdown.
MD
```

`draft: true` hides a project from production builds while leaving it visible in
`npm run dev`.
