import { describe, expect, it } from 'vitest';
import { planDay, type DayPlan } from '../../src/engine/plan.ts';
import type { PlannedSession } from '../../src/engine/types.ts';
import type { Profile } from '../../src/model/index.ts';
import { maintain, session, testProfile } from './fixtures.ts';

// DOMAIN S4 meal size (D55). Test profile: breakfast 07:30 (meal-0), lunch
// 12:30 (meal-1), dinner 19:30 (meal-2), mass 75 kg.
// Ranges 500 to 600, 800 to 1200, 400 to 600: midpoints 550, 1000, 500,
// mean 2050 / 3, so size weights 550 * 3 / 2050 = 33/41, 60/41, 30/41.

const sized: Profile = {
  ...testProfile,
  usualMeals: [
    { name: 'Breakfast', time: '07:30', kcalRange: [500, 600] },
    { name: 'Lunch', time: '12:30', kcalRange: [800, 1200] },
    { name: 'Dinner', time: '19:30', kcalRange: [400, 600] },
  ],
};

function plan(profile: Profile, sessions: PlannedSession[] = []) {
  return planDay({
    date: '2026-11-05',
    profile,
    goal: maintain,
    sessions,
    nextDaySessions: [],
  });
}

function slot(r: DayPlan, id: string) {
  const s = r.slots.find((x) => x.id === id);
  if (!s) throw new Error(`no slot ${id}`);
  return s;
}

describe('meal size weights', () => {
  it('rest day: carbohydrate and fat follow the ranges, protein stays equal', () => {
    // Day: carbohydrate 225 g, protein 135 g, fat 95.1875 g (slots test).
    // Carbohydrate: 225 * w / 3 (weights sum to 3) = 75 * w
    //   breakfast 75 * 33/41 = 60.365854, lunch 75 * 60/41 = 109.756098,
    //   dinner 75 * 30/41 = 54.878049
    // Fat: 95.1875 / 3 * w = 31.729167 * w
    //   breakfast 25.538110, lunch 46.432927, dinner 23.216463
    // Protein: (135 - 26.25 bedtime) / 3 = 36.25 each
    // kcal: breakfast 4 * 60.365854 + 4 * 36.25 + 9 * 25.538110 = 616.306
    //   -> above 600; lunch 1001.921 and dinner 573.460 are in range
    const r = plan(sized);
    const expected: [string, number, number][] = [
      ['meal-0', 60.365854, 25.53811],
      ['meal-1', 109.756098, 46.432927],
      ['meal-2', 54.878049, 23.216463],
    ];
    for (const [id, carb, fat] of expected) {
      expect(slot(r, id).target.carbG).toBeCloseTo(carb, 5);
      expect(slot(r, id).target.fatG).toBeCloseTo(fat, 5);
      expect(slot(r, id).target.proteinG).toBeCloseTo(36.25, 6);
    }
    expect(slot(r, 'meal-0').target.kcal).toBeCloseTo(616.306402, 4);
    expect(slot(r, 'meal-1').targetRanges?.kcal).toEqual([800, 1200]);
    const sizeWarnings = r.warnings.filter((w) =>
      w.code.startsWith('meal-kcal-'),
    );
    expect(sizeWarnings).toEqual([
      {
        code: 'meal-kcal-above-range',
        ruleId: 'S4',
        values: { slotId: 'meal-0' },
      },
    ]);
  });

  it('keeps the 1.5 main-session weight on top of the size weight', () => {
    // Same session as the slots test "Thursday 18:00 Z4 90 min":
    // remainder 445.341324 g; lunch is last before, dinner first after.
    // Weights: 33/41, 60/41 * 1.5 = 90/41, 30/41 * 1.5 = 45/41; sum 168/41
    //   breakfast 445.341324 * 33 / 168 = 87.477760
    //   lunch     445.341324 * 90 / 168 = 238.575709
    //   dinner    445.341324 * 45 / 168 = 119.287855
    // Fat 80.315703 / 3 * w (pre slot excluded, weights sum to 3):
    //   breakfast 21.548115, lunch 39.178392, dinner 19.589196
    const r = plan(sized, [
      session({
        start: '18:00',
        sport: 'ride',
        durationMin: 90,
        intensity: { kind: 'zone', zone: 'Z4' },
        key: true,
      }),
    ]);
    expect(slot(r, 'meal-0').target.carbG).toBeCloseTo(87.47776, 5);
    expect(slot(r, 'meal-1').target.carbG).toBeCloseTo(238.575709, 5);
    expect(slot(r, 'meal-2').target.carbG).toBeCloseTo(119.287855, 5);
    expect(slot(r, 'meal-0').target.fatG).toBeCloseTo(21.548115, 5);
    expect(slot(r, 'meal-1').target.fatG).toBeCloseTo(39.178392, 5);
    expect(slot(r, 'meal-2').target.fatG).toBeCloseTo(19.589196, 5);
    expect(slot(r, 'pre-s1').target.fatG).toBe(0);
  });

  it('gives a meal without a range a weight of 1', () => {
    // Lunch 1000 and dinner 500 midpoints, mean 750: weights 4/3, 2/3;
    // breakfast has no range: 1. Sum 3, carbohydrate 75 * w:
    //   breakfast 75, lunch 100, dinner 50
    const [breakfast, lunch, dinner] = sized.usualMeals;
    if (!breakfast || !lunch || !dinner) throw new Error('fixture');
    const r = plan({
      ...sized,
      usualMeals: [
        { name: breakfast.name, time: breakfast.time },
        lunch,
        dinner,
      ],
    });
    expect(slot(r, 'meal-0').target.carbG).toBeCloseTo(75, 6);
    expect(slot(r, 'meal-1').target.carbG).toBeCloseTo(100, 6);
    expect(slot(r, 'meal-2').target.carbG).toBeCloseTo(50, 6);
    expect(slot(r, 'meal-0').targetRanges?.kcal).toBeUndefined();
  });
});
