import type { DayPlan } from '../../engine/plan.ts';
import type { StoredFood } from '../../model/index.ts';

export interface ShoppingLine {
  food: StoredFood;
  grams: number;
  /** Whole purchase units, rounded up, when the food has one (D36). */
  units?: number;
}

export interface ShoppingSection {
  /** `undefined` for foods without a shop section. */
  name: string | undefined;
  lines: ShoppingLine[];
}

/** Picked grams per food over the days, grouped by shop section. */
export function shoppingList(
  days: readonly DayPlan[],
  foods: readonly StoredFood[],
): ShoppingSection[] {
  const byId = new Map(foods.map((f) => [f.id, f]));
  const grams = new Map<string, number>();
  for (const day of days) {
    for (const slot of day.slots) {
      for (const pick of slot.picks ?? []) {
        grams.set(pick.foodId, (grams.get(pick.foodId) ?? 0) + pick.grams);
      }
    }
  }
  const sections = new Map<string | undefined, ShoppingLine[]>();
  for (const [id, total] of grams) {
    const food = byId.get(id);
    if (!food || total <= 0) continue;
    const line: ShoppingLine = {
      food,
      grams: total,
      ...(food.purchaseUnit
        ? { units: Math.ceil(total / food.purchaseUnit.grams) }
        : {}),
    };
    const key = food.shopSection;
    sections.set(key, [...(sections.get(key) ?? []), line]);
  }
  return [...sections.entries()]
    .map(([name, lines]) => ({
      name,
      lines: lines.sort((a, b) => a.food.name.localeCompare(b.food.name)),
    }))
    .sort((a, b) =>
      a.name === undefined
        ? 1
        : b.name === undefined
          ? -1
          : a.name.localeCompare(b.name),
    );
}
