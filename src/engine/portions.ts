// Portion solving (docs/DOMAIN.md section 5, rule ID S5): picks foods for a
// slot and solves their grams against the slot targets.

import {
  KCAL_PER_G_CARB,
  KCAL_PER_G_FAT,
  KCAL_PER_G_PROTEIN,
  PORTION_MAX_CANDIDATES,
  PORTION_MAX_FOODS,
  PORTION_TOLERANCE_FRACTION,
} from './constants.ts';
import type { Macros, SlotKind } from './slots.ts';

export interface SolverFood {
  id: string;
  name: string;
  per100g: { kcal: number; carbG: number; proteinG: number; fatG: number };
  portion: { minG: number; maxG: number; stepG: number; defaultG: number };
  tags: readonly string[];
}

export interface SolverTemplate {
  name: string;
  slotKinds: readonly SlotKind[];
  items: readonly {
    foodId: string;
    fixedG?: number | undefined;
    scalable: boolean;
  }[];
}

export interface PortionItem {
  food: SolverFood;
  /** Grams for an item that is not solved. */
  fixedG?: number | undefined;
}

export interface Pick {
  foodId: string;
  grams: number;
}

export interface PortionResult {
  picks: Pick[];
  achieved: Macros;
  /** target - achieved */
  gap: Macros;
  withinTolerance: boolean;
  objective: number;
}

const ZERO: Macros = { kcal: 0, carbG: 0, proteinG: 0, fatG: 0 };

/** Array element that the caller knows exists. */
function at<T>(items: readonly T[], i: number): T {
  const item = items[i];
  if (item === undefined) throw new Error(`no item at ${String(i)}`);
  return item;
}

function add(a: Macros, food: SolverFood, grams: number): Macros {
  const f = grams / 100;
  return {
    kcal: a.kcal + food.per100g.kcal * f,
    carbG: a.carbG + food.per100g.carbG * f,
    proteinG: a.proteinG + food.per100g.proteinG * f,
    fatG: a.fatG + food.per100g.fatG * f,
  };
}

/** Each term in kcal, relative to the slot kcal target. */
function residuals(
  achieved: Macros,
  target: Macros,
): [number, number, number, number] {
  const t = target.kcal;
  return [
    (achieved.kcal - target.kcal) / t,
    (KCAL_PER_G_CARB * (achieved.carbG - target.carbG)) / t,
    (KCAL_PER_G_PROTEIN * (achieved.proteinG - target.proteinG)) / t,
    (KCAL_PER_G_FAT * (achieved.fatG - target.fatG)) / t,
  ];
}

/** S5 objective: sum of squared kcal-unit deviations relative to slot kcal. */
export function objective(achieved: Macros, target: Macros): number {
  if (target.kcal <= 0) return 0;
  return residuals(achieved, target).reduce((sum, r) => sum + r * r, 0);
}

/** S5 tolerance: kcal, carbohydrate and protein within 10 %. */
export function withinTolerance(achieved: Macros, target: Macros): boolean {
  if (target.kcal <= 0) return achieved.kcal <= 0;
  const tol = PORTION_TOLERANCE_FRACTION;
  const ok = (got: number, want: number, kcalPerG: number) =>
    want > 0
      ? Math.abs(got - want) <= tol * want
      : kcalPerG * got <= tol * target.kcal;
  return (
    Math.abs(achieved.kcal - target.kcal) <= tol * target.kcal &&
    ok(achieved.carbG, target.carbG, KCAL_PER_G_CARB) &&
    ok(achieved.proteinG, target.proteinG, KCAL_PER_G_PROTEIN)
  );
}

/** Allowed grams: multiples of the step between min and max. */
function steps(food: SolverFood): {
  first: number;
  last: number;
  step: number;
} {
  const step = food.portion.stepG;
  return {
    first: Math.ceil(food.portion.minG / step) * step,
    last: Math.floor(food.portion.maxG / step) * step,
    step,
  };
}

function result(
  items: readonly PortionItem[],
  grams: readonly number[],
  target: Macros,
): PortionResult {
  let achieved = ZERO;
  const picks: Pick[] = [];
  items.forEach((item, i) => {
    const g = grams[i] ?? 0;
    if (g <= 0) return;
    achieved = add(achieved, item.food, g);
    picks.push({ foodId: item.food.id, grams: g });
  });
  return {
    picks,
    achieved,
    gap: {
      kcal: target.kcal - achieved.kcal,
      carbG: target.carbG - achieved.carbG,
      proteinG: target.proteinG - achieved.proteinG,
      fatG: target.fatG - achieved.fatG,
    },
    withinTolerance: withinTolerance(achieved, target),
    objective: objective(achieved, target),
  };
}

const MAX_PASSES = 50;

/**
 * Solves grams for the items: coordinate descent, where each food moves to
 * its least-squares optimum rounded to a step, then single and paired step
 * moves until nothing improves.
 */
export function solvePortions(
  items: readonly PortionItem[],
  target: Macros,
): PortionResult {
  const n = items.length;
  const grams = items.map((it) => it.fixedG ?? steps(it.food).first);
  if (target.kcal <= 0 || n === 0) return result(items, grams, target);

  const free = items.flatMap((it, i) => (it.fixedG === undefined ? [i] : []));
  const total = () => {
    let m = ZERO;
    items.forEach((it, i) => {
      m = add(m, it.food, grams[i] ?? 0);
    });
    return m;
  };
  const score = () => objective(total(), target);
  const clampStep = (i: number, g: number) => {
    const { first, last, step } = steps(at(items, i).food);
    return Math.min(last, Math.max(first, Math.round(g / step) * step));
  };

  let best = score();
  for (let pass = 0; pass < MAX_PASSES; pass++) {
    let improved = false;
    for (const i of free) {
      const food = at(items, i).food;
      // Residuals without this food are linear in its grams: r + b * g.
      grams[i] = 0;
      const r = residuals(total(), target);
      const t = target.kcal;
      const b = [
        food.per100g.kcal / 100 / t,
        (KCAL_PER_G_CARB * food.per100g.carbG) / 100 / t,
        (KCAL_PER_G_PROTEIN * food.per100g.proteinG) / 100 / t,
        (KCAL_PER_G_FAT * food.per100g.fatG) / 100 / t,
      ];
      const bb = b.reduce((s, x) => s + x * x, 0);
      const optimum =
        bb > 0 ? -r.reduce((s, x, j) => s + x * (b[j] ?? 0), 0) / bb : 0;
      const { step } = steps(food);
      const options = new Set([
        clampStep(i, Math.floor(optimum / step) * step),
        clampStep(i, Math.ceil(optimum / step) * step),
      ]);
      let choice = clampStep(i, optimum);
      let choiceScore = Infinity;
      for (const g of options) {
        grams[i] = g;
        const s = score();
        if (s < choiceScore) {
          choiceScore = s;
          choice = g;
        }
      }
      grams[i] = choice;
      if (choiceScore < best - 1e-12) {
        best = choiceScore;
        improved = true;
      }
    }
    // Paired step moves get out of points where one food alone cannot move.
    for (const i of free) {
      for (const j of free) {
        if (j <= i) continue;
        for (const di of [-1, 1]) {
          for (const dj of [-1, 0, 1]) {
            const gi = at(grams, i);
            const gj = at(grams, j);
            const si = steps(at(items, i).food);
            const sj = steps(at(items, j).food);
            const ni = gi + di * si.step;
            const nj = gj + dj * sj.step;
            if (ni < si.first || ni > si.last || nj < sj.first || nj > sj.last)
              continue;
            grams[i] = ni;
            grams[j] = nj;
            const s = score();
            if (s < best - 1e-12) {
              best = s;
              improved = true;
            } else {
              grams[i] = gi;
              grams[j] = gj;
            }
          }
        }
      }
    }
    if (!improved) break;
  }
  return result(items, grams, target);
}

const SLOT_TAGS: Readonly<Record<Exclude<SlotKind, 'meal'>, string>> = {
  pre: 'pre',
  'pre-snack': 'pre',
  during: 'on-bike',
  recovery: 'recovery',
  bedtime: 'bedtime',
  snack: 'snack',
};

/** S5: foods a slot may use, in name order, without disliked foods. */
export function candidateFoods(
  slot: { kind: SlotKind; name?: string | undefined },
  foods: readonly SolverFood[],
  dislikes: {
    dislikedFoodIds: readonly string[];
    dislikedTags: readonly string[];
  } = {
    dislikedFoodIds: [],
    dislikedTags: [],
  },
): SolverFood[] {
  const allowed = foods
    .filter(
      (f) =>
        !dislikes.dislikedFoodIds.includes(f.id) &&
        !f.tags.some((tag) => dislikes.dislikedTags.includes(tag)),
    )
    .sort((a, b) => a.name.localeCompare(b.name));
  const tagged = (tag: string) => allowed.filter((f) => f.tags.includes(tag));
  if (slot.kind === 'meal') {
    const own = slot.name ? tagged(slot.name.toLowerCase()) : [];
    return own.length > 0 ? own : tagged('meal');
  }
  return tagged(SLOT_TAGS[slot.kind]);
}

function* combinations<T>(
  items: readonly T[],
  size: number,
  start = 0,
): Generator<T[]> {
  if (size === 0) {
    yield [];
    return;
  }
  for (let i = start; i <= items.length - size; i++) {
    for (const rest of combinations(items, size - 1, i + 1))
      yield [at(items, i), ...rest];
  }
}

export interface PickResult extends PortionResult {
  source: 'template' | 'search' | 'choice' | 'none';
  /** Foods in the solved set, including ones solved to 0 g. */
  foodIds: string[];
}

/**
 * S5: the foods and grams for one slot. A user choice (swap) wins, then the
 * first matching meal template by name, then the best combination of 1 to 4
 * candidates from at most 12.
 */
export function pickFoods(input: {
  slot: { kind: SlotKind; name?: string | undefined };
  target: Macros;
  foods: readonly SolverFood[];
  templates: readonly SolverTemplate[];
  choice?: readonly string[] | undefined;
  dislikes?: {
    dislikedFoodIds: readonly string[];
    dislikedTags: readonly string[];
  };
}): PickResult {
  const { slot, target, foods } = input;
  const byId = new Map(foods.map((f) => [f.id, f]));
  const empty = (source: PickResult['source']): PickResult => ({
    ...result([], [], target),
    source,
    foodIds: [],
  });
  if (target.kcal <= 0) return { ...empty('none'), withinTolerance: true };

  if (input.choice && input.choice.length > 0) {
    const items = input.choice.flatMap((id) => {
      const food = byId.get(id);
      return food ? [{ food }] : [];
    });
    if (items.length > 0) {
      return {
        ...solvePortions(items, target),
        source: 'choice',
        foodIds: items.map((i) => i.food.id),
      };
    }
  }

  const template = [...input.templates]
    .sort((a, b) => a.name.localeCompare(b.name))
    .find(
      (t) =>
        t.slotKinds.includes(slot.kind) &&
        t.items.every((it) => byId.has(it.foodId)),
    );
  if (template) {
    const items = template.items.flatMap((it) => {
      const food = byId.get(it.foodId);
      if (!food) return [];
      const fixedG = it.scalable
        ? undefined
        : (it.fixedG ?? food.portion.defaultG);
      return [{ food, fixedG }];
    });
    return {
      ...solvePortions(items, target),
      source: 'template',
      foodIds: items.map((i) => i.food.id),
    };
  }

  const candidates = candidateFoods(slot, foods, input.dislikes).slice(
    0,
    PORTION_MAX_CANDIDATES,
  );
  let best: PickResult | undefined;
  for (
    let size = 1;
    size <= Math.min(PORTION_MAX_FOODS, candidates.length);
    size++
  ) {
    for (const set of combinations(candidates, size)) {
      const r = solvePortions(
        set.map((food) => ({ food })),
        target,
      );
      if (!best || r.objective < best.objective - 1e-12) {
        best = { ...r, source: 'search', foodIds: set.map((f) => f.id) };
      }
    }
  }
  return best ?? empty('none');
}
