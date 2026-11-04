import { expect, test } from '@playwright/test';
import { completeFirstRun, waitForServiceWorker } from './helpers.ts';

test('a rest day shows totals and the usual meals', async ({ page }) => {
  await completeFirstRun(page);
  await page.getByRole('button', { name: 'Tomorrow' }).click();
  await expect(page.getByText('Rest day')).toBeVisible();
  await expect(page.getByTestId('day-kcal')).toContainText('kcal');
  const cards = page.getByTestId('meal-card');
  await expect(cards.filter({ hasText: 'Breakfast' })).toBeVisible();
  await expect(cards.filter({ hasText: 'Lunch' })).toBeVisible();
  await expect(cards.filter({ hasText: 'Dinner' })).toBeVisible();
  await expect(cards.first()).toContainText('For example:');
});

test('a long ride for tomorrow gives pre, during and post-workout meals, offline too', async ({
  page,
  context,
}) => {
  const origin = new URL(test.info().project.use.baseURL ?? '').origin;
  const external: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith(origin) && !r.url().startsWith('data:'))
      external.push(r.url());
  });

  await completeFirstRun(page, { ftpW: '250' });
  await page.getByRole('button', { name: 'Tomorrow' }).click();
  await page.getByRole('button', { name: 'Add activity' }).click();

  const sheet = page.getByRole('dialog', { name: 'Add activity' });
  await sheet.getByRole('button', { name: 'Ride' }).click();
  await sheet.getByLabel('Start').fill('09:00');
  await sheet.getByRole('button', { name: '240 min' }).click();
  await sheet.getByRole('button', { name: 'Z2 endurance' }).click();
  await expect(sheet.getByTestId('kcal-preview')).toContainText('kcal');
  await sheet.getByRole('button', { name: 'Save activity' }).click();
  await expect(sheet).toBeHidden();

  await expect(page.getByText('Rest day')).toBeHidden();
  const guidance = page.getByTestId('meal-card');
  await expect(
    guidance.and(page.locator('[data-guidance="pre-meal"]')),
  ).toContainText('Pre-workout');
  const during = guidance.and(page.locator('[data-guidance="during"]'));
  await expect(during).toContainText('g carbs per hour');
  await expect(during).toContainText('every 20 min');
  await expect(during).toContainText('Fluid');
  await expect(
    guidance.and(page.locator('[data-guidance="recovery-meal"]')),
  ).toContainText('Post-workout');

  // Number detail: range and trace.
  await page.getByTestId('day-carb').click();
  const detail = page.getByRole('dialog', { name: 'Carbs' });
  await expect(detail).toContainText(/Range \d+ to \d+ g/);
  await detail.getByRole('button', { name: 'Close' }).click();
  await expect(detail).toBeHidden();

  expect(external).toEqual([]);

  await waitForServiceWorker(page);
  await context.setOffline(true);
  await page.reload();
  await page.getByRole('button', { name: 'Tomorrow' }).click();
  await expect(
    page.getByTestId('meal-card').and(page.locator('[data-guidance="during"]')),
  ).toBeVisible();
});

test('an activity can be edited and deleted', async ({ page }) => {
  await completeFirstRun(page);
  await page.getByRole('button', { name: 'Tomorrow' }).click();
  await page.getByRole('button', { name: 'Add activity' }).click();
  const add = page.getByRole('dialog', { name: 'Add activity' });
  await add.getByRole('button', { name: 'Pilates' }).click();
  await add.getByLabel('Start').fill('08:00');
  await add.getByRole('button', { name: '60 min' }).click();
  await add.getByRole('button', { name: 'Hard' }).click();
  await add.getByRole('button', { name: 'Save activity' }).click();

  await page.getByRole('button', { name: /Edit 08:00 Pilates/ }).click();
  const edit = page.getByRole('dialog', { name: 'Edit activity' });
  await expect(edit.getByRole('button', { name: 'Hard' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await edit.getByRole('button', { name: 'Delete activity' }).click();
  await expect(page.getByText('Rest day')).toBeVisible();
});
