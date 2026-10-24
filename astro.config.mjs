// @ts-check
import { defineConfig } from 'astro/config';

// Public URL of the deployed site. Override with SITE_URL when a custom domain is connected.
const site = process.env.SITE_URL || 'https://mufasar-enterprises.sialkotb2b.com';

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'always' },
  compressHTML: true,
  devToolbar: { enabled: false },
  vite: {
    server: {
      // In development the inquiry API is served by scripts/serve.mjs --mock-only (port 4322).
      proxy: { '/api': 'http://localhost:4322' },
    },
  },
});
