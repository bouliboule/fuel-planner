import { describe, expect, it } from 'vitest';
import {
  carbohydrateTarget,
  fatTarget,
  proteinTarget,
} from '../../src/engine/macros.ts';
import { testProfile } from './fixtures.ts';

describe('M1 protein', () => {
  it('uses the profile g/kg', () => {
    // 1.8 * 75 = 135
    expect(proteinTarget(testProfile).g).toBeCloseTo(135, 6);
  });
});

describe('M2 carbohydrate', () => {
  it.each([
    // load, range g/kg, point 0.5 -> g/kg, * 75 kg
    ['light', [3, 5], 4, 300],
    ['moderate', [5, 7], 6, 450],
    ['high', [6, 10], 8, 600],
    ['very-high', [8, 12], 10, 750],
  ] as const)('%s uses the midpoint by default', (load, range, gPerKg, g) => {
    const r = carbohydrateTarget(load, testProfile);
    expect(r.rangeGPerKg).toEqual(range);
    expect(r.gPerKg).toBeCloseTo(gPerKg, 6);
    expect(r.g).toBeCloseTo(g, 6);
  });

  it('places the point inside the range', () => {
    // high 6..10, point 0.25: 6 + 0.25 * 4 = 7 g/kg; 7 * 75 = 525
    const r = carbohydrateTarget('high', {
      ...testProfile,
      carbPointInRange: 0.25,
    });
    expect(r.g).toBeCloseTo(525, 6);
  });

  it('uses the light lower bound on rest days', () => {
    // 3 * 75 = 225, whatever the chosen point
    const r = carbohydrateTarget('rest', testProfile);
    expect(r.rangeGPerKg).toEqual([3, 5]);
    expect(r.g).toBeCloseTo(225, 6);
  });
});

describe('M3 fat', () => {
  it('takes the remainder when above the floor', () => {
    // (2296.6875 - 4*135 - 4*225) / 9 = 856.6875 / 9 = 95.1875
    // floor max(0.2*2296.6875/9 = 51.0375, 0.8*75 = 60) = 60
    const r = fatTarget({
      targetKcal: 2296.6875,
      proteinG: 135,
      carbG: 225,
      carbLowerG: 225,
      massKg: 75,
    });
    expect(r.fatG).toBeCloseTo(95.1875, 6);
    expect(r.carbG).toBeCloseTo(225, 6);
    expect(r.floorHit).toBe(false);
    expect(r.overKcal).toBe(0);
  });

  it('lowers carbohydrate to hold the 20 % floor', () => {
    // remainder (3000 - 540 - 4*600) / 9 = 60 / 9 = 6.67 g
    // floor max(0.2*3000/9 = 66.666667, 60) = 66.666667 g = 600 kcal
    // carb (3000 - 540 - 600) / 4 = 465 g, above the lower bound 450
    const r = fatTarget({
      targetKcal: 3000,
      proteinG: 135,
      carbG: 600,
      carbLowerG: 450,
      massKg: 75,
    });
    expect(r.fatG).toBeCloseTo(66.666667, 5);
    expect(r.carbG).toBeCloseTo(465, 6);
    expect(r.kcal).toBeCloseTo(3000, 6);
    expect(r.floorHit).toBe(true);
    expect(r.overKcal).toBe(0);
  });

  it('stops at the carbohydrate lower bound and flags the excess', () => {
    // floor max(0.2*1884.1875/9 = 41.870833, 0.8*75 = 60) = 60 g = 540 kcal
    // carb needed (1884.1875 - 540 - 540) / 4 = 201.046875 < 225 -> 225
    // kcal 4*135 + 4*225 + 9*60 = 540 + 900 + 540 = 1980
    // over 1980 - 1884.1875 = 95.8125
    const r = fatTarget({
      targetKcal: 1884.1875,
      proteinG: 135,
      carbG: 225,
      carbLowerG: 225,
      massKg: 75,
    });
    expect(r.fatG).toBeCloseTo(60, 6);
    expect(r.carbG).toBeCloseTo(225, 6);
    expect(r.kcal).toBeCloseTo(1980, 6);
    expect(r.overKcal).toBeCloseTo(95.8125, 6);
    expect(r.warnings.map((w) => w.code)).toEqual(['over-target']);
  });
});
