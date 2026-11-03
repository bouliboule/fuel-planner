// Day plan: energy (E1 to E7), load and macros (M1 to M3), then timing and
// slots (T1 to T6, section 4).

import type { Goal, Profile } from '../model/index.ts';
import {
  ageInYear,
  energyAvailability,
  goalAdjustment,
  nonExerciseEnergy,
  restingEnergy,
  sessionEnergy,
  type EnergyAvailability,
  type SessionEnergy,
} from './energy.ts';
import { classifyDayLoad, sessionIntensityBand } from './load.ts';
import { carbohydrateTarget, fatTarget, proteinTarget } from './macros.ts';
import { buildSlots, type Slot } from './slots.ts';
import { toMinutes } from './time.ts';
import {
  carbLoadingDay,
  duringSession,
  eatingWindowWarnings,
  preMealGPerKg,
} from './timing.ts';
import { step, type TraceStep, type Warning } from './trace.ts';
import type { DayLoad, PlannedSession } from './types.ts';

export interface DayTargetsInput {
  date: string;
  profile: Profile;
  goal: Goal;
  sessions: readonly PlannedSession[];
}

export interface Macros {
  kcal: number;
  carbG: number;
  proteinG: number;
  fatG: number;
}

export interface DayTargets {
  date: string;
  energy: {
    bmr: number;
    bmrMethod: 'mifflin-st-jeor' | 'katch-mcardle';
    nonExercise: number;
    exercise: Pick<
      SessionEnergy,
      'sessionId' | 'kcal' | 'method' | 'compendiumCode'
    >[];
    exerciseTotal: number;
    tdee: number;
    goalAdjustment: number;
    target: number;
  };
  load: DayLoad;
  carbLoading: boolean;
  carbRangeGPerKg: readonly [number, number];
  macros: Macros;
  energyAvailability: Pick<
    EnergyAvailability,
    'kcalPerKgFfm' | 'ffmKg' | 'ffmEstimated'
  >;
  warnings: Warning[];
  trace: TraceStep[];
}

export function planDayTargets(input: DayTargetsInput): DayTargets {
  const { date, profile, goal, sessions } = input;
  const trace: TraceStep[] = [];
  const warnings: Warning[] = [];

  const bmr = restingEnergy(profile, ageInYear(date, profile.birthYear));
  const base = nonExerciseEnergy(bmr.kcal, profile.neaFactor);
  trace.push(...bmr.trace, ...base.trace);

  const perSession = sessions.map((s) => {
    const energy = sessionEnergy(s, profile);
    trace.push(...energy.trace);
    warnings.push(...energy.warnings);
    return {
      energy,
      durationMin: s.durationMin,
      band: sessionIntensityBand(s, profile, energy.kcal),
    };
  });
  const exerciseTotal = perSession.reduce((sum, s) => sum + s.energy.kcal, 0);
  const tdee = base.kcal + exerciseTotal;
  trace.push(
    step(
      'E5',
      'TDEE: daily base + exercise',
      { dailyBaseKcal: base.kcal, exerciseKcal: exerciseTotal },
      tdee,
    ),
  );

  const adjustment = goalAdjustment({ goal, massKg: profile.massKg, sessions });
  trace.push(...adjustment.trace);
  warnings.push(...adjustment.warnings);
  const target = tdee + adjustment.kcal;

  const load = classifyDayLoad(perSession);
  trace.push(...load.trace);

  const carbLoading = carbLoadingDay(date, goal);
  const protein = proteinTarget(profile);
  const carb = carbohydrateTarget(load.load, profile, carbLoading);
  const fat = fatTarget({
    targetKcal: target,
    proteinG: protein.g,
    carbG: carb.g,
    carbLowerG: carb.lowerG,
    massKg: profile.massKg,
  });
  trace.push(...protein.trace, ...carb.trace, ...fat.trace);
  warnings.push(...fat.warnings);

  const ea = energyAvailability({
    intakeKcal: fat.kcal,
    exerciseKcal: exerciseTotal,
    profile,
  });
  trace.push(...ea.trace);
  warnings.push(...ea.warnings);

  return {
    date,
    energy: {
      bmr: bmr.kcal,
      bmrMethod: bmr.method,
      nonExercise: base.kcal,
      exercise: perSession.map(({ energy }) => ({
        sessionId: energy.sessionId,
        kcal: energy.kcal,
        method: energy.method,
        ...(energy.compendiumCode === undefined
          ? {}
          : { compendiumCode: energy.compendiumCode }),
      })),
      exerciseTotal,
      tdee,
      goalAdjustment: adjustment.kcal,
      target,
    },
    load: load.load,
    carbLoading,
    carbRangeGPerKg: carb.rangeGPerKg,
    macros: {
      kcal: fat.kcal,
      carbG: fat.carbG,
      proteinG: protein.g,
      fatG: fat.fatG,
    },
    energyAvailability: {
      kcalPerKgFfm: ea.kcalPerKgFfm,
      ffmKg: ea.ffmKg,
      ffmEstimated: ea.ffmEstimated,
    },
    warnings,
    trace,
  };
}

export interface DayPlanInput extends DayTargetsInput {
  /** The next day's sessions, for the T4 fast-recovery lookahead. */
  nextDaySessions?: readonly PlannedSession[];
}

export interface DayPlan extends DayTargets {
  slots: Slot[];
}

export function planDay(input: DayPlanInput): DayPlan {
  const { profile, sessions } = input;
  const targets = planDayTargets(input);
  const withBand = (s: PlannedSession) => {
    const kcal = sessionEnergy(s, profile).kcal;
    return { session: s, kcal, band: sessionIntensityBand(s, profile, kcal) };
  };

  const built = buildSlots({
    profile,
    sessions: sessions.map((s) => {
      const { kcal, band } = withBand(s);
      const during = duringSession(s.durationMin, profile);
      return {
        id: s.id,
        startMin: toMinutes(s.start),
        durationMin: s.durationMin,
        band,
        key: s.key,
        kcal,
        preMealGPerKg: preMealGPerKg(s.durationMin, band),
        ...(during ? { during } : {}),
      };
    }),
    nextDaySessions: (input.nextDaySessions ?? []).map((s) => ({
      startMin: toMinutes(s.start),
      band: withBand(s).band,
      key: s.key,
    })),
    targets: targets.macros,
    carbLoading: targets.carbLoading,
  });

  const warnings = [...targets.warnings, ...built.warnings];
  if (profile.eatingWindow) {
    warnings.push(
      ...eatingWindowWarnings(
        profile.eatingWindow,
        sessions,
        built.slots.map((s) => ({
          id: s.id,
          kind: s.kind,
          time: s.time,
          kcal: s.target.kcal,
          ...(s.sessionId === undefined ? {} : { sessionId: s.sessionId }),
        })),
      ),
    );
  }
  return {
    ...targets,
    slots: built.slots,
    warnings,
    trace: [...targets.trace, ...built.trace],
  };
}
