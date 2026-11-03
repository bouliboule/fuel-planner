import { expect, test } from '@playwright/test';
import { completeFirstRun } from './helpers.ts';

test.beforeEach(async ({ page }) => {
  await completeFirstRun(page);
});

test('the start URL lands on Today once set up', async ({ page }) => {
  await page.goto('./');
  await expect(page).toHaveURL(/\/fuel-planner\/today$/);
  await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible();
});

test('the tab bar navigates between the four screens', async ({ page }) => {
  const tabs = page.getByRole('navigation', { name: 'Main' });
  for (const [label, path] of [
    ['Week', 'week'],
    ['Foods', 'foods'],
    ['Settings', 'settings'],
    ['Today', 'today'],
  ] as const) {
    await tabs.getByRole('link', { name: label }).click();
    await expect(page).toHaveURL(new RegExp(`/fuel-planner/${path}$`));
    await expect(
      page.getByRole('heading', { name: label, level: 1 }),
    ).toBeVisible();
  }
});

test('a deep link loads the matching screen', async ({ page }) => {
  await page.goto('foods');
  await expect(page.getByRole('heading', { name: 'Foods' })).toBeVisible();
});
