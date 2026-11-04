import { describe, expect, it } from 'vitest';
import { mealGuidance } from '../../src/engine/guidance.ts';
import { planDay } from '../../src/engine/plan.ts';
import type { Slot } from '../../src/engine/slots.ts';
import { maintain, session, testProfile } from './fixtures.ts';

const zero = { kcal: 0, carbG: 0, proteinG: 0, fatG: 0 };
const slot = (s: Partial<Slot> & Pick<Slot, 'kind'>): Slot => ({
  id: 'x',
  time: '12:00',
  target: zero,
  ...s,
});

describe('G1 meal guidance key', () => {
  it.each([
    [slot({ kind: 'during', mouthRinseOptional: true }), 'during-rinse'],
    [slot({ kind: 'during', mouthRinseOptional: false }), 'during'],
    [slot({ kind: 'pre-snack' }), 'pre-snack'],
    [slot({ kind: 'pre' }), 'pre'],
    [slot({ kind: 'meal', name: 'Lunch', role: 'pre' }), 'pre-meal'],
    [slot({ kind: 'meal', name: 'Lunch', role: 'recovery' }), 'recovery-meal'],
    [slot({ kind: 'recovery', recoveryMode: 'fast' }), 'recovery-fast'],
    [slot({ kind: 'recovery', recoveryMode: 'normal' }), 'recovery'],
    [slot({ kind: 'bedtime' }), 'bedtime'],
    [slot({ kind: 'snack' }), 'snack'],
    [slot({ kind: 'meal', name: 'Dinner' }), 'meal'],
  ] as const)('%#: %s', (s, expected) => {
    expect(mealGuidance(s)).toBe(expected);
  });
});

describe('G1 in the day plan', () => {
  it('gives every slot of a long ride day its key', () => {
    // 240 min Z2 ride at 09:00, test profile (meals 07:30, 12:30, 19:30).
    // T1: over 90 min -> pre meal; breakfast 07:30 is 90 min before -> pre.
    // T2: over 150 min -> during slot with a rate, no rinse.
    // T4: no hard session within 8 h -> normal mode; the session ends at
    // 13:00 and lunch (12:30) is inside it, so lunch moves to 13:30 and is
    // the first meal within 2 h -> recovery meal.
    // S4: last slot 19:30 to next breakfast 07:30 is 12 h, over 10 h ->
    // bedtime slot 30 min before sleep (23:00) at 22:30.
    const plan = planDay({
      date: '2026-11-08',
      profile: testProfile,
      goal: maintain,
      sessions: [
        session({
          start: '09:00',
          sport: 'ride',
          durationMin: 240,
          intensity: { kind: 'zone', zone: 'Z2' },
          key: true,
        }),
      ],
    });
    expect(plan.slots.map((s) => [s.time, s.guidance])).toEqual([
      ['07:30', 'pre-meal'],
      ['09:00', 'during'],
      ['13:30', 'recovery-meal'],
      ['19:30', 'meal'],
      ['22:30', 'bedtime'],
    ]);
  });

  it('marks standalone fast recovery slots', () => {
    // Main session = most kcal (E3, FTP 250):
    //   a: 90 min Z2, 0.65*250*5400/1000 = 877.5 kJ
    //   b: 45 min Z4, 0.98*250*2700/1000 = 661.5 kJ
    // a ends 07:30; b is high (Z4) and starts 5.5 h later, within 8 h ->
    // fast mode, slots at 07:30, 08:30, 09:30, 10:30. Breakfast at 07:30
    // takes the first; the other three are standalone.
    const plan = planDay({
      date: '2026-11-08',
      profile: testProfile,
      goal: maintain,
      sessions: [
        session({
          id: 'a',
          start: '06:00',
          sport: 'ride',
          durationMin: 90,
          intensity: { kind: 'zone', zone: 'Z2' },
        }),
        session({
          id: 'b',
          start: '13:00',
          sport: 'ride',
          durationMin: 45,
          intensity: { kind: 'zone', zone: 'Z4' },
        }),
      ],
    });
    const recovery = plan.slots.filter((s) => s.kind === 'recovery');
    expect(recovery.map((s) => [s.time, s.guidance])).toEqual([
      ['08:30', 'recovery-fast'],
      ['09:30', 'recovery-fast'],
      ['10:30', 'recovery-fast'],
    ]);
  });
});
