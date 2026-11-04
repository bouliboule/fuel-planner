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
  await expect(
    page.getByRole('heading', { name: 'Your seed foods' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Done' }).click();
  await expect(page).toHaveURL(/\/fuel-planner\/today$/);
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

/** Adds a food by hand. Values are labelled test values. */
export async function addFood(
  page: Page,
  food: {
    name: string;
    per100g: [kcal: number, carb: number, protein: number, fat: number];
    tags: string;
    portion?: [min: number, max: number, step: number, usual: number];
    shopSection?: string;
  },
) {
  await page.goto('foods/new');
  await page.getByLabel('Name', { exact: true }).fill(food.name);
  const [kcal, carb, protein, fat] = food.per100g;
  await page.getByLabel('Energy (kcal)').fill(String(kcal));
  await page.getByLabel('Carbohydrate (g)').fill(String(carb));
  await page.getByLabel('Protein (g)').fill(String(protein));
  await page.getByLabel('Fat (g)', { exact: true }).fill(String(fat));
  if (food.portion) {
    const [min, max, step, usual] = food.portion;
    await page.getByLabel('Minimum (g)').fill(String(min));
    await page.getByLabel('Maximum (g)').fill(String(max));
    await page.getByLabel('Step (g)').fill(String(step));
    await page.getByLabel('Usual portion (g)').fill(String(usual));
  }
  await page.getByLabel('Tags').fill(food.tags);
  if (food.shopSection)
    await page.getByLabel('Shop section (optional)').fill(food.shopSection);
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page).toHaveURL(/\/foods$/);
}
