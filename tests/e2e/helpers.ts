import { expect, type Page } from '@playwright/test';

/** Completes first run with test values and lands on the Day screen. */
export async function completeFirstRun(
  page: Page,
  options: { massKg?: string; ftpW?: string } = {},
) {
  await page.goto('./');
  await expect(page).toHaveURL(/\/fuel-planner\/welcome$/);
  await page.getByLabel('Sex').selectOption('male');
  await page.getByLabel('Body mass (kg)').fill(options.massKg ?? '75');
  if (options.ftpW)
    await page.getByLabel('FTP (W) (optional)').fill(options.ftpW);
  await page.getByLabel('Wake time').fill('07:00');
  await page.getByLabel('Sleep time').fill('23:00');
  const mealTimes = page.getByLabel('Time', { exact: true });
  await mealTimes.nth(0).fill('07:30');
  await mealTimes.nth(1).fill('12:30');
  await mealTimes.nth(2).fill('19:30');
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('heading', { name: 'Goal' })).toBeVisible();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(
    page.getByRole('heading', { name: 'Not medical advice' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Start planning' }).click();
  await expect(page).toHaveURL(/\/fuel-planner\/day$/);
}

/** Waits until the service worker is activated, so precaching is done. */
export async function waitForServiceWorker(page: Page) {
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
}

/** Today's date in Europe/Paris, the profile time zone in tests. */
export function todayParis(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}
