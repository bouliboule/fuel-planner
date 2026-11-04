// Every engine coefficient, named after its docs/DOMAIN.md rule. Sources are
// the references listed at the end of DOMAIN.md.

import type { Zone } from '../model/index.ts';

// E1. Mifflin MD et al. 1990.
export const MIFFLIN_MASS_KCAL_PER_KG = 10;
export const MIFFLIN_HEIGHT_KCAL_PER_CM = 6.25;
export const MIFFLIN_AGE_KCAL_PER_YEAR = 5;
export const MIFFLIN_MALE_OFFSET_KCAL = 5;
export const MIFFLIN_FEMALE_OFFSET_KCAL = -161;

// E1. Katch-McArdle, used when body-fat % is set (DOMAIN E1).
export const KATCH_OFFSET_KCAL = 370;
export const KATCH_LEAN_KCAL_PER_KG = 21.6;

// E2. Non-exercise activity factor range and default (DOMAIN E2).
export const NEA_FACTOR_RANGE = [1.2, 1.5] as const;
export const NEA_FACTOR_DEFAULT = 1.35;

// E3. Gross efficiency range and default (DOMAIN E3).
export const GROSS_EFFICIENCY_RANGE = [0.2, 0.25] as const;
export const GROSS_EFFICIENCY_DEFAULT = 0.24;
export const KJ_PER_KCAL = 4.184;

// E3. Coggan zone to intensity factor, midpoints (DOMAIN E3).
export const ZONE_INTENSITY_FACTOR: Readonly<Record<Zone, number>> = {
  Z1: 0.5,
  Z2: 0.65,
  Z3: 0.83,
  SS: 0.9,
  Z4: 0.98,
  Z5: 1.1,
};

export interface CompendiumMet {
  code: string;
  met: number;
}

// E3/E4. Rides without power data, by self-selected effort.
// Herrmann SD et al. 2024 Adult Compendium of Physical Activities.
export const RIDE_EFFORT_MET = {
  easy: { code: '01015', met: 4.3 }, // Bicycling, self-selected easy pace
  moderate: { code: '01016', met: 7.0 }, // Bicycling, self-selected moderate pace
  vigorous: { code: '01017', met: 9.0 }, // Bicycling, self-selected vigorous pace
} as const satisfies Record<string, CompendiumMet>;

// E4. 2024 Adult Compendium of Physical Activities.
export const PILATES_MET: CompendiumMet = { code: '02105', met: 2.8 }; // Pilates, general
// Body weight resistance exercises (e.g., squat, lunge, push-up, crunch), general
export const STRENGTH_MET: CompendiumMet = { code: '02056', met: 3.0 };

// E4. Net running cost per kg per km, range and default (DOMAIN E4).
export const RUN_KCAL_PER_KG_PER_KM_RANGE = [0.9, 1.05] as const;
export const RUN_KCAL_PER_KG_PER_KM = 1.0;

// M2. Running intensity from pace, 2024 Compendium running codes. From 4 mph
// up every running code is 6 MET or more; slower is jogging.
export const KM_PER_MILE = 1.609344;
export const RUN_MIN_SPEED_KMH = 4 * KM_PER_MILE; // 12028, Running, 4 to 4.2 mph
export const RUN_MET: CompendiumMet = { code: '12028', met: 6.5 };
export const JOG_MET: CompendiumMet = { code: '12026', met: 3.3 }; // Jogging 2.6 to 3.7 mph

// M2. Session intensity band thresholds (DOMAIN M2 table, D11).
export const RPE_MODERATE_MIN = 4;
export const RPE_HIGH_MIN = 7;
export const MET_MODERATE_MIN = 3;
export const MET_HIGH_MIN = 6;

// M2. Day load thresholds in total session minutes (DOMAIN M2, D11).
export const LOAD_MODERATE_MIN = 60;
export const LOAD_HIGH_MIN = 90;
export const LOAD_VERY_HIGH_MIN = 240;

// E6. Goal adjustment (DOMAIN E6).
export const KCAL_PER_KG_BODY_MASS = 7700;
export const DAYS_PER_WEEK = 7;
export const LOSE_RATE_MAX_FRACTION_OF_MASS = 0.005; // 0.5 % of body mass per week
export const GAIN_KCAL_PER_DAY_DEFAULT = 250;
export const DEFICIT_MAX_TRAINING_MIN = 150; // more than 2.5 h: maintenance

// E7. Energy availability, Mountjoy M et al. 2023 IOC consensus on REDs.
export const EA_LOW_THRESHOLD_KCAL_PER_KG_FFM = 30;
export const FFM_FRACTION_ESTIMATE = { male: 0.85, female: 0.75 } as const;

// M1. Protein, Morton RW et al. 2018; Jäger R et al. ISSN 2017.
export const PROTEIN_G_PER_KG_RANGE = [1.6, 2.2] as const;
export const PROTEIN_G_PER_KG_DEFAULT = 1.8;
export const PROTEIN_G_PER_KG_DEFAULT_LOSE = 2.0;

// M2. Carbohydrate by daily load, g/kg/day. Burke LM et al. 2011; ACSM 2016.
export const CARB_G_PER_KG_RANGE = {
  light: [3, 5],
  moderate: [5, 7],
  high: [6, 10],
  'very-high': [8, 12],
} as const satisfies Record<string, readonly [number, number]>;
export const CARB_POINT_IN_RANGE_DEFAULT = 0.5;

// M3. Fat floor (DOMAIN M3).
export const FAT_MIN_ENERGY_FRACTION = 0.2;
export const FAT_MIN_G_PER_KG = 0.8;

// Atwater energy factors, kcal per g, as used in M3.
export const KCAL_PER_G_CARB = 4;
export const KCAL_PER_G_PROTEIN = 4;
export const KCAL_PER_G_FAT = 9;

// M4. Fibre, shown only (DOMAIN M4).
export const FIBRE_G_PER_DAY_RANGE = [25, 35] as const;
export const PRE_SESSION_FIBRE_MAX_G = 5;

// T1. Pre-session, ACSM 2016 (DOMAIN T1, D17).
export const PRE_MEAL_G_PER_KG_RANGE = [1, 4] as const;
export const PRE_MEAL_G_PER_KG_LONG = 2; // sessions over 90 min
export const PRE_MEAL_G_PER_KG_MEDIUM = 1; // 60 to 90 min, moderate or high
export const PRE_MEAL_LONG_ABOVE_MIN = 90;
export const PRE_MEAL_MEDIUM_FROM_MIN = 60;
export const PRE_MEAL_WINDOW_MIN = [90, 240] as const; // usual meal taken as pre meal
export const PRE_MEAL_ADDED_BEFORE_MIN = 180; // DOMAIN: 3 to 4 h before
export const PRE_SNACK_G_PER_KG = 0.5;
export const PRE_SNACK_BEFORE_MIN = 45; // midpoint of 30 to 60 min
export const PRE_SNACK_LAST_MEAL_GAP_MIN = 180; // last meal over 3 h earlier

// T2. During session, Jeukendrup 2014; ACSM 2016 (DOMAIN T2, D18).
export const DURING_NONE_BELOW_MIN = 45;
export const DURING_SMALL_BELOW_MIN = 75;
export const DURING_MEDIUM_MAX_MIN = 150; // 2.5 h
export const DURING_G_PER_H_MEDIUM = [30, 60] as const;
export const DURING_G_PER_H_LONG = [60, 90] as const;
export const DURING_G_PER_H_OVERRIDE_WARN_ABOVE = 90;
export const DURING_G_PER_H_OVERRIDE_MAX = 120;
export const DURING_FEED_INTERVAL_MIN = 20; // DOMAIN: every 20 to 30 min
export const MULTIPLE_TRANSPORTABLE_ABOVE_G_PER_H = 60;
export const GLUCOSE_TO_FRUCTOSE_RATIO = [1, 0.8] as const; // range 2:1 to 1:0.8

// T3. Fluid and sodium (DOMAIN T3, D19). Midpoints of the ranges.
export const FLUID_ML_PER_H_RANGE = [400, 800] as const;
export const FLUID_ML_PER_H = 600;
export const SODIUM_MG_PER_H_RANGE = [300, 600] as const;
export const SODIUM_MG_PER_H = 450;
export const SODIUM_ABOVE_MIN = 120;

// T4. Recovery, ACSM 2016 (DOMAIN T4, D20).
export const RECOVERY_MIN_SESSION_MIN = 60;
export const FAST_RECOVERY_NEXT_HARD_WITHIN_MIN = 480; // 8 h
export const FAST_RECOVERY_G_PER_KG_PER_H_RANGE = [1.0, 1.2] as const;
export const FAST_RECOVERY_G_PER_KG_PER_H = 1.1;
export const FAST_RECOVERY_HOURS = 4;
export const FAST_RECOVERY_MEAL_MATCH_MIN = 30;
export const RECOVERY_MEAL_WITHIN_MIN = 120; // next main meal within about 2 h
export const RECOVERY_PROTEIN_G_PER_KG_RANGE = [0.3, 0.4] as const;
export const RECOVERY_PROTEIN_G_PER_KG = 0.35;

// T5. Carbohydrate loading, ACSM 2016 (DOMAIN T5, D21).
export const CARB_LOADING_G_PER_KG_RANGE = [10, 12] as const;
export const CARB_LOADING_MIN_EVENT_MIN = 90;
export const CARB_LOADING_DAYS_BEFORE = 2;

// M1 and section 4. Protein occasions and slot construction (D22).
export const PROTEIN_PER_OCCASION_G_PER_KG_RANGE = [0.3, 0.4] as const;
export const OCCASION_PROTEIN_G_PER_KG = 0.35; // recovery and bedtime slots
export const BEDTIME_GAP_ABOVE_MIN = 600; // 10 h to the next breakfast
export const BEDTIME_BEFORE_SLEEP_MIN = 30;
export const MEAL_BEFORE_HARD_MIN = 90;
export const MEAL_MIN_GAP_MIN = 120;
export const MEAL_AFTER_SESSION_MIN = 30;
export const MAIN_SESSION_MEAL_WEIGHT = 1.5;

// S5. Portion solving (DOMAIN section 5, D32, D33).
export const PORTION_TOLERANCE_FRACTION = 0.1; // kcal, carbohydrate, protein within 10 %
export const PORTION_MAX_FOODS = 4;
export const PORTION_MAX_CANDIDATES = 12;

// D33. Portion fields for imported foods, which have no portion sizes. Not
// nutrition values: the user checks them in the food editor.
export const IMPORT_PORTION_MIN_G = 0;
export const IMPORT_PORTION_MAX_G = 300;
export const IMPORT_PORTION_STEP_G = 5;
export const IMPORT_PORTION_DEFAULT_G = 100;
