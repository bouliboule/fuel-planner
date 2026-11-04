// Logged intake (M6, D38): totals of eaten foods from their per-100 g values.

import type { SolverFood } from './portions.ts';
import type { Macros } from './slots.ts';

export interface IntakeEntry {
  foodId: string;
  grams: number;
  slotId?: string | undefined;
}

type FoodValues = Pick<SolverFood, 'id' | 'per100g'>;

const ZERO: Macros = { kcal: 0, carbG: 0, proteinG: 0, fatG: 0 };

function add(total: Macros, food: FoodValues, grams: number): Macros {
  const f = grams / 100;
  return {
    kcal: total.kcal + food.per100g.kcal * f,
    carbG: total.carbG + food.per100g.carbG * f,
    proteinG: total.proteinG + food.per100g.proteinG * f,
    fatG: total.fatG + food.per100g.fatG * f,
  };
}

/** Sum of the entries; entries whose food no longer exists are listed. */
export function intakeTotals(
  entries: readonly IntakeEntry[],
  foods: readonly FoodValues[],
): { totals: Macros; missingFoodIds: string[] } {
  const byId = new Map(foods.map((f) => [f.id, f]));
  let totals = ZERO;
  const missing = new Set<string>();
  for (const e of entries) {
    const food = byId.get(e.foodId);
    if (food) totals = add(totals, food, e.grams);
    else missing.add(e.foodId);
  }
  return { totals, missingFoodIds: [...missing] };
}

/** Totals per slot id; entries without a slot are under `undefined`. */
export function intakeBySlot(
  entries: readonly IntakeEntry[],
  foods: readonly FoodValues[],
): Map<string | undefined, Macros> {
  const groups = new Map<string | undefined, IntakeEntry[]>();
  for (const e of entries)
    groups.set(e.slotId, [...(groups.get(e.slotId) ?? []), e]);
  return new Map(
    [...groups].map(([slotId, list]) => [
      slotId,
      intakeTotals(list, foods).totals,
    ]),
  );
}
