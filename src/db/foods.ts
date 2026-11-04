import {
  foodSchema,
  mealTemplateSchema,
  type Food,
  type MealTemplate,
  type RecordMeta,
  type StoredFood,
  type StoredMealTemplate,
} from '../model/index.ts';
import type { FuelDatabase } from './database.ts';
import { withMeta } from './repositories.ts';

export async function listFoods(db: FuelDatabase): Promise<StoredFood[]> {
  const rows = await db.foods.toArray();
  return rows.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getFood(db: FuelDatabase, id: string) {
  return db.foods.get(id);
}

export async function saveFood(
  db: FuelDatabase,
  food: Food,
  existing?: RecordMeta,
): Promise<StoredFood> {
  const record = withMeta(foodSchema.parse(food), existing);
  await db.foods.put(record);
  return record;
}

export async function deleteFood(db: FuelDatabase, id: string): Promise<void> {
  await db.foods.delete(id);
}

export async function listMealTemplates(
  db: FuelDatabase,
): Promise<StoredMealTemplate[]> {
  const rows = await db.mealTemplates.toArray();
  return rows.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getMealTemplate(db: FuelDatabase, id: string) {
  return db.mealTemplates.get(id);
}

export async function saveMealTemplate(
  db: FuelDatabase,
  template: MealTemplate,
  existing?: RecordMeta,
): Promise<StoredMealTemplate> {
  const record = withMeta(mealTemplateSchema.parse(template), existing);
  await db.mealTemplates.put(record);
  return record;
}

export async function deleteMealTemplate(
  db: FuelDatabase,
  id: string,
): Promise<void> {
  await db.mealTemplates.delete(id);
}

/** Swaps for a date: slot id to chosen food ids (D34). */
export async function getFoodChoices(
  db: FuelDatabase,
  date: string,
): Promise<Record<string, string[]>> {
  return (await db.plans.where('date').equals(date).first())?.foodChoices ?? {};
}

export async function getFoodChoicesBetween(
  db: FuelDatabase,
  from: string,
  to: string,
): Promise<Record<string, Record<string, string[]>>> {
  const rows = await db.plans
    .where('date')
    .between(from, to, true, true)
    .toArray();
  return Object.fromEntries(rows.map((r) => [r.date, r.foodChoices ?? {}]));
}

/** Sets or clears (`undefined`) the chosen foods of one slot. */
export async function setFoodChoice(
  db: FuelDatabase,
  date: string,
  slotId: string,
  foodIds: string[] | undefined,
): Promise<void> {
  await db.transaction('rw', db.plans, async () => {
    const existing = await db.plans.where('date').equals(date).first();
    const others = Object.entries(existing?.foodChoices ?? {}).filter(
      ([id]) => id !== slotId,
    );
    const choices = Object.fromEntries(
      foodIds ? [...others, [slotId, foodIds]] : others,
    );
    await db.plans.put(withMeta({ date, foodChoices: choices }, existing));
  });
}
