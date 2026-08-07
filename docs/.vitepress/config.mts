import { defineConfig } from 'vitepress';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  title: 'Indian Fake Data Generator',
  description: 'Realistic, statistically consistent synthetic Indian demographic data — Census 2011 backed, for Python & Node.js.',
  lang: 'en-US',
  head: [
    ['meta', { name: 'theme-color', content: '#e11d48' }],
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
  ],
  themeConfig: {
    logo: '/favicon.svg',
    nav: [
      { text: 'Guide', link: '/guide/getting-started', activeMatch: '/guide/' },
      { text: 'Playground', link: '/playground/' },
      { text: 'API Reference', link: '/guide/typescript-api', activeMatch: '/guide/typescript-api|/guide/python-api' },
      { text: 'GitHub', link: 'https://github.com/abhay557/indian-fakedata' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/guide/getting-started' },
            { text: 'CLI Reference', link: '/guide/cli' },
          ],
        },
        {
          text: 'API Reference',
          items: [
            { text: 'TypeScript / Node.js', link: '/guide/typescript-api' },
            { text: 'Python', link: '/guide/python-api' },
          ],
        },
        {
          text: 'Advanced',
          items: [
            { text: 'Relational Data (Families)', link: '/guide/relational-data' },
            { text: 'Enrichment Layers', link: '/guide/enrichment' },
            { text: 'Data Accuracy & Sources', link: '/guide/data-accuracy' },
            { text: 'FAQ', link: '/guide/faq' },
          ],
        },
      ],
      '/playground/': [
        {
          text: 'Playground',
          items: [{ text: 'Live Generator', link: '/playground/' }],
        },
      ],
    },
    footer: {
      message: 'MIT Licensed · Synthetic data, no real individuals',
      copyright: 'Copyright © 2026 Abhay Mourya',
    },
    search: { provider: 'local' },
  },
  vite: {
    resolve: {
      alias: {
        fs: fileURLToPath(new URL('./stubs/fs.ts', import.meta.url)),
      },
    },
  },
});
