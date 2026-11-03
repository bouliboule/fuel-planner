import { describe, expect, it } from 'vitest';
import { planDay, type DayPlan } from '../../src/engine/plan.ts';
import type { PlannedSession } from '../../src/engine/types.ts';
import type { Profile } from '../../src/model/index.ts';
import { maintain, session, testProfile } from './fixtures.ts';

// Test profile times: wake 07:00, breakfast 07:30 (meal-0), lunch 12:30
// (meal-1), dinner 19:30 (meal-2), sleep 23:00. Mass 75 kg, so
// 0.35 g/kg = 26.25 g protein; carbohydrate point 0.5.

function plan(
  sessions: PlannedSession[],
  options: { profile?: Profile; nextDaySessions?: PlannedSession[] } = {},
) {
  return planDay({
    date: '2026-11-05',
    profile: options.profile ?? testProfile,
    goal: maintain,
    sessions,
    nextDaySessions: options.nextDaySessions ?? [],
  });
}

function slot(r: DayPlan, id: string) {
  const s = r.slots.find((x) => x.id === id);
  if (!s)
    throw new Error(`no slot ${id}: ${r.slots.map((x) => x.id).join(', ')}`);
  return s;
}

describe('slot construction', () => {
  it('rest day: three meals and a bedtime slot', () => {
    // last eating 19:30 to next breakfast 07:30 = 12 h > 10 h -> bedtime 22:30
    // carbohydrate 225 g, no main session: 75 g per meal
    // protein: bedtime 26.25; meals (135 - 26.25) / 3 = 36.25
    // fat 95.1875 / 3 = 31.729167 per meal
    const r = plan([]);
    expect(r.slots.map((s) => [s.id, s.time])).toEqual([
      ['meal-0', '07:30'],
      ['meal-1', '12:30'],
      ['meal-2', '19:30'],
      ['bedtime', '22:30'],
    ]);
    for (const id of ['meal-0', 'meal-1', 'meal-2']) {
      expect(slot(r, id).target.carbG).toBeCloseTo(75, 6);
      expect(slot(r, id).target.proteinG).toBeCloseTo(36.25, 6);
      expect(slot(r, id).target.fatG).toBeCloseTo(31.729167, 5);
    }
    const bedtime = slot(r, 'bedtime');
    expect(bedtime.target).toEqual({
      kcal: 105,
      carbG: 0,
      proteinG: 26.25,
      fatG: 0,
    });
    expect(bedtime.targetRanges?.proteinG).toEqual([22.5, 30]);
  });

  it('Thursday 18:00 Z4 90 min: added pre meal, dinner as recovery', () => {
    // Day (M1 fixture): carbohydrate 587.841324, protein 135, fat 80.315703
    // pre: 60 to 90 min, high -> 1 g/kg = 75 g. No usual meal 90 min to 4 h
    //   before 18:00 (lunch is 5.5 h before) -> added at 15:00
    // during: 90 min -> 45 g/h * 1.5 h = 67.5 g, feeds at 20/40/60/80 min,
    //   67.5 / 4 = 16.875 g; fluid 600 * 1.5 = 900 ml; no sodium
    // pre snack: last eating 15:00 is 3 h before, not more -> none
    // dinner 19:30 = session end -> recovery meal
    // bedtime: 19:30 to 07:30 = 12 h -> 22:30
    // remainder 587.841324 - 75 - 67.5 = 445.341324; weights breakfast 1,
    //   lunch 1.5 (last before), dinner 1.5 (first after) = 4
    //   breakfast 445.341324 / 4 = 111.335331; lunch, dinner 167.002997
    // fat 80.315703 / 3 = 26.771901 per meal (the pre slot is not a meal)
    const r = plan([
      session({
        start: '18:00',
        sport: 'ride',
        durationMin: 90,
        intensity: { kind: 'zone', zone: 'Z4' },
        key: true,
      }),
    ]);
    expect(r.slots.map((s) => [s.id, s.time])).toEqual([
      ['meal-0', '07:30'],
      ['meal-1', '12:30'],
      ['pre-s1', '15:00'],
      ['during-s1', '18:00'],
      ['meal-2', '19:30'],
      ['bedtime', '22:30'],
    ]);
    expect(slot(r, 'pre-s1').target.carbG).toBeCloseTo(75, 6);
    expect(slot(r, 'pre-s1').target.proteinG).toBe(0);
    expect(slot(r, 'pre-s1').fibreLimited).toBe(true);
    const during = slot(r, 'during-s1');
    expect(during.target.carbG).toBeCloseTo(67.5, 6);
    expect(during.schedule).toEqual([
      { atMin: 20, carbG: 16.875 },
      { atMin: 40, carbG: 16.875 },
      { atMin: 60, carbG: 16.875 },
      { atMin: 80, carbG: 16.875 },
    ]);
    expect(during.fluidMl).toBeCloseTo(900, 6);
    expect(during.sodiumMg).toBeUndefined();
    expect(slot(r, 'meal-2').role).toBe('recovery');
    expect(slot(r, 'meal-0').target.carbG).toBeCloseTo(111.335331, 5);
    expect(slot(r, 'meal-1').target.carbG).toBeCloseTo(167.002997, 5);
    expect(slot(r, 'meal-2').target.carbG).toBeCloseTo(167.002997, 5);
    expect(slot(r, 'meal-1').target.fatG).toBeCloseTo(26.771901, 5);
    expect(slot(r, 'meal-2').target.proteinG).toBeCloseTo(36.25, 6);
  });

  it('moves a meal less than 90 min before a hard session earlier', () => {
    // 13:00 Z3 120 min (pre meal 2 g/kg): lunch 12:30 is 30 min before ->
    // 13:00 - 90 = 11:30, after wake and >= 07:30 + 2 h -> lunch at 11:30,
    // which is then 90 min before the start -> pre meal, 150 g
    const r = plan([
      session({
        start: '13:00',
        sport: 'ride',
        durationMin: 120,
        intensity: { kind: 'zone', zone: 'Z3' },
      }),
    ]);
    expect(slot(r, 'meal-1').time).toBe('11:30');
    expect(slot(r, 'meal-1').role).toBe('pre');
    expect(slot(r, 'meal-1').target.carbG).toBeCloseTo(150, 6);
    expect(slot(r, 'meal-1').target.fatG).toBe(0);
  });

  it('moves the meal after the session when it cannot go earlier', () => {
    // breakfast 10:30; lunch 12:30 is 30 min before 13:00; 11:30 is less
    // than 2 h after 10:30 -> lunch at session end 15:00 + 30 min = 15:30
    const profile: Profile = {
      ...testProfile,
      usualMeals: [
        { name: 'Breakfast', time: '10:30' },
        { name: 'Lunch', time: '12:30' },
        { name: 'Dinner', time: '19:30' },
      ],
    };
    const r = plan(
      [
        session({
          start: '13:00',
          sport: 'ride',
          durationMin: 120,
          intensity: { kind: 'zone', zone: 'Z3' },
        }),
      ],
      { profile },
    );
    expect(slot(r, 'meal-1').time).toBe('15:30');
    expect(slot(r, 'meal-1').role).toBe('recovery');
  });

  it('adds a pre snack before a morning session', () => {
    // 08:00 Z2 120 min: breakfast 07:30 is 30 min before; 06:30 is before
    // wake -> breakfast at 10:00 + 30 min = 10:30, the recovery meal.
    // 05:00 for an added pre meal is before wake -> none.
    // no eating slot before 08:00 -> pre snack at 07:15, 0.5 * 75 = 37.5 g
    const r = plan([
      session({
        start: '08:00',
        sport: 'ride',
        durationMin: 120,
        intensity: { kind: 'zone', zone: 'Z2' },
      }),
    ]);
    expect(r.slots.some((s) => s.kind === 'pre')).toBe(false);
    const snack = slot(r, 'pre-snack-s1');
    expect(snack.time).toBe('07:15');
    expect(snack.target.carbG).toBeCloseTo(37.5, 6);
    expect(snack.fibreLimited).toBe(true);
    expect(slot(r, 'meal-0').time).toBe('10:30');
    expect(slot(r, 'meal-0').role).toBe('recovery');
  });

  it('uses fast recovery when a hard session follows within 8 h', () => {
    // s1 10:00 to 12:00 Z2 (main: 1165.152 kcal > s2 878.346 kcal)
    // s2 19:00 Z4 60 min, key: 19:00 - 12:00 = 7 h <= 8 h -> fast mode
    // recovery times 12:00, 13:00, 14:00, 15:00 at 1.1 * 75 = 82.5 g each
    // lunch 12:30 is 30 min from 12:00 and 13:00 -> takes 12:00 (earliest)
    // s2 pre meal: 1 g/kg = 75 g, no meal 90 min to 4 h before -> 16:00
    // dinner 19:30 is inside s2 -> 20:00 + 30 min = 20:30
    const r = plan([
      session({
        id: 's1',
        start: '10:00',
        sport: 'ride',
        durationMin: 120,
        intensity: { kind: 'zone', zone: 'Z2' },
        key: true,
      }),
      session({
        id: 's2',
        start: '19:00',
        sport: 'ride',
        durationMin: 60,
        intensity: { kind: 'zone', zone: 'Z4' },
        key: true,
      }),
    ]);
    expect(slot(r, 'meal-1').role).toBe('recovery');
    expect(slot(r, 'meal-1').target.carbG).toBeCloseTo(82.5, 6);
    for (const [id, time] of [
      ['recovery-s1-1', '13:00'],
      ['recovery-s1-2', '14:00'],
      ['recovery-s1-3', '15:00'],
    ] as const) {
      expect(slot(r, id).time).toBe(time);
      expect(slot(r, id).target.carbG).toBeCloseTo(82.5, 6);
      expect(slot(r, id).target.proteinG).toBe(0);
    }
    expect(slot(r, 'pre-s2').time).toBe('16:00');
    expect(slot(r, 'pre-s2').target.carbG).toBeCloseTo(75, 6);
    expect(slot(r, 'meal-2').time).toBe('20:30');
  });

  it('looks at the next day for fast recovery', () => {
    // 19:00 to 21:00 Z2; next day 05:00 key: 05:00 + 24 h - 21:00 = 8 h
    // -> fast mode at 21:00, 22:00, 23:00, 00:00. Dinner 19:30 is inside
    // the ride -> 21:30, 30 min from 21:00 -> takes the first slot.
    const r = plan(
      [
        session({
          start: '19:00',
          sport: 'ride',
          durationMin: 120,
          intensity: { kind: 'zone', zone: 'Z2' },
        }),
      ],
      {
        nextDaySessions: [
          session({
            id: 'n1',
            start: '05:00',
            sport: 'run',
            durationMin: 45,
            intensity: { kind: 'pace', secPerKm: 330 },
            key: true,
          }),
        ],
      },
    );
    expect(slot(r, 'meal-2').time).toBe('21:30');
    expect(slot(r, 'meal-2').role).toBe('recovery');
    expect(slot(r, 'meal-2').target.carbG).toBeCloseTo(82.5, 6);
    expect(slot(r, 'recovery-s1-1').time).toBe('22:00');
    expect(slot(r, 'recovery-s1-3').time).toBe('00:00');
    expect(r.slots.at(-1)?.id).toBe('recovery-s1-3');
  });

  it('adds a standalone recovery slot when no meal follows', () => {
    // 20:00 Z3 90 min (pre 1 g/kg): dinner 19:30 is 30 min before ->
    // 18:30 (after wake, >= 12:30 + 2 h) and becomes the pre meal (75 g).
    // No meal after 21:30 -> recovery slot at 21:30 with 26.25 g protein.
    // last eating 21:30 to 07:30 = 10 h, not over -> no bedtime slot
    const r = plan([
      session({
        start: '20:00',
        sport: 'ride',
        durationMin: 90,
        intensity: { kind: 'zone', zone: 'Z3' },
      }),
    ]);
    expect(slot(r, 'meal-2').time).toBe('18:30');
    expect(slot(r, 'meal-2').role).toBe('pre');
    expect(slot(r, 'meal-2').target.carbG).toBeCloseTo(75, 6);
    const recovery = slot(r, 'recovery-s1');
    expect(recovery.time).toBe('21:30');
    expect(recovery.target.proteinG).toBeCloseTo(26.25, 6);
    expect(recovery.target.fatG).toBe(0);
    expect(r.slots.some((s) => s.kind === 'bedtime')).toBe(false);
  });

  it('flags fixed slots above the day carbohydrate', () => {
    // 09:00 Z1 160 min: all low -> light, 4 g/kg = 300 g
    // pre: breakfast 07:30 is 90 min before -> pre meal, 2 g/kg = 150 g
    // during: 160 > 150 -> 75 g/h * 160 / 60 = 200 g; fixed 350 > 300
    const r = plan([
      session({
        start: '09:00',
        sport: 'ride',
        durationMin: 160,
        intensity: { kind: 'zone', zone: 'Z1' },
      }),
    ]);
    expect(r.load).toBe('light');
    expect(slot(r, 'meal-0').role).toBe('pre');
    expect(slot(r, 'meal-1').target.carbG).toBe(0);
    expect(slot(r, 'meal-2').target.carbG).toBe(0);
    const over = r.warnings.find((w) => w.code === 'carb-over-target');
    expect(over?.ruleId).toBe('S4');
    expect(over?.values?.overG).toBeCloseTo(50, 6);
  });
});
