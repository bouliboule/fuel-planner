// Week helpers: calendar dates (Monday to Sunday), dated sessions from a
// template, and the per-day targets shown in the Week view.

import type { Goal, Profile, Session, WeekTemplate } from '../model/index.ts';
import { planDayTargets, planDayWithFoods, type DayPlan } from './plan.ts';
import type { SolverFood, SolverTemplate } from './portions.ts';
import type { DayLoad, PlannedSession } from './types.ts';

const MS_PER_DAY = 86_400_000;

function toUtc(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return Date.UTC(y ?? 0, (m ?? 1) - 1, d ?? 1);
}

function fromUtc(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** 1 = Monday to 7 = Sunday. */
export function isoWeekday(date: string): number {
  const day = new Date(toUtc(date)).getUTCDay();
  return day === 0 ? 7 : day;
}

export function addDays(date: string, days: number): string {
  return fromUtc(toUtc(date) + days * MS_PER_DAY);
}

/** Monday to Sunday of the week containing `date`. */
export function weekDates(date: string): string[] {
  const monday = addDays(date, 1 - isoWeekday(date));
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

/** The template's sessions dated in the week containing `date`. */
export function sessionsFromTemplate(
  template: WeekTemplate,
  templateId: string,
  date: string,
): Session[] {
  const dates = weekDates(date);
  return template.sessions.map(({ weekday, ...rest }) => ({
    ...rest,
    date: dates[weekday - 1] ?? date,
    source: 'template',
    templateId,
  }));
}

/**
 * The goal in force on `date`: the latest `validFrom` on or before it, or
 * the earliest goal for dates before any goal starts (D30).
 */
export function goalOn<G extends Goal>(
  goals: readonly G[],
  date: string,
): G | undefined {
  const sorted = [...goals].sort((a, b) =>
    a.validFrom.localeCompare(b.validFrom),
  );
  return sorted.filter((g) => g.validFrom <= date).at(-1) ?? sorted[0];
}

export interface WeekDay {
  date: string;
  sessions: PlannedSession[];
  targetKcal: number;
  carbGPerKg: number;
  load: DayLoad;
}

export function weekSummary(input: {
  dates: readonly string[];
  profile: Profile;
  goals: readonly Goal[];
  sessions: readonly PlannedSession[];
}): WeekDay[] {
  const { profile } = input;
  return input.dates.map((date) => {
    const sessions = input.sessions
      .filter((s) => s.date === date)
      .sort((a, b) => a.start.localeCompare(b.start));
    const goal = goalOn(input.goals, date) ?? {
      kind: 'maintain',
      validFrom: date,
    };
    const targets = planDayTargets({ date, profile, goal, sessions });
    return {
      date,
      sessions,
      targetKcal: targets.energy.target,
      carbGPerKg: targets.macros.carbG / profile.massKg,
      load: targets.load,
    };
  });
}

/** Full day plans with foods for each date (S5); tomorrow feeds T4. */
export function planWeek(input: {
  dates: readonly string[];
  profile: Profile;
  goals: readonly Goal[];
  /** Sessions of the dates and of the day after the last one. */
  sessions: readonly PlannedSession[];
  foods: readonly SolverFood[];
  templates: readonly SolverTemplate[];
  foodChoices?: Readonly<
    Record<string, Readonly<Record<string, readonly string[]>>>
  >;
}): DayPlan[] {
  const on = (date: string) => input.sessions.filter((s) => s.date === date);
  return input.dates.map((date) =>
    planDayWithFoods({
      date,
      profile: input.profile,
      goal: goalOn(input.goals, date) ?? { kind: 'maintain', validFrom: date },
      sessions: on(date),
      nextDaySessions: on(addDays(date, 1)),
      foods: input.foods,
      templates: input.templates,
      foodChoices: input.foodChoices?.[date],
    }),
  );
}
