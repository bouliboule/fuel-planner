import { expect, test, type APIRequestContext } from '@playwright/test';
import { completeFirstRun } from './helpers.ts';

interface ManifestIcon {
  src: string;
  sizes: string;
  type: string;
  purpose?: string;
}

interface Manifest {
  name?: string;
  short_name?: string;
  start_url?: string;
  scope?: string;
  display?: string;
  icons?: ManifestIcon[];
}

// Reads width and height from a PNG IHDR chunk.
async function pngSize(request: APIRequestContext, url: string) {
  const response = await request.get(url);
  expect(response.ok(), url).toBe(true);
  expect(response.headers()['content-type']).toContain('image/png');
  const body = await response.body();
  return `${String(body.readUInt32BE(16))}x${String(body.readUInt32BE(20))}`;
}

test('the manifest and icons meet installability requirements', async ({
  page,
  request,
}) => {
  await page.goto('today');

  const manifestHref = await page
    .locator('link[rel="manifest"]')
    .getAttribute('href');
  expect(manifestHref).toBeTruthy();
  const manifestUrl = new URL(manifestHref ?? '', page.url()).href;
  const manifest = (await (await request.get(manifestUrl)).json()) as Manifest;

  expect(manifest.name).toBe('Fuel Planner');
  expect(manifest.short_name).toBeTruthy();
  expect(manifest.display).toBe('standalone');
  expect(manifest.start_url).toBe('/fuel-planner/');
  expect(manifest.scope).toBe('/fuel-planner/');

  const icons = manifest.icons ?? [];
  const sizes = icons.map((icon) => icon.sizes);
  expect(sizes).toContain('192x192');
  expect(sizes).toContain('512x512');
  expect(icons.some((icon) => icon.purpose === 'maskable')).toBe(true);
  for (const icon of icons) {
    const actual = await pngSize(request, new URL(icon.src, manifestUrl).href);
    expect(actual, icon.src).toBe(icon.sizes);
  }

  const touchIconHref = await page
    .locator('link[rel="apple-touch-icon"]')
    .getAttribute('href');
  expect(touchIconHref).toBeTruthy();
  expect(
    await pngSize(request, new URL(touchIconHref ?? '', page.url()).href),
  ).toBe('180x180');
});

test('the app loads offline once the service worker is active', async ({
  page,
  context,
}) => {
  await completeFirstRun(page);
  // `ready` resolves while the worker may still be activating; precaching is
  // done only once it reports 'activated'.
  const state = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    const worker = registration.active;
    if (worker && worker.state !== 'activated') {
      await new Promise<void>((resolve) => {
        worker.addEventListener('statechange', () => {
          if (worker.state === 'activated') resolve();
        });
      });
    }
    return worker?.state;
  });
  expect(state).toBe('activated');

  await context.setOffline(true);

  await page.goto('week');
  await expect(page.getByRole('heading', { name: 'Week' })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Week' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
});
