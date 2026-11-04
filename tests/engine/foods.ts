import type { SolverFood } from '../../src/engine/portions.ts';

// Labelled test foods. Nutrition values are round test numbers, not data
// from a food table; they only make the arithmetic easy to check.
function food(
  id: string,
  per100g: [kcal: number, carbG: number, proteinG: number, fatG: number],
  portion: [minG: number, maxG: number, stepG: number],
  tags: string[],
): SolverFood {
  const [kcal, carbG, proteinG, fatG] = per100g;
  const [minG, maxG, stepG] = portion;
  return {
    id,
    name: id,
    per100g: { kcal, carbG, proteinG, fatG },
    portion: { minG, maxG, stepG, defaultG: stepG },
    tags,
  };
}

export const oats = food(
  'oats',
  [370, 60, 13, 7],
  [0, 150, 10],
  ['breakfast', 'pre'],
);
export const yogurt = food(
  'yogurt',
  [60, 4, 10, 0.2],
  [0, 500, 50],
  ['breakfast', 'bedtime', 'recovery'],
);
export const almonds = food(
  'almonds',
  [600, 10, 20, 50],
  [0, 50, 5],
  ['breakfast', 'snack'],
);
export const banana = food(
  'banana',
  [90, 20, 1, 0.3],
  [0, 360, 120],
  ['pre', 'recovery', 'on-bike'],
);
export const drinkMix = food(
  'drink-mix',
  [380, 95, 0, 0],
  [0, 200, 5],
  ['on-bike'],
);
export const proteinPowder = food(
  'protein',
  [380, 5, 80, 6],
  [0, 60, 30],
  ['recovery'],
);
export const pasta = food('pasta', [360, 72, 13, 1.5], [0, 200, 10], ['meal']);
export const chicken = food(
  'chicken',
  [120, 0, 23, 2.5],
  [0, 250, 25],
  ['meal'],
);
export const oil = food('oil', [900, 0, 0, 100], [0, 30, 5], ['meal']);

export const testFoods: SolverFood[] = [
  oats,
  yogurt,
  almonds,
  banana,
  drinkMix,
  proteinPowder,
  pasta,
  chicken,
  oil,
];
