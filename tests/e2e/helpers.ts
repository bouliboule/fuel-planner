import { expect, type Page } from '@playwright/test';

/**
 * Completes first run with test values and lands on Today. `week` fills the
 * week step; by default it is skipped.
 */
export async function completeFirstRun(
  page: Page,
  options: {
    massKg?: string;
    ftpW?: string;
    week?: (page: Page) => Promise<void>;
  } = {},
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
    page.getByRole('heading', { name: 'Week template' }),
  ).toBeVisible();
  if (options.week) await options.week(page);
  else await page.getByRole('button', { name: 'Skip for now' }).click();
  await expect(
    page.getByRole('heading', { name: 'Not medical advice' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Start planning' }).click();
  await expect(page).toHaveURL(/\/fuel-planner\/today$/);
}
