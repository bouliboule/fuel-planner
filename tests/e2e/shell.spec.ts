import { expect, test } from '@playwright/test';
import { completeFirstRun } from './helpers.ts';

test.beforeEach(async ({ page }) => {
  await completeFirstRun(page);
});

test('the start URL lands on the Day screen once set up', async ({ page }) => {
  await page.goto('./');
  await expect(page).toHaveURL(/\/fuel-planner\/day$/);
  await expect(
    page.getByRole('button', { name: 'Add activity' }),
  ).toBeVisible();
});

test('Profile opens from the Day screen and leads back', async ({ page }) => {
  await page.getByRole('link', { name: 'Profile' }).click();
  await expect(page).toHaveURL(/\/fuel-planner\/profile$/);
  await expect(
    page.getByRole('heading', { name: 'Profile', level: 1 }),
  ).toBeVisible();
  await page.getByRole('link', { name: /Back/ }).click();
  await expect(page).toHaveURL(/\/fuel-planner\/day$/);
});

test('removed screens redirect to the Day screen', async ({ page }) => {
  for (const path of ['week', 'foods', 'today', 'settings']) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/fuel-planner\/day$/);
  }
});
