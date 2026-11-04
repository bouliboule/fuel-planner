import { expect, test } from '@playwright/test';
import {
  completeFirstRun,
  todayParis,
  waitForServiceWorker,
} from './helpers.ts';

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

test('skip breakfast drops it on a rest day and keeps it for a morning ride', async ({
  page,
}) => {
  await completeFirstRun(page);
  await page.getByRole('link', { name: 'Profile' }).click();
  await page
    .getByLabel('Skip Breakfast when no morning session needs fueling')
    .check();
  await page.getByRole('link', { name: /Back/ }).click();

  await page.getByRole('button', { name: 'Tomorrow' }).click();
  const cards = page.getByTestId('meal-card');
  await expect(cards.filter({ hasText: 'Lunch' })).toBeVisible();
  await expect(cards.filter({ hasText: 'Breakfast' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Add activity' }).click();
  const sheet = page.getByRole('dialog', { name: 'Add activity' });
  await sheet.getByLabel('Start').fill('09:00');
  await sheet.getByRole('button', { name: '240 min' }).click();
  await sheet.getByRole('button', { name: 'Save activity' }).click();
  await expect(cards.filter({ hasText: 'Breakfast' })).toContainText(
    'Pre-workout',
  );
});

test('a hard ride after a hard ride warns until the profile allows it', async ({
  page,
}) => {
  await completeFirstRun(page, { ftpW: '250' });
  const tomorrow = page.getByRole('button', { name: 'Tomorrow' });
  const addRide = async (zone: string) => {
    await page.getByRole('button', { name: 'Add activity' }).click();
    const sheet = page.getByRole('dialog', { name: 'Add activity' });
    await sheet.getByLabel('Start').fill('18:00');
    await sheet.getByRole('button', { name: '90 min' }).click();
    await sheet.getByRole('button', { name: zone }).click();
    return sheet;
  };

  await page.getByRole('button', { name: 'Today' }).click();
  await (
    await addRide('Z4 threshold')
  )
    .getByRole('button', { name: 'Save activity' })
    .click();

  await tomorrow.click();
  const sheet = await addRide('Z5 VO2max');
  await expect(sheet.getByTestId('back-to-back')).toContainText(
    'Hard ride the day before too',
  );
  await sheet.getByRole('button', { name: 'Save activity' }).click();
  await expect(page.getByText('Hard ride the day before too')).toBeVisible();
  await expect(page.getByText('Hard', { exact: true })).toBeVisible();

  await page.getByRole('link', { name: 'Profile' }).click();
  await page.getByLabel('Allow back-to-back hard rides').check();
  await page.getByRole('link', { name: /Back/ }).click();
  await tomorrow.click();
  await expect(page.getByText('Hard ride the day before too')).toBeHidden();
});

test('an easy run next to an intervals run does not warn', async ({ page }) => {
  await completeFirstRun(page);
  const addRun = async (type: string) => {
    await page.getByRole('button', { name: 'Add activity' }).click();
    const sheet = page.getByRole('dialog', { name: 'Add activity' });
    await sheet.getByRole('button', { name: 'Run' }).click();
    await sheet.getByLabel('Start').fill('07:00');
    await sheet.getByRole('button', { name: '45 min' }).click();
    await sheet.getByLabel('Expected pace (min:sec per km)').fill('5:00');
    await sheet.getByRole('button', { name: type }).click();
    return sheet;
  };
  await page.getByRole('button', { name: 'Today' }).click();
  await (
    await addRun('Intervals')
  )
    .getByRole('button', { name: 'Save activity' })
    .click();
  await page.getByRole('button', { name: 'Tomorrow' }).click();
  const easy = await addRun('Easy');
  await expect(easy.getByTestId('back-to-back')).toBeEmpty();
  await easy.getByRole('button', { name: 'Hard long' }).click();
  await expect(easy.getByTestId('back-to-back')).toContainText(
    'Hard run the day before too',
  );
});

test('the calendar shows activities and opens a day', async ({ page }) => {
  await completeFirstRun(page);
  await page.getByRole('button', { name: 'Today' }).click();
  await page.getByRole('button', { name: 'Add activity' }).click();
  const sheet = page.getByRole('dialog', { name: 'Add activity' });
  await sheet.getByLabel('Start').fill('09:00');
  await sheet.getByRole('button', { name: '60 min' }).click();
  await sheet.getByRole('button', { name: 'Save activity' }).click();

  await page.getByRole('link', { name: 'Calendar' }).click();
  await expect(page).toHaveURL(/\/calendar$/);
  await expect(page.getByTestId('calendar-summary')).toContainText('1 × Ride');

  const today = todayParis();
  await page.getByRole('link', { name: `Open ${today}` }).click();
  await expect(page).toHaveURL(new RegExp(`/day/${today}$`));
  await expect(page.getByText(/09:00 Ride/)).toBeVisible();

  await page.getByRole('link', { name: 'Next day' }).click();
  await expect(page.getByText('Rest day')).toBeVisible();

  await page.goto('calendar?month=2026-01');
  await expect(page.getByTestId('calendar-month')).toHaveText('January 2026');
});
