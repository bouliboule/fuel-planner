// Macronutrient rules M1 to M3 (docs/DOMAIN.md section 2). Grams per day.

import type { Profile } from '../model/index.ts';
import {
  CARB_G_PER_KG_RANGE,
  FAT_MIN_ENERGY_FRACTION,
  FAT_MIN_G_PER_KG,
  KCAL_PER_G_CARB,
  KCAL_PER_G_FAT,
  KCAL_PER_G_PROTEIN,
} from './constants.ts';
import { step, type TraceStep, type Warning } from './trace.ts';
import type { DayLoad } from './types.ts';

/** M1: daily protein from the profile g/kg. */
export function proteinTarget(profile: Profile): {
  g: number;
  gPerKg: number;
  trace: TraceStep[];
} {
  const gPerKg = profile.proteinGPerKg;
  const g = gPerKg * profile.massKg;
  return {
    g,
    gPerKg,
    trace: [
      step('M1', 'Protein: g/kg * mass', { gPerKg, massKg: profile.massKg }, g),
    ],
  };
}

export interface CarbohydrateTarget {
  g: number;
  gPerKg: number;
  rangeGPerKg: readonly [number, number];
  lowerG: number;
  trace: TraceStep[];
}

/**
 * M2: daily carbohydrate at the profile's point inside the load range. Rest
 * days use the light range at its lower bound.
 */
export function carbohydrateTarget(
  load: DayLoad,
  profile: Profile,
): CarbohydrateTarget {
  const rangeGPerKg = CARB_G_PER_KG_RANGE[load === 'rest' ? 'light' : load];
  const point = load === 'rest' ? 0 : profile.carbPointInRange;
  const [low, high] = rangeGPerKg;
  const gPerKg = low + point * (high - low);
  const g = gPerKg * profile.massKg;
  return {
    g,
    gPerKg,
    rangeGPerKg,
    lowerG: low * profile.massKg,
    trace: [
      step(
        'M2',
        'Carbohydrate: (low + point * (high - low)) * mass',
        { load, low, high, point, massKg: profile.massKg },
        g,
      ),
    ],
  };
}

export interface FatTarget {
  fatG: number;
  /** Carbohydrate after any reduction to hold the fat floor. */
  carbG: number;
  /** Energy of the three macros; above the target when over. */
  kcal: number;
  overKcal: number;
  floorHit: boolean;
  warnings: Warning[];
  trace: TraceStep[];
}

/**
 * M3: fat is the remainder, floored at the higher of 20 % of energy and
 * 0.8 g/kg. A floor hit lowers carbohydrate toward its lower bound, then
 * flags the day as over target; protein is never cut.
 */
export function fatTarget(input: {
  targetKcal: number;
  proteinG: number;
  carbG: number;
  carbLowerG: number;
  massKg: number;
}): FatTarget {
  const { targetKcal, proteinG, carbG, carbLowerG, massKg } = input;
  const proteinKcal = KCAL_PER_G_PROTEIN * proteinG;
  const remainderG =
    (targetKcal - proteinKcal - KCAL_PER_G_CARB * carbG) / KCAL_PER_G_FAT;
  const floorG = Math.max(
    (FAT_MIN_ENERGY_FRACTION * targetKcal) / KCAL_PER_G_FAT,
    FAT_MIN_G_PER_KG * massKg,
  );
  const trace: TraceStep[] = [
    step(
      'M3',
      'Fat: (target - 4 * protein - 4 * carbohydrate) / 9',
      { targetKcal, proteinG, carbG },
      remainderG,
    ),
  ];

  if (remainderG >= floorG) {
    return {
      fatG: remainderG,
      carbG,
      kcal: targetKcal,
      overKcal: 0,
      floorHit: false,
      warnings: [],
      trace,
    };
  }

  const fatG = floorG;
  const carbForTarget =
    (targetKcal - proteinKcal - KCAL_PER_G_FAT * fatG) / KCAL_PER_G_CARB;
  const newCarbG = Math.max(carbLowerG, carbForTarget);
  const kcal = proteinKcal + KCAL_PER_G_CARB * newCarbG + KCAL_PER_G_FAT * fatG;
  const overKcal = Math.max(0, kcal - targetKcal);
  trace.push(
    step(
      'M3',
      'Fat floor: max(20 % of energy / 9, 0.8 g/kg * mass)',
      { targetKcal, massKg },
      floorG,
    ),
    step(
      'M3',
      'Carbohydrate lowered to hold the fat floor, not below the range',
      { carbBeforeG: carbG, carbLowerG, carbForTargetG: carbForTarget },
      newCarbG,
    ),
  );
  const warnings: Warning[] =
    overKcal > 0
      ? [{ code: 'over-target', ruleId: 'M3', values: { overKcal } }]
      : [];
  return {
    fatG,
    carbG: newCarbG,
    kcal,
    overKcal,
    floorHit: true,
    warnings,
    trace,
  };
}
