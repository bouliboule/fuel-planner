import { describe, expect, it } from 'vitest';
import type { DayPlan } from '../../src/engine/plan.ts';
import {
  defaultDay,
  exampleKey,
  mealTag,
  mealTitle,
  showLowFibre,
} from '../../src/features/day/dayText.ts';

type PlanSlot = DayPlan['slots'][number];
const zero = { kcal: 0, carbG: 0, proteinG: 0, fatG: 0 };
const slot = (s: Partial<PlanSlot>): PlanSlot => ({
  id: 'x',
  kind: 'meal',
  time: '12:00',
  target: zero,
  guidance: 'meal',
  ...s,
});

const meals = [{ time: '07:30' }, { time: '19:30' }, { time: '12:30' }];

describe('defaultDay', () => {
  it('opens today until the last usual meal time has passed', () => {
    expect(defaultDay(meals, '07:00')).toBe('today');
    expect(defaultDay(meals, '19:30')).toBe('today');
    expect(defaultDay(meals, '19:31')).toBe('tomorrow');
  });

  it('opens today with no usual meals', () => {
    expect(defaultDay([], '23:00')).toBe('today');
  });
});

describe('meal card text', () => {
  it('names usual meals and tags their role', () => {
    const s = slot({ name: 'Lunch', role: 'recovery' });
    expect(mealTitle(s)).toEqual({ name: 'Lunch' });
    expect(mealTag(s)).toBe('meal.role.recovery');
    expect(mealTag(slot({ name: 'Dinner' }))).toBeUndefined();
  });

  it('names other slots by kind', () => {
    expect(mealTitle(slot({ kind: 'during' }))).toEqual({
      key: 'meal.during',
    });
  });

  it('picks the meal example by name, case-insensitive', () => {
    expect(exampleKey(slot({ name: 'Breakfast' }))).toBe(
      'guidance.example.meal.breakfast',
    );
    expect(exampleKey(slot({ name: 'Snack' }))).toBe(
      'guidance.example.meal.other',
    );
    expect(exampleKey(slot({ kind: 'bedtime', guidance: 'bedtime' }))).toBe(
      'guidance.example.bedtime',
    );
  });

  it('adds the low-fibre line except on pre meals', () => {
    expect(showLowFibre(slot({ fibreLimited: true }))).toBe(true);
    expect(
      showLowFibre(slot({ fibreLimited: true, guidance: 'pre-meal' })),
    ).toBe(false);
    expect(showLowFibre(slot({}))).toBe(false);
  });
});
