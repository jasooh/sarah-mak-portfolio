// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // Update this to the production domain before launch. It is used for
  // canonical URLs, Open Graph tags and the generated sitemap.
  site: 'https://sarah-mak-portfolio.pages.dev',

  // Static output — deploys to Cloudflare Pages with no adapter.
  output: 'static',

  integrations: [sitemap()],

  image: {
    // Responsive images by default: Astro emits the srcset/sizes and the
    // matching styles, so <CmsImage> stays a one-liner at every call site.
    layout: 'constrained',
    responsiveStyles: true,
  },

  vite: {
    plugins: [tailwindcss()],
  },
});
