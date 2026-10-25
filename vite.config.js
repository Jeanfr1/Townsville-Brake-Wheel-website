import { defineConfig } from 'vite'
import { site } from './src/data/site.js'

// Static business data goes into the built HTML, so contact details work without JS.
const facts = () => ({
  name: 'site-facts',
  transformIndexHtml: (html) =>
    html.replace(/\{\{(\w+)\}\}/g, (m, key) => {
      if (!(key in site)) throw new Error(`index.html: unknown fact {{${key}}}`)
      return String(site[key]).replace(/&/g, '&amp;')
    }),
})

export default defineConfig({
  plugins: [facts()],
  build: { assetsInlineLimit: 0, target: 'es2020' },
  preview: { port: 4319 },
})
