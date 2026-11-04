// Pure helpers for the Day screen: which day opens first, and the text keys
// for a meal card's title and example (DOMAIN G1).

import type { DayPlan } from '../../engine/plan.ts';
import type { MessageKey } from '../../i18n/index.ts';

type PlanSlot = DayPlan['slots'][number];

/**
 * Today, or tomorrow once the last usual meal time of today has passed
 * (D45). `now` is the local wall clock, 'HH:mm'.
 */
export function defaultDay(
  usualMeals: readonly { time: string }[],
  now: string,
): 'today' | 'tomorrow' {
  const last = usualMeals
    .map((m) => m.time)
    .sort()
    .at(-1);
  return last !== undefined && now > last ? 'tomorrow' : 'today';
}

/** Card title: the usual meal name, or the slot kind's name. */
export function mealTitle(slot: PlanSlot): { name?: string; key?: MessageKey } {
  if (slot.kind === 'meal' && slot.name) return { name: slot.name };
  return { key: `meal.${slot.kind}` };
}

/** Pre-workout or Post-workout tag on a usual meal that takes that role. */
export function mealTag(slot: PlanSlot): MessageKey | undefined {
  return slot.kind === 'meal' && slot.role
    ? `meal.role.${slot.role}`
    : undefined;
}

const NAMED_MEAL_EXAMPLES = ['breakfast', 'lunch', 'dinner'] as const;

/** G1 example line: `meal` picks its example by the usual meal name. */
export function exampleKey(slot: PlanSlot): MessageKey {
  if (slot.guidance !== 'meal') return `guidance.example.${slot.guidance}`;
  const name = (slot.name ?? '').trim().toLowerCase();
  const known = NAMED_MEAL_EXAMPLES.find((n) => n === name);
  return `guidance.example.meal.${known ?? 'other'}`;
}

/** G1 extra line for fibre-limited slots other than pre meals. */
export function showLowFibre(slot: PlanSlot): boolean {
  return (
    slot.fibreLimited === true &&
    slot.guidance !== 'pre-meal' &&
    slot.guidance !== 'pre'
  );
}
