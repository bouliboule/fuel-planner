import { describe, expect, it } from 'vitest';
import { planDayWithFoods } from '../../src/engine/plan.ts';
import { planWeek, weekDates } from '../../src/engine/week.ts';
import { testFoods } from './foods.ts';
import { maintain, session, testProfile } from './fixtures.ts';

// A seed-shaped week with test start times and durations (Q9).
const week = weekDates('2026-11-04');
const day = (i: number) => week[i] ?? '';
const sessions = [
  session({
    id: 'mon',
    date: day(0),
    start: '18:30',
    sport: 'run',
    durationMin: 60,
    intensity: { kind: 'pace', secPerKm: 300 },
    key: true,
  }),
  session({
    id: 'tue-s',
    date: day(1),
    start: '07:00',
    sport: 'strength',
    durationMin: 15,
    intensity: { kind: 'rpe', value: 5 },
  }),
  session({
    id: 'tue',
    date: day(1),
    start: '08:00',
    sport: 'pilates',
    durationMin: 50,
    intensity: { kind: 'rpe', value: 4 },
  }),
  session({
    id: 'wed',
    date: day(2),
    start: '18:00',
    sport: 'ride',
    indoor: true,
    durationMin: 60,
    intensity: { kind: 'zone', zone: 'SS' },
    key: true,
  }),
  session({
    id: 'thu',
    date: day(3),
    start: '18:30',
    sport: 'ride',
    durationMin: 90,
    intensity: { kind: 'zone', zone: 'Z4' },
    key: true,
  }),
  session({
    id: 'fri',
    date: day(4),
    start: '12:00',
    sport: 'ride',
    durationMin: 60,
    intensity: { kind: 'zone', zone: 'Z2' },
  }),
  session({
    id: 'sat',
    date: day(5),
    start: '10:00',
    sport: 'ride',
    durationMin: 90,
    intensity: { kind: 'zone', zone: 'Z2' },
  }),
  session({
    id: 'sun',
    date: day(6),
    start: '09:30',
    sport: 'ride',
    durationMin: 240,
    intensity: { kind: 'zone', zone: 'Z2' },
    key: true,
  }),
];
const input = {
  dates: week,
  profile: testProfile,
  goals: [maintain],
  sessions,
  foods: testFoods,
  templates: [],
};

describe('planWeek with foods', () => {
  it('fills every slot with picks or a gap warning', () => {
    const days = planWeek(input);
    expect(days).toHaveLength(7);
    for (const day of days) {
      for (const slot of day.slots) {
        expect(slot.picks).toBeDefined();
        const flagged = day.warnings.some(
          (w) => w.code === 'slot-gap' && w.values?.slotId === slot.id,
        );
        expect(
          slot.withinTolerance === true || flagged,
          `${day.date} ${slot.id}`,
        ).toBe(true);
      }
    }
  });

  it('keeps portions on their steps and inside their bounds', () => {
    const byId = new Map(testFoods.map((f) => [f.id, f]));
    for (const day of planWeek(input)) {
      for (const slot of day.slots) {
        for (const pick of slot.picks ?? []) {
          const food = byId.get(pick.foodId);
          if (!food) throw new Error(pick.foodId);
          expect(pick.grams % food.portion.stepG).toBe(0);
          expect(pick.grams).toBeGreaterThanOrEqual(food.portion.minG);
          expect(pick.grams).toBeLessThanOrEqual(food.portion.maxG);
        }
      }
    }
  });

  it('plans the week in under 50 ms (200 ms phone budget, D33)', () => {
    planWeek(input); // warm up
    const runs = 5;
    const start = performance.now();
    for (let i = 0; i < runs; i++) planWeek(input);
    const perWeek = (performance.now() - start) / runs;
    expect(perWeek).toBeLessThan(50);
  });

  it('solves only the chosen foods after a swap', () => {
    const plan = planDayWithFoods({
      date: day(6),
      profile: testProfile,
      goal: maintain,
      sessions: sessions.slice(7),
      foods: testFoods,
      templates: [],
      foodChoices: { 'during-sun': ['banana'] },
    });
    const during = plan.slots.find((s) => s.id === 'during-sun');
    expect(during?.pickSource).toBe('choice');
    expect(during?.picks?.map((p) => p.foodId)).toEqual(['banana']);
  });
});
