import { describe, expect, it } from 'vitest';
import {
  candidateFoods,
  objective,
  pickFoods,
  solvePortions,
} from '../../src/engine/portions.ts';
import {
  almonds,
  banana,
  drinkMix,
  oats,
  pasta,
  proteinPowder,
  testFoods,
  yogurt,
} from './foods.ts';

const macros = (
  kcal: number,
  carbG: number,
  proteinG: number,
  fatG: number,
) => ({
  kcal,
  carbG,
  proteinG,
  fatG,
});

describe('S5 objective', () => {
  it('is 0 at the target', () => {
    expect(objective(macros(190, 47.5, 0, 0), macros(190, 47.5, 0, 0))).toBe(0);
  });

  it('sums squared deviations in kcal relative to the slot kcal', () => {
    // target 240 kcal, 60 C; achieved 247 kcal, 61.75 C:
    // kcal (247 - 240) / 240 = 0.0291667; carb 4 * 1.75 / 240 = 0.0291667
    // 2 * 0.0291667^2 = 0.00170139
    expect(
      objective(macros(247, 61.75, 0, 0), macros(240, 60, 0, 0)),
    ).toBeCloseTo(0.00170139, 7);
  });
});

describe('S5 solvePortions', () => {
  it('rounds to the step that fits best', () => {
    // during slot: 60 g C, 240 kcal. Drink mix 380 kcal, 95 C per 100 g.
    // continuous optimum 60 / 0.95 = 63.16 g; steps of 5 g: 60 or 65.
    // 65 g: 247 kcal, 61.75 C -> objective 0.00170139
    // 60 g: 228 kcal, 57 C -> (-12/240)^2 * 2 = 0.005 -> 65 g wins
    const r = solvePortions([{ food: drinkMix }], macros(240, 60, 0, 0));
    expect(r.picks).toEqual([{ foodId: 'drink-mix', grams: 65 }]);
    expect(r.achieved.kcal).toBeCloseTo(247, 6);
    expect(r.achieved.carbG).toBeCloseTo(61.75, 6);
    expect(r.withinTolerance).toBe(true);
    expect(r.gap.kcal).toBeCloseTo(-7, 6);
    expect(r.gap.carbG).toBeCloseTo(-1.75, 6);
  });

  it('stops at the maximum portion and reports the gap', () => {
    // 300 g C wanted; drink mix capped at 200 g -> 190 g C, 760 kcal.
    // carb 190 is outside 300 +/- 30 -> not within tolerance; gap 110 g C
    const r = solvePortions([{ food: drinkMix }], macros(1200, 300, 0, 0));
    expect(r.picks).toEqual([{ foodId: 'drink-mix', grams: 200 }]);
    expect(r.withinTolerance).toBe(false);
    expect(r.gap.carbG).toBeCloseTo(110, 6);
  });

  it('finds an exact two-food combination', () => {
    // oats 50 g: 185 kcal, 30 C, 6.5 P, 3.5 F
    // yogurt 100 g: 60 kcal, 4 C, 10 P, 0.2 F
    // target = sum: 245 kcal, 34 C, 16.5 P, 3.7 F
    const r = solvePortions(
      [{ food: oats }, { food: yogurt }],
      macros(245, 34, 16.5, 3.7),
    );
    expect(r.picks).toEqual([
      { foodId: 'oats', grams: 50 },
      { foodId: 'yogurt', grams: 100 },
    ]);
    expect(r.objective).toBeCloseTo(0, 12);
  });

  it('keeps fixed items at their grams', () => {
    // protein powder fixed at 30 g: 114 kcal, 1.5 C, 24 P, 1.8 F.
    // banana fills carbohydrate: 120 g steps; 120 g adds 108 kcal, 24 C.
    // target 222 kcal, 25.5 C, 25.2 P, 2.16 F = powder 30 g + banana 120 g
    const r = solvePortions(
      [{ food: proteinPowder, fixedG: 30 }, { food: banana }],
      macros(222, 25.5, 25.2, 2.16),
    );
    expect(r.picks).toEqual([
      { foodId: 'protein', grams: 30 },
      { foodId: 'banana', grams: 120 },
    ]);
  });

  it('treats a zero target as met at 10 % of slot kcal or less', () => {
    // pre slot: 150 g C, 600 kcal, no protein or fat target.
    // oats 150 g (max): 555 kcal, 90 C, 19.5 P, 10.5 F.
    // carbohydrate 90 is outside 150 +/- 15, and protein 4 * 19.5 = 78 kcal
    // is over 60 (10 % of 600 kcal) for a zero target -> outside tolerance
    expect(
      solvePortions([{ food: oats }], macros(600, 150, 0, 0)).gap.proteinG,
    ).toBeCloseTo(-19.5, 6);
    const r = solvePortions([{ food: oats }], macros(600, 150, 0, 0));
    expect(r.picks).toEqual([{ foodId: 'oats', grams: 150 }]);
    expect(r.withinTolerance).toBe(false);
  });
});

describe('S5 candidates', () => {
  it('uses the meal name tag, then meal', () => {
    expect(
      candidateFoods({ kind: 'meal', name: 'Breakfast' }, testFoods).map(
        (f) => f.id,
      ),
    ).toEqual(['almonds', 'oats', 'yogurt']);
    expect(
      candidateFoods({ kind: 'meal', name: 'Dinner' }, testFoods).map(
        (f) => f.id,
      ),
    ).toEqual(['chicken', 'oil', 'pasta']);
  });

  it('maps fueling slots to their tags and drops disliked foods', () => {
    expect(
      candidateFoods({ kind: 'during' }, testFoods).map((f) => f.id),
    ).toEqual(['banana', 'drink-mix']);
    expect(
      candidateFoods({ kind: 'recovery' }, testFoods, {
        dislikedFoodIds: ['yogurt'],
        dislikedTags: [],
      }).map((f) => f.id),
    ).toEqual(['banana', 'protein']);
    expect(
      candidateFoods({ kind: 'pre' }, testFoods, {
        dislikedFoodIds: [],
        dislikedTags: ['pre'],
      }),
    ).toEqual([]);
  });
});

describe('S5 pickFoods', () => {
  it('finds the best combination of candidates', () => {
    // breakfast candidates almonds, oats, yogurt; target is exactly
    // oats 50 g + yogurt 100 g (see above), so that pair wins with objective 0
    const r = pickFoods({
      slot: { kind: 'meal', name: 'Breakfast' },
      target: macros(245, 34, 16.5, 3.7),
      foods: testFoods,
      templates: [],
    });
    expect(r.picks).toEqual([
      { foodId: 'oats', grams: 50 },
      { foodId: 'yogurt', grams: 100 },
    ]);
    expect(r.source).toBe('search');
  });

  it('uses a matching meal template first', () => {
    const r = pickFoods({
      slot: { kind: 'recovery' },
      target: macros(222, 25.5, 25.2, 2.16),
      foods: testFoods,
      templates: [
        {
          name: 'Shake',
          slotKinds: ['recovery'],
          items: [
            { foodId: 'protein', fixedG: 30, scalable: false },
            { foodId: 'banana', scalable: true },
          ],
        },
      ],
    });
    expect(r.source).toBe('template');
    expect(r.picks).toEqual([
      { foodId: 'protein', grams: 30 },
      { foodId: 'banana', grams: 120 },
    ]);
  });

  it('solves only the chosen foods after a swap', () => {
    const r = pickFoods({
      slot: { kind: 'meal', name: 'Breakfast' },
      target: macros(245, 34, 16.5, 3.7),
      foods: testFoods,
      templates: [],
      choice: ['almonds'],
    });
    expect(r.source).toBe('choice');
    expect(r.picks.map((p) => p.foodId)).toEqual(['almonds']);
  });

  it('has no picks and the full gap without candidates', () => {
    const target = macros(105, 0, 26.25, 0);
    const r = pickFoods({
      slot: { kind: 'bedtime' },
      target,
      foods: [pasta, almonds],
      templates: [],
    });
    expect(r.picks).toEqual([]);
    expect(r.gap).toEqual(target);
    expect(r.withinTolerance).toBe(false);
  });

  it('returns no picks for a slot without energy', () => {
    const r = pickFoods({
      slot: { kind: 'during' },
      target: macros(0, 0, 0, 0),
      foods: testFoods,
      templates: [],
    });
    expect(r.picks).toEqual([]);
    expect(r.withinTolerance).toBe(true);
  });
});
