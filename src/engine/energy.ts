// Energy rules E1 to E7 (docs/DOMAIN.md section 1). All values in kcal.

import type { Goal, Profile, Zone } from '../model/index.ts';
import {
  DAYS_PER_WEEK,
  DEFICIT_MAX_TRAINING_MIN,
  EA_LOW_THRESHOLD_KCAL_PER_KG_FFM,
  FFM_FRACTION_ESTIMATE,
  GAIN_KCAL_PER_DAY_DEFAULT,
  KATCH_LEAN_KCAL_PER_KG,
  KATCH_OFFSET_KCAL,
  KCAL_PER_KG_BODY_MASS,
  KJ_PER_KCAL,
  LOSE_RATE_MAX_FRACTION_OF_MASS,
  MIFFLIN_AGE_KCAL_PER_YEAR,
  MIFFLIN_FEMALE_OFFSET_KCAL,
  MIFFLIN_HEIGHT_KCAL_PER_CM,
  MIFFLIN_MALE_OFFSET_KCAL,
  MIFFLIN_MASS_KCAL_PER_KG,
  PILATES_MET,
  RIDE_EFFORT_MET,
  RPE_HIGH_MIN,
  RPE_MODERATE_MIN,
  RUN_KCAL_PER_KG_PER_KM,
  STRENGTH_MET,
  ZONE_INTENSITY_FACTOR,
  type CompendiumMet,
} from './constants.ts';
import { zoneForIf } from './zones.ts';
import { step, type TraceStep, type Warning } from './trace.ts';
import type { PlannedSession } from './types.ts';

/** E1: age is the plan date's year minus the birth year. */
export function ageInYear(date: string, birthYear: number): number {
  return Number(date.slice(0, 4)) - birthYear;
}

export interface RestingEnergy {
  kcal: number;
  method: 'mifflin-st-jeor' | 'katch-mcardle';
  trace: TraceStep[];
}

/** E1: resting energy (BMR). */
export function restingEnergy(profile: Profile, age: number): RestingEnergy {
  const { massKg, heightCm, sex, bodyFatPct } = profile;
  if (bodyFatPct !== undefined) {
    const leanKg = massKg * (1 - bodyFatPct / 100);
    const kcal = KATCH_OFFSET_KCAL + KATCH_LEAN_KCAL_PER_KG * leanKg;
    return {
      kcal,
      method: 'katch-mcardle',
      trace: [
        step(
          'E1',
          'BMR, Katch-McArdle: 370 + 21.6 * lean mass',
          { massKg, bodyFatPct, leanKg },
          kcal,
        ),
      ],
    };
  }
  const offset =
    sex === 'male' ? MIFFLIN_MALE_OFFSET_KCAL : MIFFLIN_FEMALE_OFFSET_KCAL;
  const kcal =
    MIFFLIN_MASS_KCAL_PER_KG * massKg +
    MIFFLIN_HEIGHT_KCAL_PER_CM * heightCm -
    MIFFLIN_AGE_KCAL_PER_YEAR * age +
    offset;
  return {
    kcal,
    method: 'mifflin-st-jeor',
    trace: [
      step(
        'E1',
        'BMR, Mifflin-St Jeor: 10 * mass + 6.25 * height - 5 * age + offset',
        { massKg, heightCm, age, sex, offset },
        kcal,
      ),
    ],
  };
}

/** E2: resting energy plus non-exercise daily activity. */
export function nonExerciseEnergy(
  bmrKcal: number,
  neaFactor: number,
): { kcal: number; trace: TraceStep[] } {
  const kcal = bmrKcal * neaFactor;
  return {
    kcal,
    trace: [
      step('E2', 'Daily base: BMR * NEA factor', { bmrKcal, neaFactor }, kcal),
    ],
  };
}

export interface SessionEnergy {
  sessionId: string;
  kcal: number;
  method: 'power' | 'met' | 'distance' | 'none';
  compendiumCode?: string;
  warnings: Warning[];
  trace: TraceStep[];
}

function rideEffort(zone: Zone): CompendiumMet {
  if (zone === 'Z1' || zone === 'Z2') return RIDE_EFFORT_MET.easy;
  if (zone === 'Z3') return RIDE_EFFORT_MET.moderate;
  return RIDE_EFFORT_MET.vigorous;
}

function rideEffortFromRpe(rpe: number): CompendiumMet {
  if (rpe < RPE_MODERATE_MIN) return RIDE_EFFORT_MET.easy;
  if (rpe < RPE_HIGH_MIN) return RIDE_EFFORT_MET.moderate;
  return RIDE_EFFORT_MET.vigorous;
}

function metEnergy(
  session: PlannedSession,
  massKg: number,
  met: number,
  compendiumCode: string | undefined,
  warnings: Warning[],
): SessionEnergy {
  const hours = session.durationMin / 60;
  const kcal = (met - 1) * massKg * hours;
  return {
    sessionId: session.id,
    kcal,
    method: 'met',
    ...(compendiumCode === undefined ? {} : { compendiumCode }),
    warnings,
    trace: [
      step(
        'E4',
        'Exercise energy: (MET - 1) * mass * hours',
        {
          sport: session.sport,
          met,
          ...(compendiumCode === undefined ? {} : { compendiumCode }),
          massKg,
          hours,
        },
        kcal,
      ),
    ],
  };
}

function noEnergy(
  session: PlannedSession,
  ruleId: string,
  code: string,
): SessionEnergy {
  return {
    sessionId: session.id,
    kcal: 0,
    method: 'none',
    warnings: [{ code, ruleId, values: { sessionId: session.id } }],
    trace: [
      step(
        ruleId,
        'Exercise energy: missing input, counted as 0',
        { sport: session.sport, missing: code },
        0,
      ),
    ],
  };
}

function rideEnergy(session: PlannedSession, profile: Profile): SessionEnergy {
  const { intensity, durationMin } = session;
  const efficiency = profile.grossEfficiency;
  const fromKj = (kj: number, trace: TraceStep[]): SessionEnergy => {
    const kcal = kj / (efficiency * KJ_PER_KCAL);
    return {
      sessionId: session.id,
      kcal,
      method: 'power',
      warnings: [],
      trace: [
        ...trace,
        step(
          'E3',
          'Exercise energy: kJ / (gross efficiency * 4.184)',
          { kj, grossEfficiency: efficiency },
          kcal,
        ),
      ],
    };
  };

  if (intensity.kind === 'kj') {
    return fromKj(intensity.value, [
      step(
        'E3',
        'Mechanical work (kJ)',
        { plannedKj: intensity.value },
        intensity.value,
      ),
    ]);
  }
  if (intensity.kind === 'met') {
    return metEnergy(
      session,
      profile.massKg,
      intensity.value,
      intensity.compendiumCode,
      [],
    );
  }

  const noPower: Warning[] = [
    { code: 'ride-no-power', ruleId: 'E3', values: { sessionId: session.id } },
  ];
  if (intensity.kind === 'rpe') {
    const effort = rideEffortFromRpe(intensity.value);
    return metEnergy(session, profile.massKg, effort.met, effort.code, noPower);
  }
  if (intensity.kind !== 'zone' && intensity.kind !== 'if') {
    return noEnergy(session, 'E4', 'session-needs-met');
  }

  const zone =
    intensity.kind === 'zone' ? intensity.zone : zoneForIf(intensity.value);
  if (profile.ftpW === undefined) {
    const effort = rideEffort(zone);
    return metEnergy(session, profile.massKg, effort.met, effort.code, noPower);
  }
  const intensityFactor =
    intensity.kind === 'zone' ? ZONE_INTENSITY_FACTOR[zone] : intensity.value;
  const powerW = intensityFactor * profile.ftpW;
  const kj = (powerW * durationMin * 60) / 1000;
  return fromKj(kj, [
    step(
      'E3',
      'Mechanical work (kJ)',
      {
        intensityFactor,
        ...(intensity.kind === 'zone' ? { zone } : {}),
        ftpW: profile.ftpW,
        avgPowerW: powerW,
        durationS: durationMin * 60,
      },
      kj,
    ),
  ]);
}

function runEnergy(session: PlannedSession, profile: Profile): SessionEnergy {
  const { intensity, durationMin, distanceKm } = session;
  let km: number | undefined = distanceKm;
  const inputs: Record<string, number | string> = {};
  if (km !== undefined) {
    inputs.distanceKm = km;
  } else if (intensity.kind === 'pace') {
    km = (durationMin * 60) / intensity.secPerKm;
    inputs.durationS = durationMin * 60;
    inputs.paceSecPerKm = intensity.secPerKm;
  }
  if (km !== undefined) {
    const kcal = RUN_KCAL_PER_KG_PER_KM * profile.massKg * km;
    return {
      sessionId: session.id,
      kcal,
      method: 'distance',
      warnings: [],
      trace: [
        step(
          'E4',
          'Running energy: 1.0 * mass * km',
          {
            ...inputs,
            km,
            massKg: profile.massKg,
            kcalPerKgPerKm: RUN_KCAL_PER_KG_PER_KM,
          },
          kcal,
        ),
      ],
    };
  }
  if (intensity.kind === 'met') {
    return metEnergy(
      session,
      profile.massKg,
      intensity.value,
      intensity.compendiumCode,
      [],
    );
  }
  return noEnergy(session, 'E4', 'run-needs-pace');
}

/** E3 and E4: net exercise energy of one session. */
export function sessionEnergy(
  session: PlannedSession,
  profile: Profile,
): SessionEnergy {
  const { intensity } = session;
  switch (session.sport) {
    case 'ride':
      return rideEnergy(session, profile);
    case 'run':
      return runEnergy(session, profile);
    case 'pilates':
    case 'strength': {
      if (intensity.kind === 'met') {
        return metEnergy(
          session,
          profile.massKg,
          intensity.value,
          intensity.compendiumCode,
          [],
        );
      }
      const met = session.sport === 'pilates' ? PILATES_MET : STRENGTH_MET;
      return metEnergy(session, profile.massKg, met.met, met.code, []);
    }
    case 'walk':
    case 'other':
      if (intensity.kind === 'met') {
        return metEnergy(
          session,
          profile.massKg,
          intensity.value,
          intensity.compendiumCode,
          [],
        );
      }
      return noEnergy(session, 'E4', 'session-needs-met');
  }
}

export interface GoalAdjustment {
  kcal: number;
  warnings: Warning[];
  trace: TraceStep[];
}

/** E6: daily adjustment for the goal. */
export function goalAdjustment(input: {
  goal: Goal;
  massKg: number;
  sessions: readonly { durationMin: number; key: boolean }[];
}): GoalAdjustment {
  const { goal, massKg, sessions } = input;
  if (goal.kind === 'maintain') {
    return {
      kcal: 0,
      warnings: [],
      trace: [step('E6', 'Goal: maintain', {}, 0)],
    };
  }
  if (goal.kind === 'gain') {
    const kcal = goal.gainKcalPerDay ?? GAIN_KCAL_PER_DAY_DEFAULT;
    return {
      kcal,
      warnings: [],
      trace: [
        step('E6', 'Goal: gain, daily surplus', { gainKcalPerDay: kcal }, kcal),
      ],
    };
  }

  const requested = goal.rateKgPerWeek ?? 0;
  const capKgPerWeek = LOSE_RATE_MAX_FRACTION_OF_MASS * massKg;
  const rate = Math.min(requested, capKgPerWeek);
  const warnings: Warning[] =
    requested > capKgPerWeek
      ? [
          {
            code: 'lose-rate-capped',
            ruleId: 'E6',
            values: { requestedKgPerWeek: requested, capKgPerWeek },
          },
        ]
      : [];
  const trainingMin = sessions.reduce((sum, s) => sum + s.durationMin, 0);
  const hasKey = sessions.some((s) => s.key);
  const deficitDay = !hasKey && trainingMin <= DEFICIT_MAX_TRAINING_MIN;
  const kcal = deficitDay ? -(rate * KCAL_PER_KG_BODY_MASS) / DAYS_PER_WEEK : 0;
  return {
    kcal,
    warnings,
    trace: [
      step(
        'E6',
        deficitDay
          ? 'Goal: lose, deficit -rate * 7700 / 7'
          : 'Goal: lose, maintenance on a key or long training day',
        {
          requestedKgPerWeek: requested,
          capKgPerWeek,
          rateKgPerWeek: rate,
          trainingMin,
          keySession: hasKey ? 'yes' : 'no',
        },
        kcal,
      ),
    ],
  };
}

export interface EnergyAvailability {
  kcalPerKgFfm: number;
  ffmKg: number;
  ffmEstimated: boolean;
  warnings: Warning[];
  trace: TraceStep[];
}

/** E7: energy availability guard. Warns, never blocks. */
export function energyAvailability(input: {
  intakeKcal: number;
  exerciseKcal: number;
  profile: Profile;
}): EnergyAvailability {
  const { intakeKcal, exerciseKcal, profile } = input;
  const ffmEstimated = profile.bodyFatPct === undefined;
  const ffmKg =
    profile.bodyFatPct === undefined
      ? FFM_FRACTION_ESTIMATE[profile.sex] * profile.massKg
      : profile.massKg * (1 - profile.bodyFatPct / 100);
  const kcalPerKgFfm = (intakeKcal - exerciseKcal) / ffmKg;
  const warnings: Warning[] =
    kcalPerKgFfm < EA_LOW_THRESHOLD_KCAL_PER_KG_FFM
      ? [
          {
            code: 'low-energy-availability',
            ruleId: 'E7',
            values: {
              kcalPerKgFfm,
              thresholdKcalPerKgFfm: EA_LOW_THRESHOLD_KCAL_PER_KG_FFM,
            },
          },
        ]
      : [];
  return {
    kcalPerKgFfm,
    ffmKg,
    ffmEstimated,
    warnings,
    trace: [
      step(
        'E7',
        'Energy availability: (intake - exercise) / fat-free mass',
        {
          intakeKcal,
          exerciseKcal,
          ffmKg,
          ffmSource: ffmEstimated ? 'estimate' : 'body fat',
        },
        kcalPerKgFfm,
      ),
    ],
  };
}
