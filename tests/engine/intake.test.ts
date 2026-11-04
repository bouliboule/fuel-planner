import { describe, expect, it } from 'vitest';
import { intakeBySlot, intakeTotals } from '../../src/engine/intake.ts';
import { oats, yogurt } from './foods.ts';

// Test foods (labelled test values): oats 370 kcal, 60 C, 13 P, 7 F per
// 100 g; yogurt 60 kcal, 4 C, 10 P, 0.2 F per 100 g.
const entries = [
  { foodId: 'oats', grams: 50, slotId: 'meal-0' },
  { foodId: 'yogurt', grams: 150, slotId: 'meal-0' },
  { foodId: 'yogurt', grams: 200, slotId: 'bedtime' },
  { foodId: 'oats', grams: 30 },
  { foodId: 'deleted-food', grams: 100 },
];

describe('intake totals (D38)', () => {
  it('sums grams times per 100 g values', () => {
    // oats 80 g: 296 kcal, 48 C, 10.4 P, 5.6 F
    // yogurt 350 g: 210 kcal, 14 C, 35 P, 0.7 F
    // total: 506 kcal, 62 C, 45.4 P, 6.3 F
    const r = intakeTotals(entries, [oats, yogurt]);
    expect(r.totals.kcal).toBeCloseTo(506, 6);
    expect(r.totals.carbG).toBeCloseTo(62, 6);
    expect(r.totals.proteinG).toBeCloseTo(45.4, 6);
    expect(r.totals.fatG).toBeCloseTo(6.3, 6);
    expect(r.missingFoodIds).toEqual(['deleted-food']);
  });

  it('splits by slot and keeps unattached entries apart', () => {
    // meal-0: oats 50 g (185 kcal, 30 C, 6.5 P, 3.5 F)
    //       + yogurt 150 g (90 kcal, 6 C, 15 P, 0.3 F) = 275, 36, 21.5, 3.8
    // bedtime: yogurt 200 g = 120 kcal, 8 C, 20 P, 0.4 F
    // unattached: oats 30 g = 111 kcal, 18 C, 3.9 P, 2.1 F
    const r = intakeBySlot(entries, [oats, yogurt]);
    expect(r.get('meal-0')?.kcal).toBeCloseTo(275, 6);
    expect(r.get('meal-0')?.proteinG).toBeCloseTo(21.5, 6);
    expect(r.get('bedtime')?.carbG).toBeCloseTo(8, 6);
    expect(r.get(undefined)?.kcal).toBeCloseTo(111, 6);
  });

  it('is zero without entries', () => {
    expect(intakeTotals([], []).totals).toEqual({
      kcal: 0,
      carbG: 0,
      proteinG: 0,
      fatG: 0,
    });
  });
});
