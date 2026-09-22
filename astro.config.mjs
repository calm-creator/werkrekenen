import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://werkrekenen.com',
  trailingSlash: 'always',
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/404')
    })
  ],
  compressHTML: true,
  build: {
    inlineStylesheets: 'auto'
  }
});
