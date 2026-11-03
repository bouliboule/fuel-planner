// Timing rules T1 to T6 (docs/DOMAIN.md section 3).

import type { Goal, Profile } from '../model/index.ts';
import {
  CARB_LOADING_DAYS_BEFORE,
  CARB_LOADING_MIN_EVENT_MIN,
  DURING_FEED_INTERVAL_MIN,
  DURING_G_PER_H_LONG,
  DURING_G_PER_H_MEDIUM,
  DURING_G_PER_H_OVERRIDE_MAX,
  DURING_G_PER_H_OVERRIDE_WARN_ABOVE,
  DURING_MEDIUM_MAX_MIN,
  DURING_NONE_BELOW_MIN,
  DURING_SMALL_BELOW_MIN,
  FLUID_ML_PER_H,
  MULTIPLE_TRANSPORTABLE_ABOVE_G_PER_H,
  PRE_MEAL_G_PER_KG_LONG,
  PRE_MEAL_G_PER_KG_MEDIUM,
  PRE_MEAL_LONG_ABOVE_MIN,
  PRE_MEAL_MEDIUM_FROM_MIN,
  SODIUM_ABOVE_MIN,
  SODIUM_MG_PER_H,
} from './constants.ts';
import { toClock, toMinutes } from './time.ts';
import type { Warning } from './trace.ts';
import type { IntensityBand } from './types.ts';

/** T1: pre meal carbohydrate in g/kg, 0 when the session gets none. */
export function preMealGPerKg(
  durationMin: number,
  band: IntensityBand,
): number {
  if (durationMin > PRE_MEAL_LONG_ABOVE_MIN) return PRE_MEAL_G_PER_KG_LONG;
  if (durationMin >= PRE_MEAL_MEDIUM_FROM_MIN && band !== 'low') {
    return PRE_MEAL_G_PER_KG_MEDIUM;
  }
  return 0;
}

export interface DuringSession {
  carbGPerH: number;
  rangeGPerH?: readonly [number, number];
  totalCarbG: number;
  schedule: { atMin: number; carbG: number }[];
  mouthRinseOptional: boolean;
  needsMultipleTransportableCarbs: boolean;
  fluidMl: number;
  sodiumMg?: number;
  warnings: Warning[];
}

/** T2 and T3: during-session plan, undefined under 45 min. */
export function duringSession(
  durationMin: number,
  profile: Profile,
): DuringSession | undefined {
  if (durationMin < DURING_NONE_BELOW_MIN) return undefined;
  const hours = durationMin / 60;
  const fluidMl = FLUID_ML_PER_H * hours;
  const sodium =
    durationMin > SODIUM_ABOVE_MIN ? { sodiumMg: SODIUM_MG_PER_H * hours } : {};

  if (durationMin < DURING_SMALL_BELOW_MIN) {
    return {
      carbGPerH: 0,
      totalCarbG: 0,
      schedule: [],
      mouthRinseOptional: true,
      needsMultipleTransportableCarbs: false,
      fluidMl,
      ...sodium,
      warnings: [],
    };
  }

  const long = durationMin > DURING_MEDIUM_MAX_MIN;
  const range = long ? DURING_G_PER_H_LONG : DURING_G_PER_H_MEDIUM;
  const warnings: Warning[] = [];
  let carbGPerH = range[0] + profile.carbPointInRange * (range[1] - range[0]);
  const override = profile.onBikeCarbTargetGPerH;
  if (long && override !== undefined) {
    carbGPerH = override;
    if (override > DURING_G_PER_H_OVERRIDE_WARN_ABOVE) {
      warnings.push({
        code: 'during-rate-above-90',
        ruleId: 'T2',
        values: { carbGPerH: override },
      });
    }
    if (override > DURING_G_PER_H_OVERRIDE_MAX) {
      carbGPerH = DURING_G_PER_H_OVERRIDE_MAX;
      warnings.push({
        code: 'during-rate-capped',
        ruleId: 'T2',
        values: {
          requestedGPerH: override,
          capGPerH: DURING_G_PER_H_OVERRIDE_MAX,
        },
      });
    }
  }

  const totalCarbG = carbGPerH * hours;
  const feedTimes: number[] = [];
  for (
    let at = DURING_FEED_INTERVAL_MIN;
    at < durationMin;
    at += DURING_FEED_INTERVAL_MIN
  ) {
    feedTimes.push(at);
  }
  const perFeed = feedTimes.length > 0 ? totalCarbG / feedTimes.length : 0;
  return {
    carbGPerH,
    rangeGPerH: range,
    totalCarbG,
    schedule: feedTimes.map((atMin) => ({ atMin, carbG: perFeed })),
    mouthRinseOptional: false,
    needsMultipleTransportableCarbs:
      carbGPerH > MULTIPLE_TRANSPORTABLE_ABOVE_G_PER_H,
    fluidMl,
    ...sodium,
    warnings,
  };
}

function dayNumber(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return Date.UTC(y ?? 0, (m ?? 1) - 1, d ?? 1) / 86_400_000;
}

/** T5: true on the two days before an event over 90 min. */
export function carbLoadingDay(date: string, goal: Goal): boolean {
  const event = goal.event;
  if (!event || event.expectedDurationMin <= CARB_LOADING_MIN_EVENT_MIN)
    return false;
  const daysBefore = dayNumber(event.date) - dayNumber(date);
  return daysBefore >= 1 && daysBefore <= CARB_LOADING_DAYS_BEFORE;
}

export interface WindowSlot {
  id: string;
  kind: string;
  time: string;
  kcal: number;
  sessionId?: string;
}

const FUELING_KINDS = new Set(['pre', 'pre-snack', 'during', 'recovery']);

/**
 * T6: a warning for every slot with energy outside the eating window, then a
 * suggestion when a fueling slot is outside: a window of the same length
 * from the earliest fueling slot, or moving the session.
 */
export function eatingWindowWarnings(
  window: { start: string; end: string },
  sessions: readonly { id: string; start: string; durationMin: number }[],
  slots: readonly WindowSlot[],
): Warning[] {
  const start = toMinutes(window.start);
  const end = toMinutes(window.end);
  const outside = (t: number) => t < start || t > end;
  const warnings: Warning[] = [];
  let fuelingConflict: WindowSlot | undefined;
  for (const slot of slots) {
    if (slot.kcal <= 0 || !outside(toMinutes(slot.time))) continue;
    warnings.push({
      code: 'eating-window-conflict',
      ruleId: 'T6',
      values: { slotId: slot.id, time: slot.time },
    });
    if (!fuelingConflict && FUELING_KINDS.has(slot.kind))
      fuelingConflict = slot;
  }
  if (!fuelingConflict) return warnings;

  let first = Infinity;
  let last = -Infinity;
  for (const slot of slots) {
    if (slot.kcal <= 0 || !FUELING_KINDS.has(slot.kind)) continue;
    const t = toMinutes(slot.time);
    first = Math.min(first, t);
    const session =
      slot.kind === 'during'
        ? sessions.find((s) => s.id === slot.sessionId)
        : undefined;
    last = Math.max(last, session ? t + session.durationMin : t);
  }
  const length = end - start;
  if (last - first <= length) {
    warnings.push({
      code: 'eating-window-suggest-window',
      ruleId: 'T6',
      values: { start: toClock(first), end: toClock(first + length) },
    });
  } else {
    warnings.push({
      code: 'eating-window-suggest-move-session',
      ruleId: 'T6',
      values: { sessionId: fuelingConflict.sessionId ?? '' },
    });
  }
  return warnings;
}
