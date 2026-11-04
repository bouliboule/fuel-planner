import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { completeFirstRun } from './helpers.ts';

test('first run requires the missing profile values', async ({ page }) => {
  await page.goto('./');
  await expect(page).toHaveURL(/welcome$/);
  // Seed values are prefilled.
  await expect(page.getByLabel('Birth year')).toHaveValue('1989');
  await expect(page.getByLabel('Height (cm)')).toHaveValue('181');
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('alert')).toHaveText(
    'Fix the highlighted fields to continue.',
  );
  await expect(page.getByLabel('Body mass (kg)')).toHaveAttribute(
    'aria-invalid',
    'true',
  );
});

test('first run data survives a reload', async ({ page }) => {
  await completeFirstRun(page);
  await page.reload();
  await expect(page).toHaveURL(/day$/);
  await page.goto('profile/details');
  await expect(page.getByText('Body mass: 75 kg')).toBeVisible();
  await expect(page.getByLabel('Wake time')).toHaveValue('07:00');
});

test('coefficients outside their range are blocked', async ({ page }) => {
  await completeFirstRun(page);
  await page.goto('profile/coefficients');
  const nea = page.getByLabel('Non-exercise activity factor');
  await expect(nea).toHaveValue('1.35');
  await nea.fill('1.6');
  await expect(
    page.getByText('Allowed range: 1.2 to 1.5.', { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save' })).toBeDisabled();
  await nea.fill('1.4');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('status')).toHaveText('Saved.');
});

test('a body mass entry updates the profile mass', async ({ page }) => {
  await completeFirstRun(page);
  await page.goto('profile/body-mass');
  await page.getByLabel('Date').fill('2099-01-01');
  await page.getByLabel('Mass (kg)').fill('73,6');
  await page.getByRole('button', { name: 'Add entry' }).click();
  await expect(page.getByText('2099-01-01 · 73.6 kg')).toBeVisible();
  await expect(
    page.getByRole('img', { name: /Body mass trend/ }),
  ).toBeVisible();
  await page.goto('profile/details');
  await expect(page.getByText('Body mass: 73.6 kg')).toBeVisible();
});

test('changing the goal to lose sets protein to 2.0 g/kg', async ({ page }) => {
  await completeFirstRun(page);
  await page.goto('profile/goal');
  await page.getByLabel('Goal', { exact: true }).selectOption('lose');
  await page.getByLabel('Rate (kg per week)').fill('0.3');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('status')).toHaveText('Saved.');
  await page.goto('profile/coefficients');
  await expect(page.getByLabel('Protein (g/kg/day)')).toHaveValue('2');
});

test('export then import restores data in a fresh browser', async ({
  page,
  browser,
}) => {
  await completeFirstRun(page, { massKg: '71.5' });
  await page.goto('profile/data');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export data' }).click();
  const file = await (await download).path();
  const text = await readFile(file, 'utf8');
  expect(JSON.parse(text)).toMatchObject({
    app: 'fuel-planner',
    schemaVersion: 2,
  });

  const fresh = await browser.newContext();
  const other = await fresh.newPage();
  await other.goto('./');
  await expect(other).toHaveURL(/welcome$/);
  await other
    .getByRole('button', { name: 'Restore from a backup instead' })
    .click();
  await other.getByLabel('Import a backup').setInputFiles(file);
  await expect(
    other.getByText(/This file has 1 profile, 1 goals, 1 body mass entries/),
  ).toBeVisible();
  await other.getByRole('button', { name: 'Replace my data' }).click();
  await expect(other).toHaveURL(/day$/);
  await other.goto('profile/details');
  await expect(other.getByText('Body mass: 71.5 kg')).toBeVisible();
  await fresh.close();
});
