import { expect, test } from '@playwright/test';
import { addFood, completeFirstRun, todayParis } from './helpers.ts';

test('a food added by hand appears in the list', async ({ page }) => {
  await completeFirstRun(page);
  await page.goto('foods/new');
  await expect(page.getByRole('note')).toContainText(
    'Check these portion values',
  );
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('alert')).toHaveText(
    'Fix the highlighted fields to continue.',
  );
  await addFood(page, {
    name: 'Test rice',
    per100g: [350, 78, 7, 1],
    tags: 'meal',
  });
  await expect(page.getByRole('link', { name: /Test rice/ })).toContainText(
    '350 kcal · C 78 · P 7 · F 1 per 100 g',
  );
});

test('a CIQUAL food fills the editor with table values', async ({ page }) => {
  await completeFirstRun(page);
  await page.goto('foods/ciqual');
  await page.getByLabel('Food name (English or French)').fill('banane crue');
  await page
    .getByRole('button', { name: /^Banana, flesh without skin, raw/ })
    .click();
  await expect(page).toHaveURL(/foods\/new$/);
  // CIQUAL 2025, food "Banana, flesh without skin, raw": 87.6 kcal per 100 g.
  await expect(page.getByLabel('Energy (kcal)')).toHaveValue('87.6');
  await expect(page.getByText(/From CIQUAL 2025, food/)).toBeVisible();
  await page.getByLabel('Tags').fill('pre, on-bike');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(
    page.getByRole('link', { name: /Banana, flesh without skin, raw/ }),
  ).toBeVisible();
});

test('first run lists the seed foods and marks the added ones', async ({
  page,
}) => {
  await page.goto('./');
  // Run first run but stop at the seed foods step.
  await page.getByLabel('Sex').selectOption('male');
  await page.getByLabel('Body mass (kg)').fill('75');
  await page.getByLabel('Wake time').fill('07:00');
  await page.getByLabel('Sleep time').fill('23:00');
  const mealTimes = page.getByLabel('Time', { exact: true });
  await mealTimes.nth(0).fill('07:30');
  await mealTimes.nth(1).fill('12:30');
  await mealTimes.nth(2).fill('19:30');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Skip for now' }).click();
  await page.getByRole('button', { name: 'Start planning' }).click();

  await expect(
    page.getByRole('heading', { name: 'Your seed foods' }),
  ).toBeVisible();
  const almonds = page.getByRole('listitem').filter({ hasText: 'Almonds' });
  await almonds.getByRole('button', { name: 'Enter values' }).click();
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Almonds');
  await expect(page.getByLabel('Tags')).toHaveValue('breakfast, snack');
  // Test values from a label.
  await page.getByLabel('Energy (kcal)').fill('600');
  await page.getByLabel('Carbohydrate (g)').fill('10');
  await page.getByLabel('Protein (g)').fill('21');
  await page.getByLabel('Fat (g)', { exact: true }).fill('50');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page).toHaveURL(/foods\/seed\?firstRun=1$/);
  await expect(
    page.getByRole('listitem').filter({ hasText: 'Almonds' }),
  ).toContainText('Added');
  await page.getByRole('button', { name: 'Done' }).click();
  await expect(page).toHaveURL(/today$/);
});

test('Today plans slots with foods, swaps them and explains numbers', async ({
  page,
}) => {
  await completeFirstRun(page, { ftpW: '250' });
  // Labelled test foods.
  await addFood(page, {
    name: 'Oats',
    per100g: [370, 60, 13, 7],
    tags: 'breakfast, pre',
    portion: [0, 150, 10, 50],
  });
  await addFood(page, {
    name: 'Yogurt',
    per100g: [60, 4, 10, 0.2],
    tags: 'breakfast, bedtime, recovery',
    portion: [0, 500, 50, 150],
    shopSection: 'dairy',
  });
  await addFood(page, {
    name: 'Pasta',
    per100g: [360, 72, 13, 1.5],
    tags: 'meal',
    portion: [0, 200, 10, 100],
  });
  await addFood(page, {
    name: 'Rice',
    per100g: [350, 78, 7, 1],
    tags: 'meal',
    portion: [0, 200, 10, 100],
  });
  await addFood(page, {
    name: 'Chicken',
    per100g: [120, 0, 23, 2.5],
    tags: 'meal',
    portion: [0, 250, 25, 125],
  });
  await addFood(page, {
    name: 'Oil',
    per100g: [900, 0, 0, 100],
    tags: 'meal',
    portion: [0, 30, 5, 10],
  });
  await addFood(page, {
    name: 'Drink mix',
    per100g: [380, 95, 0, 0],
    tags: 'on-bike',
    portion: [0, 200, 5, 60],
  });

  const date = todayParis();
  await page.goto(`sessions/new?date=${date}`);
  await page.getByLabel('Start').fill('17:00');
  await page.getByLabel('Duration (min)').fill('120');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page).toHaveURL(new RegExp(`week/${date}$`));

  await page.goto('today');
  const during = page.getByRole('article', { name: '17:00 During session' });
  await expect(during).toContainText('Drink mix');
  await expect(during).toContainText('Fluid 1,200 ml');
  const dinner = page.getByRole('article', { name: /Dinner/ });
  await expect(dinner).toBeVisible();

  // Swap a dinner food and see the choice kept.
  const firstPick = dinner.getByRole('button', { expanded: false }).first();
  const before = await firstPick.textContent();
  await firstPick.click();
  await dinner.getByText(/^Swap .* for$/).waitFor();
  const alternative = dinner.locator('.flex-wrap button').first();
  const altName = (await alternative.textContent()) ?? '';
  await alternative.click();
  await expect(dinner).toContainText(altName);
  await expect(
    dinner.getByRole('button', { name: 'Back to the suggestion' }),
  ).toBeVisible();
  expect(before).not.toBe(
    await dinner.getByRole('button', { expanded: false }).first().textContent(),
  );

  // "Why" on the energy target shows the trace.
  await page.getByText('Why: kcal').click();
  await expect(
    page.getByText('How this number is calculated').first(),
  ).toBeVisible();
  await expect(page.getByText(/BMR, Mifflin-St Jeor/)).toBeVisible();

  // Shopping list for the week groups yogurt under dairy.
  await page.goto(`shopping?date=${date}`);
  await expect(page.getByRole('heading', { name: 'dairy' })).toBeVisible();
  await expect(
    page.getByRole('listitem').filter({ hasText: 'Drink mix' }),
  ).toBeVisible();
});
