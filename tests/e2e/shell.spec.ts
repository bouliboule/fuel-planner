import { expect, test } from '@playwright/test';

test('the start URL lands on Today', async ({ page }) => {
  await page.goto('./');
  await expect(page).toHaveURL(/\/fuel-planner\/today$/);
  await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible();
});

test('the tab bar navigates between the four screens', async ({ page }) => {
  await page.goto('today');
  const tabs = page.getByRole('navigation', { name: 'Main' });
  for (const [label, path] of [
    ['Week', 'week'],
    ['Foods', 'foods'],
    ['Settings', 'settings'],
    ['Today', 'today'],
  ] as const) {
    await tabs.getByRole('link', { name: label }).click();
    await expect(page).toHaveURL(new RegExp(`/fuel-planner/${path}$`));
    await expect(page.getByRole('heading', { name: label })).toBeVisible();
  }
});

test('a deep link loads the matching screen', async ({ page }) => {
  await page.goto('foods');
  await expect(page.getByRole('heading', { name: 'Foods' })).toBeVisible();
});
