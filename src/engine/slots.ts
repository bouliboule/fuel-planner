// Slot construction (docs/DOMAIN.md section 4, rule ID S4): places pre,
// during, recovery, meal and bedtime slots around the day's sessions and
// splits the day's macros across them so the slots add up to the targets.

import type { Profile } from '../model/index.ts';
import {
  BEDTIME_BEFORE_SLEEP_MIN,
  BEDTIME_GAP_ABOVE_MIN,
  FAST_RECOVERY_G_PER_KG_PER_H,
  FAST_RECOVERY_G_PER_KG_PER_H_RANGE,
  FAST_RECOVERY_HOURS,
  FAST_RECOVERY_MEAL_MATCH_MIN,
  FAST_RECOVERY_NEXT_HARD_WITHIN_MIN,
  KCAL_PER_G_CARB,
  KCAL_PER_G_FAT,
  KCAL_PER_G_PROTEIN,
  MAIN_SESSION_MEAL_WEIGHT,
  MEAL_AFTER_SESSION_MIN,
  MEAL_BEFORE_HARD_MIN,
  MEAL_MIN_GAP_MIN,
  OCCASION_PROTEIN_G_PER_KG,
  PRE_MEAL_ADDED_BEFORE_MIN,
  PRE_MEAL_G_PER_KG_RANGE,
  PRE_MEAL_WINDOW_MIN,
  PRE_SNACK_BEFORE_MIN,
  PRE_SNACK_G_PER_KG,
  PRE_SNACK_LAST_MEAL_GAP_MIN,
  PROTEIN_PER_OCCASION_G_PER_KG_RANGE,
  RECOVERY_MEAL_WITHIN_MIN,
  RECOVERY_MIN_SESSION_MIN,
} from './constants.ts';
import { MINUTES_PER_DAY, toClock, toMinutes } from './time.ts';
import type { DuringSession } from './timing.ts';
import { step, type TraceStep, type Warning } from './trace.ts';
import type { IntensityBand } from './types.ts';

export type SlotKind =
  'meal' | 'pre' | 'pre-snack' | 'during' | 'recovery' | 'snack' | 'bedtime';

export interface Macros {
  kcal: number;
  carbG: number;
  proteinG: number;
  fatG: number;
}

export interface Slot {
  id: string;
  kind: SlotKind;
  time: string;
  name?: string;
  role?: 'pre' | 'recovery';
  sessionId?: string;
  target: Macros;
  targetRanges?: {
    kcal?: readonly [number, number];
    carbG?: readonly [number, number];
    proteinG?: readonly [number, number];
  };
  carbGPerH?: number;
  fluidMl?: number;
  sodiumMg?: number;
  schedule?: { atMin: number; carbG: number }[];
  needsMultipleTransportableCarbs?: boolean;
  mouthRinseOptional?: boolean;
  fibreLimited?: boolean;
  /** Standalone recovery slots: T4 fast or normal mode. */
  recoveryMode?: 'fast' | 'normal';
}

/** A session of the day with what the slot rules need. */
export interface SlotSession {
  id: string;
  startMin: number;
  durationMin: number;
  band: IntensityBand;
  key: boolean;
  kcal: number;
  preMealGPerKg: number;
  during?: DuringSession;
}

interface Work {
  id: string;
  kind: SlotKind;
  timeMin: number;
  name?: string;
  role?: 'pre' | 'recovery';
  sessionId?: string;
  fixedCarbG?: number;
  fixedProteinG?: number;
  carbRange?: readonly [number, number];
  /** Usual meals: user-set kcal range and size weight (DOMAIN S4, D55). */
  kcalRange?: readonly [number, number];
  sizeWeight?: number;
  fibreLimited?: boolean;
  recoveryMode?: 'fast' | 'normal';
  during?: DuringSession;
}

const endOf = (s: SlotSession) => s.startMin + s.durationMin;
const isHard = (s: { band: IntensityBand; key: boolean }) =>
  s.band === 'high' || s.key;

export function buildSlots(input: {
  profile: Profile;
  sessions: readonly SlotSession[];
  nextDaySessions: readonly {
    startMin: number;
    band: IntensityBand;
    key: boolean;
  }[];
  targets: Macros;
  carbLoading: boolean;
}): { slots: Slot[]; warnings: Warning[]; trace: TraceStep[] } {
  const { profile, targets, carbLoading } = input;
  const mass = profile.massKg;
  const wake = toMinutes(profile.wakeTime);
  const sleep = toMinutes(profile.sleepTime);
  const sessions = [...input.sessions].sort((a, b) => a.startMin - b.startMin);
  const warnings: Warning[] = [];
  const trace: TraceStep[] = [];
  const insideSession = (t: number) =>
    sessions.find((s) => t >= s.startMin && t < endOf(s));

  // Step 3 first for usual meals, so later steps see their final times.
  // Meal size weight (D55): range midpoint over the mean midpoint of the
  // profile's usual meals with a range; 1 without a range.
  const mid = (r: readonly [number, number]) => (r[0] + r[1]) / 2;
  const mids = profile.usualMeals.flatMap((m) =>
    m.kcalRange ? [mid(m.kcalRange)] : [],
  );
  const meanMid = mids.reduce((a, b) => a + b, 0) / mids.length;
  const usual = profile.usualMeals
    .map((m, i) => ({
      id: `meal-${String(i)}`,
      name: m.name,
      time: toMinutes(m.time),
      kcalRange: m.kcalRange,
      sizeWeight: m.kcalRange ? mid(m.kcalRange) / meanMid : 1,
    }))
    .sort((a, b) => a.time - b.time);
  // Skip breakfast (D49): the first usual meal goes unless a session that
  // needs fueling (pre meal or during slot) starts before the second one.
  const [breakfast, second] = usual;
  if (profile.skipBreakfast && breakfast && second) {
    const fueledMorning = sessions.some(
      (s) =>
        s.startMin < second.time &&
        (s.preMealGPerKg > 0 || s.during !== undefined),
    );
    if (!fueledMorning) {
      usual.shift();
      trace.push(
        step(
          'S4',
          'Breakfast skipped: no session needing fuel before the second meal',
          {
            mealTime: toClock(breakfast.time),
            morningEndsAt: toClock(second.time),
          },
          0,
        ),
      );
    }
  }
  const meals: Work[] = usual.map((m) => ({
    id: m.id,
    kind: 'meal',
    timeMin: m.time,
    name: m.name,
    ...(m.kcalRange ? { kcalRange: m.kcalRange } : {}),
    sizeWeight: m.sizeWeight,
  }));
  if (mids.length > 0) {
    trace.push(
      step(
        'S4',
        'Meal size weight: kcal range midpoint / mean midpoint',
        { meanMidpointKcal: meanMid },
        mids.length,
      ),
    );
  }
  let previousMeal: number | undefined;
  for (const meal of meals) {
    const inside = insideSession(meal.timeMin);
    if (inside) {
      meal.timeMin = endOf(inside) + MEAL_AFTER_SESSION_MIN;
    } else {
      const hard = sessions.find(
        (s) =>
          s.preMealGPerKg > 0 &&
          meal.timeMin < s.startMin &&
          s.startMin - meal.timeMin < MEAL_BEFORE_HARD_MIN,
      );
      if (hard) {
        const earlier = hard.startMin - MEAL_BEFORE_HARD_MIN;
        const fits =
          earlier >= wake &&
          (previousMeal === undefined ||
            earlier >= previousMeal + MEAL_MIN_GAP_MIN);
        meal.timeMin = fits ? earlier : endOf(hard) + MEAL_AFTER_SESSION_MIN;
      }
    }
    previousMeal = meal.timeMin;
  }
  meals.sort((a, b) => a.timeMin - b.timeMin);
  const slots: Work[] = [...meals];

  // Step 2, T1: pre meals.
  for (const s of sessions) {
    if (s.preMealGPerKg === 0) continue;
    const carbG = s.preMealGPerKg * mass;
    const carbRange: readonly [number, number] = [
      PRE_MEAL_G_PER_KG_RANGE[0] * mass,
      PRE_MEAL_G_PER_KG_RANGE[1] * mass,
    ];
    const candidate = meals
      .filter((m) => {
        const before = s.startMin - m.timeMin;
        return (
          m.role === undefined &&
          before >= PRE_MEAL_WINDOW_MIN[0] &&
          before <= PRE_MEAL_WINDOW_MIN[1]
        );
      })
      .at(-1);
    if (candidate) {
      Object.assign(candidate, {
        role: 'pre',
        sessionId: s.id,
        fixedCarbG: carbG,
        carbRange,
        fibreLimited: true,
      });
    } else {
      const t = s.startMin - PRE_MEAL_ADDED_BEFORE_MIN;
      if (t >= wake && !insideSession(t)) {
        slots.push({
          id: `pre-${s.id}`,
          kind: 'pre',
          timeMin: t,
          sessionId: s.id,
          fixedCarbG: carbG,
          carbRange,
          fibreLimited: true,
        });
      }
    }
    trace.push(
      step(
        'T1',
        'Pre meal: g/kg * mass',
        { sessionId: s.id, gPerKg: s.preMealGPerKg, massKg: mass },
        carbG,
      ),
    );
  }

  // Step 2, T2: during slots.
  for (const s of sessions) {
    if (!s.during) continue;
    slots.push({
      id: `during-${s.id}`,
      kind: 'during',
      timeMin: s.startMin,
      sessionId: s.id,
      fixedCarbG: s.during.totalCarbG,
      ...(s.during.rangeGPerH
        ? {
            carbRange: [
              (s.during.rangeGPerH[0] * s.durationMin) / 60,
              (s.during.rangeGPerH[1] * s.durationMin) / 60,
            ] as const,
          }
        : {}),
      during: s.during,
    });
    warnings.push(...s.during.warnings);
    trace.push(
      step(
        'T2',
        'During: g/h * hours',
        {
          sessionId: s.id,
          carbGPerH: s.during.carbGPerH,
          hours: s.durationMin / 60,
        },
        s.during.totalCarbG,
      ),
    );
  }

  // Step 2, T4: recovery for the main session.
  const main = sessions.reduce<SlotSession | undefined>(
    (top, s) => (top === undefined || s.kcal > top.kcal ? s : top),
    undefined,
  );
  let normalRecoverySlot: Work | undefined;
  if (main && main.durationMin >= RECOVERY_MIN_SESSION_MIN) {
    const end = endOf(main);
    const within = (start: number) =>
      start >= end && start - end <= FAST_RECOVERY_NEXT_HARD_WITHIN_MIN;
    const fast =
      sessions.some((s) => s !== main && isHard(s) && within(s.startMin)) ||
      input.nextDaySessions.some(
        (s) => isHard(s) && within(s.startMin + MINUTES_PER_DAY),
      );
    if (fast) {
      const carbG = FAST_RECOVERY_G_PER_KG_PER_H * mass;
      const carbRange: readonly [number, number] = [
        FAST_RECOVERY_G_PER_KG_PER_H_RANGE[0] * mass,
        FAST_RECOVERY_G_PER_KG_PER_H_RANGE[1] * mass,
      ];
      for (let k = 0; k < FAST_RECOVERY_HOURS; k++) {
        const t = end + k * 60;
        const meal = meals
          .filter(
            (m) =>
              m.role === undefined &&
              Math.abs(m.timeMin - t) <= FAST_RECOVERY_MEAL_MATCH_MIN,
          )
          .sort(
            (a, b) =>
              Math.abs(a.timeMin - t) - Math.abs(b.timeMin - t) ||
              a.timeMin - b.timeMin,
          )[0];
        if (meal) {
          Object.assign(meal, {
            role: 'recovery',
            sessionId: main.id,
            fixedCarbG: carbG,
            carbRange,
          });
        } else {
          slots.push({
            id: `recovery-${main.id}-${String(k)}`,
            kind: 'recovery',
            recoveryMode: 'fast',
            timeMin: t,
            sessionId: main.id,
            fixedCarbG: carbG,
            carbRange,
            ...(k === 0
              ? { fixedProteinG: OCCASION_PROTEIN_G_PER_KG * mass }
              : {}),
          });
        }
      }
      trace.push(
        step(
          'T4',
          'Fast recovery: 1.1 g/kg per hour for 4 h',
          {
            sessionId: main.id,
            gPerKgPerH: FAST_RECOVERY_G_PER_KG_PER_H,
            hours: FAST_RECOVERY_HOURS,
            massKg: mass,
          },
          carbG * FAST_RECOVERY_HOURS,
        ),
      );
    } else {
      const free = meals.filter(
        (m) => m.role === undefined && m.timeMin >= end,
      );
      const soon = free.find(
        (m) => m.timeMin - end <= RECOVERY_MEAL_WITHIN_MIN,
      );
      const next = soon ?? free[0];
      if (next) {
        if (!soon) next.timeMin = end + RECOVERY_MEAL_WITHIN_MIN;
        Object.assign(next, { role: 'recovery', sessionId: main.id });
      } else {
        normalRecoverySlot = {
          id: `recovery-${main.id}`,
          kind: 'recovery',
          recoveryMode: 'normal',
          timeMin: end,
          sessionId: main.id,
          fixedProteinG: OCCASION_PROTEIN_G_PER_KG * mass,
        };
        slots.push(normalRecoverySlot);
      }
      trace.push(
        step(
          'T4',
          'Recovery: normal meals, next meal within 2 h',
          { sessionId: main.id },
          0,
        ),
      );
    }
  }

  // Step 2, T1: pre snacks, once every other eating slot is placed.
  const eats = (w: Work) => w.kind !== 'during' || (w.fixedCarbG ?? 0) > 0;
  for (const s of sessions) {
    if (s.preMealGPerKg === 0 && !s.during) continue;
    const before = slots
      .filter((w) => eats(w) && w.timeMin < s.startMin)
      .map((w) => w.timeMin);
    const last = before.length > 0 ? Math.max(...before) : undefined;
    const t = s.startMin - PRE_SNACK_BEFORE_MIN;
    if (
      (last === undefined || s.startMin - last > PRE_SNACK_LAST_MEAL_GAP_MIN) &&
      t >= wake
    ) {
      slots.push({
        id: `pre-snack-${s.id}`,
        kind: 'pre-snack',
        timeMin: t,
        sessionId: s.id,
        fixedCarbG: PRE_SNACK_G_PER_KG * mass,
        fibreLimited: true,
      });
    }
  }

  // M1: bedtime slot when the overnight gap is over 10 h.
  if (meals.length > 0) {
    const lastEating = Math.max(...slots.filter(eats).map((w) => w.timeMin));
    const firstMealTomorrow =
      Math.min(...profile.usualMeals.map((m) => toMinutes(m.time))) +
      MINUTES_PER_DAY;
    const t = sleep - BEDTIME_BEFORE_SLEEP_MIN;
    if (
      firstMealTomorrow - lastEating > BEDTIME_GAP_ABOVE_MIN &&
      t > lastEating
    ) {
      slots.push({
        id: 'bedtime',
        kind: 'bedtime',
        timeMin: t,
        fixedProteinG: OCCASION_PROTEIN_G_PER_KG * mass,
      });
    }
  }

  slots.sort((a, b) => a.timeMin - b.timeMin);

  // Steps 4 to 6: protein, carbohydrate, fat.
  const carbG = new Map<Work, number>();
  const proteinG = new Map<Work, number>();
  const fatG = new Map<Work, number>();

  const fixedProtein = slots.reduce(
    (sum, w) => sum + (w.fixedProteinG ?? 0),
    0,
  );
  const mealSlots = slots.filter((w) => w.kind === 'meal');
  const mealProtein =
    mealSlots.length > 0
      ? Math.max(0, targets.proteinG - fixedProtein) / mealSlots.length
      : 0;
  if (mealSlots.length === 0 && targets.proteinG - fixedProtein > 0) {
    warnings.push({
      code: 'protein-unassigned',
      ruleId: 'S4',
      values: { unassignedG: targets.proteinG - fixedProtein },
    });
  }
  for (const w of slots) {
    proteinG.set(w, w.kind === 'meal' ? mealProtein : (w.fixedProteinG ?? 0));
  }

  const fixedCarb = slots.reduce((sum, w) => sum + (w.fixedCarbG ?? 0), 0);
  const remainderSlots = slots.filter(
    (w) =>
      w.fixedCarbG === undefined &&
      (w.kind === 'meal' || w === normalRecoverySlot),
  );
  const size = (w: Work) => w.sizeWeight ?? 1;
  const weights = new Map<Work, number>(
    remainderSlots.map((w) => [w, size(w)]),
  );
  if (main) {
    const before = remainderSlots
      .filter((w) => w.timeMin < main.startMin)
      .at(-1);
    const after = remainderSlots.find((w) => w.timeMin >= endOf(main));
    for (const w of [before, after]) {
      if (w) weights.set(w, size(w) * MAIN_SESSION_MEAL_WEIGHT);
    }
  }
  const remainder = targets.carbG - fixedCarb;
  const totalWeight = [...weights.values()].reduce((a, b) => a + b, 0);
  if (remainder < 0) {
    warnings.push({
      code: 'carb-over-target',
      ruleId: 'S4',
      values: { overG: -remainder },
    });
  } else if (remainder > 0 && remainderSlots.length === 0) {
    warnings.push({
      code: 'carb-unassigned',
      ruleId: 'S4',
      values: { unassignedG: remainder },
    });
  }
  for (const w of slots) {
    const weight = weights.get(w);
    carbG.set(
      w,
      w.fixedCarbG ??
        (weight !== undefined && remainder > 0
          ? (remainder * weight) / totalWeight
          : 0),
    );
  }
  trace.push(
    step(
      'S4',
      'Carbohydrate remainder: day target - fixed slots, by meal weight',
      {
        dayCarbG: targets.carbG,
        fixedCarbG: fixedCarb,
        slots: remainderSlots.length,
      },
      remainder,
    ),
  );

  const fatSlots = mealSlots.filter((w) => w.role !== 'pre');
  if (fatSlots.length === 0 && targets.fatG > 0) {
    warnings.push({
      code: 'fat-unassigned',
      ruleId: 'S4',
      values: { unassignedG: targets.fatG },
    });
  }
  const fatWeight = fatSlots.reduce((sum, w) => sum + size(w), 0);
  for (const w of slots) {
    fatG.set(
      w,
      fatSlots.includes(w) ? (targets.fatG * size(w)) / fatWeight : 0,
    );
  }

  const proteinRange: readonly [number, number] = [
    PROTEIN_PER_OCCASION_G_PER_KG_RANGE[0] * mass,
    PROTEIN_PER_OCCASION_G_PER_KG_RANGE[1] * mass,
  ];
  const result: Slot[] = slots.map((w) => {
    const c = carbG.get(w) ?? 0;
    const p = proteinG.get(w) ?? 0;
    const f = fatG.get(w) ?? 0;
    const hasProtein = w.kind === 'meal' || w.fixedProteinG !== undefined;
    const ranges = {
      ...(w.kcalRange ? { kcal: w.kcalRange } : {}),
      ...(w.carbRange ? { carbG: w.carbRange } : {}),
      ...(hasProtein ? { proteinG: proteinRange } : {}),
    };
    const kcal =
      KCAL_PER_G_CARB * c + KCAL_PER_G_PROTEIN * p + KCAL_PER_G_FAT * f;
    if (w.kcalRange && (kcal < w.kcalRange[0] || kcal > w.kcalRange[1])) {
      warnings.push({
        code:
          kcal > w.kcalRange[1]
            ? 'meal-kcal-above-range'
            : 'meal-kcal-below-range',
        ruleId: 'S4',
        values: { slotId: w.id },
      });
    }
    const d = w.during;
    return {
      id: w.id,
      kind: w.kind,
      time: toClock(w.timeMin),
      ...(w.name === undefined ? {} : { name: w.name }),
      ...(w.role === undefined ? {} : { role: w.role }),
      ...(w.sessionId === undefined ? {} : { sessionId: w.sessionId }),
      ...(w.recoveryMode === undefined ? {} : { recoveryMode: w.recoveryMode }),
      target: {
        kcal,
        carbG: c,
        proteinG: p,
        fatG: f,
      },
      ...(Object.keys(ranges).length > 0 ? { targetRanges: ranges } : {}),
      ...(d
        ? {
            carbGPerH: d.carbGPerH,
            fluidMl: d.fluidMl,
            ...(d.sodiumMg === undefined ? {} : { sodiumMg: d.sodiumMg }),
            schedule: d.schedule,
            needsMultipleTransportableCarbs: d.needsMultipleTransportableCarbs,
            mouthRinseOptional: d.mouthRinseOptional,
          }
        : {}),
      ...(w.fibreLimited || carbLoading ? { fibreLimited: true } : {}),
    };
  });
  return { slots: result, warnings, trace };
}
