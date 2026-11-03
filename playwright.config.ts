import { defineConfig, devices } from '@playwright/test';

// The service worker only runs in a production build, so e2e tests run
// against `vite preview`, never the dev server.
const port = 4173;
const baseURL = `http://localhost:${String(port)}/fuel-planner/`;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  // Chromium only: Playwright's service worker support is reliable there.
  projects: [{ name: 'mobile-chromium', use: { ...devices['Pixel 7'] } }],
  webServer: {
    command: `pnpm build && pnpm preview --port ${String(port)} --strictPort`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
