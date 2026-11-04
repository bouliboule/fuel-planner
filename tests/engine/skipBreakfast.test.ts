import { describe, expect, it } from 'vitest';
import { planDay } from '../../src/engine/plan.ts';
import type { PlannedSession } from '../../src/engine/types.ts';
import type { Profile } from '../../src/model/index.ts';
import { maintain, session, testProfile } from './fixtures.ts';

// Test profile: breakfast 07:30 (meal-0), lunch 12:30 (meal-1), dinner 19:30
// (meal-2), sleep 23:00, 75 kg. "Morning" ends at lunch, 12:30 (D49).
const skipping: Profile = { ...testProfile, skipBreakfast: true };

function plan(sessions: PlannedSession[], profile: Profile = skipping) {
  return planDay({ date: '2026-11-05', profile, goal: maintain, sessions });
}

const ids = (r: ReturnType<typeof plan>) => r.slots.map((s) => s.id);

describe('S4 skip breakfast (D49)', () => {
  it('rest day: drops breakfast and spreads its share over the other meals', () => {
    // Day targets do not change: carb 225 g, protein 135 g, fat 95.1875 g.
    // Bedtime: 19:30 to the next first usual meal 07:30 = 12 h > 10 h (D50).
    // Protein: bedtime 0.35 * 75 = 26.25; meals (135 - 26.25) / 2 = 54.375
    // Carbohydrate: no main session, equal weights: 225 / 2 = 112.5
    // Fat: 95.1875 / 2 = 47.59375
    const off = plan([], testProfile);
    const r = plan([]);
    expect(r.macros).toEqual(off.macros);
    expect(ids(r)).toEqual(['meal-1', 'meal-2', 'bedtime']);
    const lunch = r.slots[0];
    expect(lunch?.target.carbG).toBeCloseTo(112.5, 6);
    expect(lunch?.target.proteinG).toBeCloseTo(54.375, 6);
    expect(lunch?.target.fatG).toBeCloseTo(47.59375, 6);
    expect(r.slots.reduce((sum, s) => sum + s.target.kcal, 0)).toBeCloseTo(
      off.macros.kcal,
      6,
    );
    expect(
      r.trace.some((s) => s.ruleId === 'S4' && /breakfast/i.test(s.label)),
    ).toBe(true);
  });

  it('keeps breakfast when off', () => {
    expect(ids(plan([], testProfile)).slice(0, 3)).toEqual([
      'meal-0',
      'meal-1',
      'meal-2',
    ]);
  });

  it('keeps breakfast for a morning session with a pre meal', () => {
    // 240 min Z2 at 09:00: over 90 min -> 2 g/kg pre meal (T1); breakfast
    // 07:30 is 90 min before and becomes the pre meal.
    const r = plan([
      session({
        start: '09:00',
        sport: 'ride',
        durationMin: 240,
        intensity: { kind: 'zone', zone: 'Z2' },
      }),
    ]);
    expect(r.slots.find((s) => s.id === 'meal-0')?.role).toBe('pre');
  });

  it('keeps breakfast for a morning session with only a during slot', () => {
    // 60 min Z1 at 07:00: low band, so no pre meal (T1); 45 min or more, so a
    // during slot (T2, 0 g). Breakfast 07:30 falls inside and moves to 08:30.
    const r = plan([
      session({
        start: '07:00',
        sport: 'ride',
        durationMin: 60,
        intensity: { kind: 'zone', zone: 'Z1' },
      }),
    ]);
    expect(r.slots.find((s) => s.id === 'meal-0')?.time).toBe('08:30');
  });

  it('skips breakfast for a short morning circuit', () => {
    // 15 min strength: under 60 min, no pre meal; under 45 min, no during slot.
    const r = plan([
      session({
        start: '07:00',
        sport: 'strength',
        durationMin: 15,
        intensity: { kind: 'effort', value: 'moderate' },
      }),
    ]);
    expect(ids(r)).not.toContain('meal-0');
  });

  it('skips breakfast when the fueled session starts after lunch time', () => {
    // 90 min Z4 at 18:00 needs fueling but starts after 12:30.
    const r = plan([
      session({
        start: '18:00',
        sport: 'ride',
        durationMin: 90,
        intensity: { kind: 'zone', zone: 'Z4' },
      }),
    ]);
    expect(ids(r)).not.toContain('meal-0');
  });

  it('skips nothing with a single usual meal', () => {
    const one: Profile = {
      ...skipping,
      usualMeals: [{ name: 'Dinner', time: '19:30' }],
    };
    expect(ids(plan([], one))).toContain('meal-0');
  });
});
