// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://sarah-mak-portfolio.abuyuanjustin.workers.dev',

  output: 'static',

  integrations: [sitemap()],

  image: {
    layout: 'constrained',
    responsiveStyles: true,
  },

  vite: {
    plugins: [tailwindcss()],
  },
});
