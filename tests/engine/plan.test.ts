import { describe, expect, it } from 'vitest';
import { planDay, planDayTargets } from '../../src/engine/plan.ts';
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

describe('M2 acceptance: Sunday long ride slots', () => {
  // Sunday 09:30 to 13:30, Z2 240 min, key. Day targets from the Sunday
  // fixture: carbohydrate 750, protein 135, fat 120.777047,
  // kcal 4626.993427.
  // Meals: breakfast 07:30 is 2 h before the start -> pre meal, 2 g/kg =
  //   150 g. Lunch 12:30 is inside the ride -> 13:30 + 30 min = 14:00, the
  //   first meal within 2 h after the end -> recovery meal (normal mode).
  // Pre snack: breakfast is 2 h before, not over 3 h -> none.
  // During: 240 > 150 min -> 60 + 0.5 * 30 = 75 g/h * 4 h = 300 g;
  //   feeds at 20, 40, ..., 220 min = 11 feeds of 300 / 11 = 27.272727 g;
  //   fluid 600 * 4 = 2400 ml; sodium 450 * 4 = 1800 mg.
  // Bedtime: dinner 19:30 to breakfast 07:30 = 12 h > 10 h -> 22:30.
  // Carbohydrate: fixed 150 + 300 = 450; remainder 300 to lunch (1.5,
  //   first after) and dinner (1.0): lunch 180, dinner 120.
  // Protein: bedtime 0.35 * 75 = 26.25; meals (135 - 26.25) / 3 = 36.25.
  // Fat: lunch and dinner (breakfast is the pre meal): 120.777047 / 2 =
  //   60.388524.
  // Slot kcal: breakfast 4*150 + 4*36.25 = 745; during 4*300 = 1200;
  //   lunch 4*180 + 4*36.25 + 9*60.388524 = 1408.496713;
  //   dinner 4*120 + 4*36.25 + 9*60.388524 = 1168.496713; bedtime 105;
  //   sum 4626.993427.
  const r = planDay({
    date: '2026-11-08',
    profile: testProfile,
    goal: maintain,
    sessions: [
      session({
        start: '09:30',
        sport: 'ride',
        durationMin: 240,
        intensity: { kind: 'zone', zone: 'Z2' },
        key: true,
      }),
    ],
  });
  const find = (id: string) => r.slots.find((s) => s.id === id);

  it('has pre, during with schedule, recovery and meal slots', () => {
    expect(r.slots.map((s) => [s.id, s.kind, s.time, s.role])).toEqual([
      ['meal-0', 'meal', '07:30', 'pre'],
      ['during-s1', 'during', '09:30', undefined],
      ['meal-1', 'meal', '14:00', 'recovery'],
      ['meal-2', 'meal', '19:30', undefined],
      ['bedtime', 'bedtime', '22:30', undefined],
    ]);
    const during = find('during-s1');
    expect(during?.carbGPerH).toBeCloseTo(75, 6);
    expect(during?.schedule).toHaveLength(11);
    expect(during?.schedule?.[0]?.atMin).toBe(20);
    expect(during?.schedule?.[10]?.atMin).toBe(220);
    expect(during?.schedule?.[0]?.carbG).toBeCloseTo(27.272727, 5);
    expect(during?.fluidMl).toBeCloseTo(2400, 6);
    expect(during?.sodiumMg).toBeCloseTo(1800, 6);
    expect(during?.needsMultipleTransportableCarbs).toBe(true);
  });

  it('assigns the hand-computed slot targets', () => {
    expect(find('meal-0')?.target.carbG).toBeCloseTo(150, 6);
    expect(find('during-s1')?.target.carbG).toBeCloseTo(300, 6);
    expect(find('meal-1')?.target.carbG).toBeCloseTo(180, 6);
    expect(find('meal-2')?.target.carbG).toBeCloseTo(120, 6);
    expect(find('meal-1')?.target.fatG).toBeCloseTo(60.388524, 5);
    expect(find('meal-0')?.target.fatG).toBe(0);
    expect(find('meal-2')?.target.proteinG).toBeCloseTo(36.25, 6);
    expect(find('meal-1')?.target.kcal).toBeCloseTo(1408.496713, 5);
  });

  it('sums slot macros to the day targets within 1 g', () => {
    const sum = (key: 'carbG' | 'proteinG' | 'fatG' | 'kcal') =>
      r.slots.reduce((total, s) => total + s.target[key], 0);
    expect(Math.abs(sum('carbG') - r.macros.carbG)).toBeLessThan(1);
    expect(Math.abs(sum('proteinG') - r.macros.proteinG)).toBeLessThan(1);
    expect(Math.abs(sum('fatG') - r.macros.fatG)).toBeLessThan(1);
    expect(sum('kcal')).toBeCloseTo(4626.993427, 4);
    expect(r.warnings).toEqual([]);
  });
});

describe('T5 carbohydrate loading day', () => {
  it('replaces the load range and limits fibre', () => {
    // event 2026-11-03, 180 min: 2026-11-02 is the day before.
    // rest day, 10 + 0.5 * 2 = 11 g/kg = 825 g
    // fat remainder (2296.6875 - 540 - 3300) / 9 < 0 -> floor
    //   max(0.2 * 2296.6875 / 9 = 51.0375, 60) = 60 g
    // carbohydrate for the target (2296.6875 - 540 - 540) / 4 = 304.171875,
    //   below the 10 g/kg = 750 g lower bound -> 750 g
    // kcal 540 + 3000 + 540 = 4080, over by 4080 - 2296.6875 = 1783.3125
    const r = planDay({
      date: '2026-11-02',
      profile: testProfile,
      goal: {
        ...maintain,
        event: {
          name: 'Gran fondo',
          date: '2026-11-03',
          expectedDurationMin: 180,
        },
      },
      sessions: [],
    });
    expect(r.carbLoading).toBe(true);
    expect(r.carbRangeGPerKg).toEqual([10, 12]);
    expect(r.macros.carbG).toBeCloseTo(750, 6);
    expect(r.macros.kcal).toBeCloseTo(4080, 6);
    expect(r.warnings.map((w) => w.code)).toContain('over-target');
    expect(r.slots.every((s) => s.fibreLimited === true)).toBe(true);
  });
});

describe('day ranges in grams', () => {
  it('scales the M2 and M1 ranges by body mass', () => {
    // rest day -> light range 3 to 5 g/kg: 3*75 = 225, 5*75 = 375 g
    // protein 1.6 to 2.2 g/kg: 1.6*75 = 120, 2.2*75 = 165 g
    const r = planDay({
      date: '2026-11-02',
      profile: testProfile,
      goal: maintain,
      sessions: [],
    });
    expect(r.ranges.carbG[0]).toBeCloseTo(225, 6);
    expect(r.ranges.carbG[1]).toBeCloseTo(375, 6);
    expect(r.ranges.proteinG[0]).toBeCloseTo(120, 6);
    expect(r.ranges.proteinG[1]).toBeCloseTo(165, 6);
  });
});
