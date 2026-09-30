// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // Canonical URLs, Open Graph tags and the sitemap are all derived from this.
  site: 'https://sarah-mak-portfolio.pages.dev',

  output: 'static',

  integrations: [sitemap()],

  image: {
    // Astro emits the srcset, sizes and matching styles for every image.
    layout: 'constrained',
    responsiveStyles: true,
  },

  vite: {
    plugins: [tailwindcss()],
  },
});
