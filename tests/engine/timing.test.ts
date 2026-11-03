import { describe, expect, it } from 'vitest';
import {
  carbLoadingDay,
  duringSession,
  eatingWindowWarnings,
  preMealGPerKg,
} from '../../src/engine/timing.ts';
import { maintain, testProfile } from './fixtures.ts';

describe('T1 pre meal amount', () => {
  it.each([
    [59, 'high', 0],
    [60, 'low', 0],
    [60, 'moderate', 1],
    [90, 'high', 1],
    [91, 'low', 2],
    [240, 'moderate', 2],
  ] as const)('%d min %s -> %d g/kg', (durationMin, band, gPerKg) => {
    expect(preMealGPerKg(durationMin, band)).toBe(gPerKg);
  });
});

describe('T2 during session', () => {
  it('has no during slot under 45 min', () => {
    expect(duringSession(44, testProfile)).toBeUndefined();
  });

  it('plans 0 g with a rinse note from 45 to under 75 min', () => {
    // fluid 600 ml/h * 0.75 h = 450 ml; no sodium (not over 2 h)
    const r = duringSession(45, testProfile);
    expect(r?.totalCarbG).toBe(0);
    expect(r?.mouthRinseOptional).toBe(true);
    expect(r?.schedule).toEqual([]);
    expect(r?.fluidMl).toBeCloseTo(450, 6);
    expect(r?.sodiumMg).toBeUndefined();
    expect(duringSession(74, testProfile)?.mouthRinseOptional).toBe(true);
  });

  it('uses 30 to 60 g/h from 75 min', () => {
    // 30 + 0.5 * 30 = 45 g/h; 45 * 75 / 60 = 56.25 g
    // feeds at 20, 40, 60 min: 56.25 / 3 = 18.75 g each
    const r = duringSession(75, testProfile);
    expect(r?.carbGPerH).toBeCloseTo(45, 6);
    expect(r?.rangeGPerH).toEqual([30, 60]);
    expect(r?.totalCarbG).toBeCloseTo(56.25, 6);
    expect(r?.schedule).toEqual([
      { atMin: 20, carbG: 18.75 },
      { atMin: 40, carbG: 18.75 },
      { atMin: 60, carbG: 18.75 },
    ]);
    expect(r?.needsMultipleTransportableCarbs).toBe(false);
  });

  it('keeps 30 to 60 g/h at 150 min and adds sodium over 2 h', () => {
    // 45 g/h * 2.5 h = 112.5 g; sodium 450 mg/h * 2.5 h = 1125 mg;
    // fluid 600 * 2.5 = 1500 ml
    const r = duringSession(150, testProfile);
    expect(r?.carbGPerH).toBeCloseTo(45, 6);
    expect(r?.totalCarbG).toBeCloseTo(112.5, 6);
    expect(r?.sodiumMg).toBeCloseTo(1125, 6);
    expect(r?.fluidMl).toBeCloseTo(1500, 6);
  });

  it('uses 60 to 90 g/h over 150 min, with glucose plus fructose', () => {
    // 60 + 0.5 * 30 = 75 g/h
    const r = duringSession(151, testProfile);
    expect(r?.carbGPerH).toBeCloseTo(75, 6);
    expect(r?.rangeGPerH).toEqual([60, 90]);
    expect(r?.needsMultipleTransportableCarbs).toBe(true);
  });

  it('places the rate at the profile point', () => {
    // 30 + 0.25 * 30 = 37.5 g/h
    const r = duringSession(120, { ...testProfile, carbPointInRange: 0.25 });
    expect(r?.carbGPerH).toBeCloseTo(37.5, 6);
  });

  it('applies the user on-bike target only over 150 min', () => {
    const profile = { ...testProfile, onBikeCarbTargetGPerH: 80 };
    expect(duringSession(240, profile)?.carbGPerH).toBe(80);
    expect(duringSession(120, profile)?.carbGPerH).toBeCloseTo(45, 6);
  });

  it('warns above 90 g/h and caps at 120 g/h', () => {
    const at100 = duringSession(240, {
      ...testProfile,
      onBikeCarbTargetGPerH: 100,
    });
    expect(at100?.carbGPerH).toBe(100);
    expect(at100?.warnings.map((w) => w.code)).toEqual([
      'during-rate-above-90',
    ]);
    const at130 = duringSession(240, {
      ...testProfile,
      onBikeCarbTargetGPerH: 130,
    });
    expect(at130?.carbGPerH).toBe(120);
    expect(at130?.warnings.map((w) => w.code)).toEqual([
      'during-rate-above-90',
      'during-rate-capped',
    ]);
  });
});

describe('T5 carbohydrate loading', () => {
  const goal = {
    ...maintain,
    event: { name: 'Gran fondo', date: '2026-11-08', expectedDurationMin: 180 },
  };

  it('covers the two days before an event over 90 min', () => {
    expect(carbLoadingDay('2026-11-05', goal)).toBe(false);
    expect(carbLoadingDay('2026-11-06', goal)).toBe(true);
    expect(carbLoadingDay('2026-11-07', goal)).toBe(true);
    expect(carbLoadingDay('2026-11-08', goal)).toBe(false);
  });

  it('crosses a month boundary', () => {
    const g = { ...goal, event: { ...goal.event, date: '2026-12-01' } };
    expect(carbLoadingDay('2026-11-29', g)).toBe(true);
    expect(carbLoadingDay('2026-11-30', g)).toBe(true);
  });

  it('does not apply to events of 90 min or without an event', () => {
    const short = {
      ...goal,
      event: { ...goal.event, expectedDurationMin: 90 },
    };
    expect(carbLoadingDay('2026-11-07', short)).toBe(false);
    expect(carbLoadingDay('2026-11-07', maintain)).toBe(false);
  });
});

describe('T6 eating window', () => {
  const window = { start: '12:00', end: '20:00' };
  const session = { id: 's1', start: '10:00', durationMin: 120 };

  it('flags slots with energy outside the window and suggests a window', () => {
    // fixed slots: during 10:00 to 12:00 (600 to 720). Window length 480.
    // span 720 - 600 = 120 <= 480 -> suggest 10:00 to 18:00
    const warnings = eatingWindowWarnings(
      window,
      [session],
      [
        { id: 'meal-0', kind: 'meal', time: '07:30', kcal: 500 },
        {
          id: 'during-s1',
          kind: 'during',
          time: '10:00',
          kcal: 400,
          sessionId: 's1',
        },
        { id: 'meal-1', kind: 'meal', time: '13:00', kcal: 800 },
        { id: 'meal-2', kind: 'meal', time: '20:00', kcal: 800 },
        { id: 'meal-3', kind: 'meal', time: '21:00', kcal: 0 },
      ],
    );
    expect(warnings).toEqual([
      {
        code: 'eating-window-conflict',
        ruleId: 'T6',
        values: { slotId: 'meal-0', time: '07:30' },
      },
      {
        code: 'eating-window-conflict',
        ruleId: 'T6',
        values: { slotId: 'during-s1', time: '10:00' },
      },
      {
        code: 'eating-window-suggest-window',
        ruleId: 'T6',
        values: { start: '10:00', end: '18:00' },
      },
    ]);
  });

  it('suggests moving the session when no window of that length fits', () => {
    // pre 06:00 (360) to recovery 15:00 (900): 540 > 480
    const warnings = eatingWindowWarnings(
      window,
      [session],
      [
        {
          id: 'pre-s1',
          kind: 'pre',
          time: '06:00',
          kcal: 300,
          sessionId: 's1',
        },
        {
          id: 'during-s1',
          kind: 'during',
          time: '10:00',
          kcal: 400,
          sessionId: 's1',
        },
        {
          id: 'recovery-s1',
          kind: 'recovery',
          time: '15:00',
          kcal: 400,
          sessionId: 's1',
        },
      ],
    );
    expect(warnings.at(-1)).toEqual({
      code: 'eating-window-suggest-move-session',
      ruleId: 'T6',
      values: { sessionId: 's1' },
    });
  });

  it('returns nothing when every slot is inside', () => {
    expect(
      eatingWindowWarnings(
        window,
        [],
        [{ id: 'meal-1', kind: 'meal', time: '12:00', kcal: 800 }],
      ),
    ).toEqual([]);
  });
});
