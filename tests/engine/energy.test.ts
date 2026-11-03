import { describe, expect, it } from 'vitest';
import {
  ageInYear,
  energyAvailability,
  goalAdjustment,
  nonExerciseEnergy,
  restingEnergy,
  sessionEnergy,
} from '../../src/engine/energy.ts';
import { maintain, noFtpProfile, session, testProfile } from './fixtures.ts';

// 0.24 * 4.184 = 1.00416 kcal per kJ of mechanical work divisor (E3).

describe('E1 resting energy', () => {
  it('derives age from the plan year', () => {
    // 2026 - 1989 = 37
    expect(ageInYear('2026-11-03', 1989)).toBe(37);
  });

  it('uses Mifflin-St Jeor for a male', () => {
    // 10*75 + 6.25*181 - 5*37 + 5 = 750 + 1131.25 - 185 + 5 = 1701.25
    const r = restingEnergy(testProfile, 37);
    expect(r.kcal).toBeCloseTo(1701.25, 2);
    expect(r.method).toBe('mifflin-st-jeor');
    expect(r.trace[0]?.ruleId).toBe('E1');
  });

  it('uses Mifflin-St Jeor for a female', () => {
    // 10*60 + 6.25*165 - 5*30 - 161 = 600 + 1031.25 - 150 - 161 = 1320.25
    const r = restingEnergy(
      { ...testProfile, sex: 'female', massKg: 60, heightCm: 165 },
      30,
    );
    expect(r.kcal).toBeCloseTo(1320.25, 2);
  });

  it('uses Katch-McArdle when body fat is set', () => {
    // lean = 75 * (1 - 0.15) = 63.75; 370 + 21.6*63.75 = 370 + 1377 = 1747
    const r = restingEnergy({ ...testProfile, bodyFatPct: 15 }, 37);
    expect(r.kcal).toBeCloseTo(1747, 2);
    expect(r.method).toBe('katch-mcardle');
  });
});

describe('E2 non-exercise activity', () => {
  it('multiplies BMR by the NEA factor', () => {
    // 1701.25 * 1.35 = 2296.6875
    expect(nonExerciseEnergy(1701.25, 1.35).kcal).toBeCloseTo(2296.6875, 4);
  });
});

describe('E3 ride with power', () => {
  it('uses planned kJ directly', () => {
    // 1000 / 1.00416 = 995.857235
    const r = sessionEnergy(
      session({
        sport: 'ride',
        durationMin: 120,
        intensity: { kind: 'kj', value: 1000 },
      }),
      testProfile,
    );
    expect(r.kcal).toBeCloseTo(995.857235, 4);
    expect(r.method).toBe('power');
  });

  it('derives kJ from IF and FTP', () => {
    // 0.75 * 250 = 187.5 W; 187.5 * 3600 / 1000 = 675 kJ;
    // 675 / 1.00416 = 672.203633
    const r = sessionEnergy(
      session({
        sport: 'ride',
        durationMin: 60,
        intensity: { kind: 'if', value: 0.75 },
      }),
      testProfile,
    );
    expect(r.kcal).toBeCloseTo(672.203633, 4);
  });

  it.each([
    // zone, IF, kJ = IF*250*3600/1000, kcal = kJ/1.00416
    ['Z1', 450, 448.135755],
    ['Z2', 585, 582.576482],
    ['Z3', 747, 743.905354],
    ['SS', 810, 806.644359],
    ['Z4', 882, 878.34608],
    ['Z5', 990, 985.898661],
  ] as const)('derives kJ from zone %s for one hour', (zone, kj, kcal) => {
    const r = sessionEnergy(
      session({
        sport: 'ride',
        durationMin: 60,
        intensity: { kind: 'zone', zone },
      }),
      testProfile,
    );
    expect(
      r.trace.find((s) => s.label === 'Mechanical work (kJ)')?.output,
    ).toBeCloseTo(kj, 6);
    expect(r.kcal).toBeCloseTo(kcal, 4);
  });

  it('falls back to compendium effort codes without FTP, with a warning', () => {
    // Z4 without FTP: vigorous, 01017, 9.0 MET.
    // (9.0 - 1) * 75 * 1.5 = 900
    const r = sessionEnergy(
      session({
        sport: 'ride',
        durationMin: 90,
        intensity: { kind: 'zone', zone: 'Z4' },
      }),
      noFtpProfile,
    );
    expect(r.kcal).toBeCloseTo(900, 6);
    expect(r.method).toBe('met');
    expect(r.compendiumCode).toBe('01017');
    expect(r.warnings.map((w) => w.code)).toEqual(['ride-no-power']);
  });

  it.each([
    // RPE band -> effort code: easy 01015 4.3, moderate 01016 7.0
    // (4.3 - 1) * 75 * 1 = 247.5; (7.0 - 1) * 75 * 1 = 450
    [3, '01015', 247.5],
    [5, '01016', 450],
    [8, '01017', 600],
  ] as const)('maps ride RPE %d to compendium code %s', (rpe, code, kcal) => {
    const r = sessionEnergy(
      session({
        sport: 'ride',
        durationMin: 60,
        intensity: { kind: 'rpe', value: rpe },
      }),
      testProfile,
    );
    expect(r.compendiumCode).toBe(code);
    expect(r.kcal).toBeCloseTo(kcal, 6);
  });
});

describe('E4 other sports', () => {
  it('estimates a run from duration and pace', () => {
    // 60 min = 3600 s; 3600 / 300 s/km = 12 km; 1.0 * 75 * 12 = 900
    const r = sessionEnergy(
      session({
        sport: 'run',
        durationMin: 60,
        intensity: { kind: 'pace', secPerKm: 300 },
      }),
      testProfile,
    );
    expect(r.kcal).toBeCloseTo(900, 6);
    expect(r.method).toBe('distance');
  });

  it('prefers a measured run distance over the pace estimate', () => {
    // 1.0 * 75 * 10.5 = 787.5
    const r = sessionEnergy(
      session({
        sport: 'run',
        durationMin: 60,
        intensity: { kind: 'pace', secPerKm: 300 },
        distanceKm: 10.5,
      }),
      testProfile,
    );
    expect(r.kcal).toBeCloseTo(787.5, 6);
  });

  it('warns and counts 0 for a run without pace, distance or MET', () => {
    const r = sessionEnergy(
      session({
        sport: 'run',
        durationMin: 45,
        intensity: { kind: 'zone', zone: 'Z4' },
      }),
      testProfile,
    );
    expect(r.kcal).toBe(0);
    expect(r.warnings.map((w) => w.code)).toEqual(['run-needs-pace']);
  });

  it('uses Pilates general, 02105 at 2.8 MET', () => {
    // (2.8 - 1) * 75 * (50 / 60) = 1.8 * 75 * 0.833333 = 112.5
    const r = sessionEnergy(
      session({
        sport: 'pilates',
        durationMin: 50,
        intensity: { kind: 'rpe', value: 5 },
      }),
      testProfile,
    );
    expect(r.kcal).toBeCloseTo(112.5, 6);
    expect(r.compendiumCode).toBe('02105');
  });

  it('uses body weight resistance, 02056 at 3.0 MET, for strength', () => {
    // (3.0 - 1) * 75 * (15 / 60) = 2 * 75 * 0.25 = 37.5
    const r = sessionEnergy(
      session({
        sport: 'strength',
        durationMin: 15,
        intensity: { kind: 'rpe', value: 6 },
      }),
      testProfile,
    );
    expect(r.kcal).toBeCloseTo(37.5, 6);
    expect(r.compendiumCode).toBe('02056');
  });

  it('uses an explicit MET with its code', () => {
    // (5.0 - 1) * 75 * 0.5 = 150
    const r = sessionEnergy(
      session({
        sport: 'strength',
        durationMin: 30,
        intensity: { kind: 'met', value: 5.0, compendiumCode: '02035' },
      }),
      testProfile,
    );
    expect(r.kcal).toBeCloseTo(150, 6);
    expect(r.compendiumCode).toBe('02035');
  });

  it('warns and counts 0 for a walk without MET', () => {
    const r = sessionEnergy(
      session({
        sport: 'walk',
        durationMin: 30,
        intensity: { kind: 'rpe', value: 3 },
      }),
      testProfile,
    );
    expect(r.kcal).toBe(0);
    expect(r.warnings.map((w) => w.code)).toEqual(['session-needs-met']);
  });
});

describe('E6 goal adjustment', () => {
  const rest = { sessions: [], massKg: 75 };

  it('is 0 for maintain', () => {
    expect(goalAdjustment({ goal: maintain, ...rest }).kcal).toBe(0);
  });

  it('adds 250 kcal for gain by default', () => {
    expect(
      goalAdjustment({ goal: { ...maintain, kind: 'gain' }, ...rest }).kcal,
    ).toBe(250);
  });

  it('uses the user gain value', () => {
    expect(
      goalAdjustment({
        goal: { ...maintain, kind: 'gain', gainKcalPerDay: 300 },
        ...rest,
      }).kcal,
    ).toBe(300);
  });

  it('applies the loss rate below the cap', () => {
    // cap 0.005 * 75 = 0.375 kg/week; rate 0.3 kept;
    // -0.3 * 7700 / 7 = -330
    const r = goalAdjustment({
      goal: { ...maintain, kind: 'lose', rateKgPerWeek: 0.3 },
      ...rest,
    });
    expect(r.kcal).toBeCloseTo(-330, 6);
    expect(r.warnings).toEqual([]);
  });

  it('caps the loss rate at 0.5 % of body mass per week', () => {
    // cap 0.005 * 75 = 0.375 kg/week; -0.375 * 7700 / 7 = -412.5
    const r = goalAdjustment({
      goal: { ...maintain, kind: 'lose', rateKgPerWeek: 0.5 },
      ...rest,
    });
    expect(r.kcal).toBeCloseTo(-412.5, 6);
    expect(r.warnings.map((w) => w.code)).toEqual(['lose-rate-capped']);
  });

  it('targets maintenance on a key session day', () => {
    const r = goalAdjustment({
      goal: { ...maintain, kind: 'lose', rateKgPerWeek: 0.3 },
      massKg: 75,
      sessions: [{ durationMin: 30, key: true }],
    });
    expect(r.kcal).toBe(0);
  });

  it('keeps the deficit at 150 min and drops it above', () => {
    const goal = { ...maintain, kind: 'lose' as const, rateKgPerWeek: 0.3 };
    expect(
      goalAdjustment({
        goal,
        massKg: 75,
        sessions: [{ durationMin: 150, key: false }],
      }).kcal,
    ).toBeCloseTo(-330, 6);
    expect(
      goalAdjustment({
        goal,
        massKg: 75,
        sessions: [
          { durationMin: 100, key: false },
          { durationMin: 51, key: false },
        ],
      }).kcal,
    ).toBe(0);
  });
});

describe('E7 energy availability', () => {
  it('estimates fat-free mass for a male and does not warn at 36', () => {
    // FFM = 0.85 * 75 = 63.75; (3196.6875 - 900) / 63.75 = 36.026471
    const r = energyAvailability({
      intakeKcal: 3196.6875,
      exerciseKcal: 900,
      profile: testProfile,
    });
    expect(r.ffmKg).toBeCloseTo(63.75, 6);
    expect(r.ffmEstimated).toBe(true);
    expect(r.kcalPerKgFfm).toBeCloseTo(36.026471, 5);
    expect(r.warnings).toEqual([]);
  });

  it('uses 0.75 for a female and warns under 30', () => {
    // FFM = 0.75 * 60 = 45; (2000 - 700) / 45 = 28.888889
    const r = energyAvailability({
      intakeKcal: 2000,
      exerciseKcal: 700,
      profile: { ...testProfile, sex: 'female', massKg: 60 },
    });
    expect(r.kcalPerKgFfm).toBeCloseTo(28.888889, 5);
    expect(r.warnings.map((w) => w.code)).toEqual(['low-energy-availability']);
  });

  it('uses body fat when set', () => {
    // FFM = 75 * (1 - 0.2) = 60; (2400 - 600) / 60 = 30, not under 30
    const r = energyAvailability({
      intakeKcal: 2400,
      exerciseKcal: 600,
      profile: { ...testProfile, bodyFatPct: 20 },
    });
    expect(r.ffmKg).toBeCloseTo(60, 6);
    expect(r.ffmEstimated).toBe(false);
    expect(r.kcalPerKgFfm).toBeCloseTo(30, 6);
    expect(r.warnings).toEqual([]);
  });
});
