import { expect, test } from '@playwright/test';
import { addFood, completeFirstRun } from './helpers.ts';

test('foods ticked, edited and added show as eaten against the target', async ({
  page,
}) => {
  await completeFirstRun(page);
  // Labelled test foods. Oats is the only breakfast food, so it is picked.
  await addFood(page, {
    name: 'Oats',
    per100g: [370, 60, 13, 7],
    tags: 'breakfast',
    portion: [0, 150, 10, 50],
  });
  await addFood(page, {
    name: 'Yogurt',
    per100g: [60, 4, 10, 0.2],
    tags: 'bedtime',
    portion: [0, 500, 50, 150],
  });
  await addFood(page, {
    name: 'Pasta',
    per100g: [360, 72, 13, 1.5],
    tags: 'meal',
    portion: [0, 200, 10, 100],
  });

  await page.goto('today');
  const breakfast = page.getByRole('article', { name: /07:30 Breakfast/ });
  await breakfast.getByRole('checkbox', { name: 'Eaten: Oats' }).check();
  await expect(
    page.getByRole('table', { name: 'Target and eaten' }),
  ).toBeVisible();

  // Edit the eaten grams to 100 g: 370 kcal, 60 g C.
  const grams = breakfast.getByLabel('Grams eaten of Oats');
  await grams.fill('100');
  await grams.blur();
  await expect(page.getByTestId('eaten-kcal')).toHaveText('370');
  await expect(page.getByTestId('eaten-carbG')).toHaveText('60');
  await expect(breakfast).toContainText('Eaten 370 kcal');

  // Unplanned: yogurt 200 g, not part of a slot: 120 kcal more, 490 in all.
  await page
    .getByLabel('Food', { exact: true })
    .selectOption({ label: 'Yogurt' });
  await page.getByLabel('Grams', { exact: true }).fill('200');
  await page.getByRole('button', { name: 'Add eaten food' }).click();
  await expect(page.getByRole('status')).toHaveText('Added to the log.');
  await expect(
    page.getByRole('heading', { name: 'Other eaten foods' }),
  ).toBeVisible();
  await expect(page.getByTestId('eaten-kcal')).toHaveText('490');

  // Unticking removes the oats entry: 120 kcal left.
  await breakfast.getByRole('checkbox', { name: 'Eaten: Oats' }).uncheck();
  await expect(page.getByTestId('eaten-kcal')).toHaveText('120');

  // The log survives a reload.
  await page.reload();
  await expect(page.getByTestId('eaten-kcal')).toHaveText('120');
});
