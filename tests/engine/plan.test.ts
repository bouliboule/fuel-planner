import { describe, expect, it } from 'vitest';
import { planDayTargets } from '../../src/engine/plan.ts';
import type { PlannedSession } from '../../src/engine/types.ts';
import { maintain, session, testProfile } from './fixtures.ts';

// Shared for every fixture (test profile, 2026, age 37):
// BMR    = 10*75 + 6.25*181 - 5*37 + 5 = 1701.25            (E1)
// base   = 1701.25 * 1.35 = 2296.6875                         (E2)
// protein = 1.8 * 75 = 135 g = 540 kcal                       (M1)
// FFM    = 0.85 * 75 = 63.75 (estimated)                      (E7)
// Ride kcal = kJ / (0.24 * 4.184) = kJ / 1.00416              (E3)

function plan(sessions: PlannedSession[], goal = maintain) {
  return planDayTargets({
    date: '2026-11-02',
    profile: testProfile,
    goal,
    sessions,
  });
}

describe('full-day fixtures', () => {
  it('rest day', () => {
    // exercise 0; TDEE = 2296.6875; target 2296.6875
    // load rest -> light lower bound 3 g/kg -> 225 g
    // fat (2296.6875 - 540 - 900) / 9 = 95.1875 (floor 60)
    // EA 2296.6875 / 63.75 = 36.026471
    const r = plan([]);
    expect(r.energy.bmr).toBeCloseTo(1701.25, 4);
    expect(r.energy.nonExercise).toBeCloseTo(2296.6875, 4);
    expect(r.energy.exerciseTotal).toBe(0);
    expect(r.energy.target).toBeCloseTo(2296.6875, 4);
    expect(r.load).toBe('rest');
    expect(r.macros.proteinG).toBeCloseTo(135, 4);
    expect(r.macros.carbG).toBeCloseTo(225, 4);
    expect(r.macros.fatG).toBeCloseTo(95.1875, 4);
    expect(r.macros.kcal).toBeCloseTo(2296.6875, 4);
    expect(r.energyAvailability.kcalPerKgFfm).toBeCloseTo(36.026471, 4);
    expect(r.warnings).toEqual([]);
  });

  it('Monday run intervals, 60 min at 5:00/km', () => {
    // 3600 s / 300 s/km = 12 km; 1.0 * 75 * 12 = 900 kcal (E4)
    // TDEE 2296.6875 + 900 = 3196.6875
    // 60 min, pace 12 km/h >= 6.44 km/h -> high band -> moderate load
    // carb 5..7, midpoint 6 g/kg -> 450 g
    // fat (3196.6875 - 540 - 1800) / 9 = 95.1875 (floor 71.0375)
    const r = plan([
      session({
        sport: 'run',
        durationMin: 60,
        intensity: { kind: 'pace', secPerKm: 300 },
        key: true,
      }),
    ]);
    expect(r.energy.exercise[0]?.kcal).toBeCloseTo(900, 4);
    expect(r.energy.target).toBeCloseTo(3196.6875, 4);
    expect(r.load).toBe('moderate');
    expect(r.macros.carbG).toBeCloseTo(450, 4);
    expect(r.macros.fatG).toBeCloseTo(95.1875, 4);
  });

  it('Wednesday sweet spot indoor, 60 min', () => {
    // 0.90 * 250 = 225 W; 225 * 3600 / 1000 = 810 kJ; 810 / 1.00416 = 806.644359
    // TDEE 2296.6875 + 806.644359 = 3103.331859
    // 60 min, SS high -> moderate -> 450 g carb
    // fat (3103.331859 - 540 - 1800) / 9 = 84.814651 (floor 68.962930)
    const r = plan([
      session({
        sport: 'ride',
        indoor: true,
        durationMin: 60,
        intensity: { kind: 'zone', zone: 'SS' },
        key: true,
      }),
    ]);
    expect(r.energy.exercise[0]?.kcal).toBeCloseTo(806.644359, 4);
    expect(r.energy.target).toBeCloseTo(3103.331859, 4);
    expect(r.load).toBe('moderate');
    expect(r.macros.carbG).toBeCloseTo(450, 4);
    expect(r.macros.fatG).toBeCloseTo(84.814651, 4);
  });

  it('Thursday hard club ride, Z4, 90 min (fat floor lowers carbohydrate)', () => {
    // 0.98 * 250 = 245 W; 245 * 5400 / 1000 = 1323 kJ; 1323 / 1.00416 = 1317.519120
    // TDEE 2296.6875 + 1317.519120 = 3614.206620
    // 90 min -> high -> 6..10, midpoint 8 g/kg -> 600 g
    // remainder (3614.206620 - 540 - 2400) / 9 = 74.911847
    // floor max(0.2 * 3614.206620 / 9 = 80.315703, 60) = 80.315703
    // carb (3614.206620 - 540 - 9 * 80.315703) / 4
    //    = (3614.206620 - 540 - 722.841324) / 4 = 587.841324 (>= 450)
    const r = plan([
      session({
        sport: 'ride',
        durationMin: 90,
        intensity: { kind: 'zone', zone: 'Z4' },
        key: true,
      }),
    ]);
    expect(r.energy.exercise[0]?.kcal).toBeCloseTo(1317.51912, 4);
    expect(r.energy.target).toBeCloseTo(3614.20662, 4);
    expect(r.load).toBe('high');
    expect(r.macros.fatG).toBeCloseTo(80.315703, 4);
    expect(r.macros.carbG).toBeCloseTo(587.841324, 4);
    expect(r.macros.kcal).toBeCloseTo(3614.20662, 4);
    expect(r.warnings).toEqual([]);
  });

  it('Sunday long ride, Z2, 240 min', () => {
    // 0.65 * 250 = 162.5 W; 162.5 * 14400 / 1000 = 2340 kJ;
    // 2340 / 1.00416 = 2330.305927
    // TDEE 2296.6875 + 2330.305927 = 4626.993427
    // 240 min -> very high -> 8..12, midpoint 10 g/kg -> 750 g
    // fat (4626.993427 - 540 - 3000) / 9 = 120.777047 (floor 102.822076)
    const r = plan([
      session({
        sport: 'ride',
        durationMin: 240,
        intensity: { kind: 'zone', zone: 'Z2' },
        key: true,
      }),
    ]);
    expect(r.energy.exercise[0]?.kcal).toBeCloseTo(2330.305927, 4);
    expect(r.energy.target).toBeCloseTo(4626.993427, 4);
    expect(r.load).toBe('very-high');
    expect(r.macros.carbG).toBeCloseTo(750, 4);
    expect(r.macros.fatG).toBeCloseTo(120.777047, 4);
  });

  it('rest day with a 0.5 kg/week loss goal', () => {
    // rate capped at 0.005 * 75 = 0.375 kg/week
    // deficit -0.375 * 7700 / 7 = -412.5; target 2296.6875 - 412.5 = 1884.1875
    // carb 225 g (rest, lower bound); fat floor 60 g hit
    // kcal 540 + 900 + 540 = 1980, over target by 95.8125
    // EA 1980 / 63.75 = 31.058824, no warning
    const r = plan([], {
      ...maintain,
      kind: 'lose',
      rateKgPerWeek: 0.5,
    });
    expect(r.energy.goalAdjustment).toBeCloseTo(-412.5, 4);
    expect(r.energy.target).toBeCloseTo(1884.1875, 4);
    expect(r.macros.fatG).toBeCloseTo(60, 4);
    expect(r.macros.carbG).toBeCloseTo(225, 4);
    expect(r.macros.kcal).toBeCloseTo(1980, 4);
    expect(r.energyAvailability.kcalPerKgFfm).toBeCloseTo(31.058824, 4);
    expect(r.warnings.map((w) => w.code).sort()).toEqual([
      'lose-rate-capped',
      'over-target',
    ]);
  });

  it('records a trace step for each rule', () => {
    const r = plan([
      session({
        sport: 'ride',
        durationMin: 90,
        intensity: { kind: 'zone', zone: 'Z4' },
      }),
    ]);
    const rules = new Set(r.trace.map((s) => s.ruleId));
    for (const id of ['E1', 'E2', 'E3', 'E5', 'E6', 'E7', 'M1', 'M2', 'M3']) {
      expect(rules, id).toContain(id);
    }
  });
});
