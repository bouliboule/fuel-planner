import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  FuelDatabase,
  checkImport,
  exportData,
  getFoodChoices,
  listFoods,
  saveFood,
  setFoodChoice,
} from '../../src/db/index.ts';
import type { Food } from '../../src/model/index.ts';

let db: FuelDatabase;
let counter = 0;
beforeEach(async () => {
  counter += 1;
  db = new FuelDatabase(`foods-${String(counter)}`);
  await db.open();
});
afterEach(async () => {
  db.close();
  await db.delete();
});

// Test values, not table data.
const food: Food = {
  name: 'Test oats',
  per100g: { kcal: 370, carbG: 60, proteinG: 13, fatG: 7 },
  portion: { minG: 0, maxG: 150, stepG: 10, defaultG: 50 },
  tags: ['breakfast'],
  source: 'manual',
  shopSection: 'cereals',
  purchaseUnit: { name: 'bag', grams: 500 },
};

describe('foods', () => {
  it('saves, lists by name and rejects invalid values', async () => {
    await saveFood(db, { ...food, name: 'B' });
    await saveFood(db, { ...food, name: 'A' });
    expect((await listFoods(db)).map((f) => f.name)).toEqual(['A', 'B']);
    await expect(
      saveFood(db, { ...food, per100g: { ...food.per100g, kcal: -1 } }),
    ).rejects.toThrow();
  });

  it('stores swap choices per date and slot', async () => {
    await setFoodChoice(db, '2026-11-08', 'during-s1', ['a', 'b']);
    await setFoodChoice(db, '2026-11-08', 'meal-0', ['c']);
    expect(await getFoodChoices(db, '2026-11-08')).toEqual({
      'during-s1': ['a', 'b'],
      'meal-0': ['c'],
    });
    await setFoodChoice(db, '2026-11-08', 'during-s1', undefined);
    expect(await getFoodChoices(db, '2026-11-08')).toEqual({ 'meal-0': ['c'] });
    expect(await db.plans.count()).toBe(1);
  });

  it('exports and validates foods and choices', async () => {
    await saveFood(db, food);
    await setFoodChoice(db, '2026-11-08', 'meal-0', ['x']);
    const check = checkImport(JSON.stringify(await exportData(db)));
    expect(check.ok && check.counts.foods).toBe(1);
    expect(check.ok && check.counts.plans).toBe(1);
  });
});
