import { copyFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages project site path (docs/DECISIONS.md D6). The installed iOS
// app and its IndexedDB data are tied to this origin and path.
const base = '/fuel-planner/';

const themeColor = '#000000';

const { version } = JSON.parse(
  await readFile(new URL('./package.json', import.meta.url), 'utf8'),
) as { version: string };

// GitHub Pages has no rewrite rules. A copy of index.html as 404.html boots
// the app on deep links loaded before the service worker is installed.
function pagesSpaFallback(): Plugin {
  let outDir = 'dist';
  return {
    name: 'pages-spa-fallback',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    async closeBundle() {
      await copyFile(
        resolve(outDir, 'index.html'),
        resolve(outDir, '404.html'),
      );
    },
  };
}

export default defineConfig({
  base,
  define: { __APP_VERSION__: JSON.stringify(version) },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        id: base,
        name: 'Fuel Planner',
        short_name: 'Fuel',
        description:
          'Daily energy and macro targets and meal timing from planned training.',
        lang: 'en',
        start_url: base,
        scope: base,
        display: 'standalone',
        background_color: themeColor,
        theme_color: themeColor,
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'pwa-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,json,webmanifest}'],
        globIgnores: ['404.html'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
    }),
    pagesSpaFallback(),
  ],
});
