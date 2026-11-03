import { z } from 'zod';
import {
  CARB_POINT_IN_RANGE_DEFAULT,
  DURING_G_PER_H_OVERRIDE_MAX,
  GROSS_EFFICIENCY_DEFAULT,
  GROSS_EFFICIENCY_RANGE,
  NEA_FACTOR_DEFAULT,
  NEA_FACTOR_RANGE,
  PROTEIN_G_PER_KG_DEFAULT,
  PROTEIN_G_PER_KG_RANGE,
} from '../engine/constants.ts';
import { clockTime, stored } from './common.ts';

// Coefficient bounds come from the engine constants (docs/DOMAIN.md), so the
// settings screens and the engine share one source.
export const profileSchema = z.object({
  sex: z.enum(['male', 'female']),
  birthYear: z.number().int().min(1900).max(2100),
  heightCm: z.number().positive(),
  massKg: z.number().positive(),
  bodyFatPct: z.number().min(0).max(100).optional(),
  ftpW: z.number().positive().optional(),
  timeZone: z.string().min(1),
  wakeTime: clockTime,
  sleepTime: clockTime,
  usualMeals: z.array(z.object({ name: z.string().min(1), time: clockTime })),
  neaFactor: z.number().min(NEA_FACTOR_RANGE[0]).max(NEA_FACTOR_RANGE[1]),
  grossEfficiency: z
    .number()
    .min(GROSS_EFFICIENCY_RANGE[0])
    .max(GROSS_EFFICIENCY_RANGE[1]),
  proteinGPerKg: z
    .number()
    .min(PROTEIN_G_PER_KG_RANGE[0])
    .max(PROTEIN_G_PER_KG_RANGE[1]),
  carbPointInRange: z.number().min(0).max(1),
  onBikeCarbTargetGPerH: z
    .number()
    .positive()
    .max(DURING_G_PER_H_OVERRIDE_MAX)
    .optional(),
  eatingWindow: z.object({ start: clockTime, end: clockTime }).optional(),
  dislikedFoodIds: z.array(z.string()),
  dislikedTags: z.array(z.string()),
});

export type Profile = z.infer<typeof profileSchema>;

export const storedProfileSchema = stored(profileSchema);
export type StoredProfile = z.infer<typeof storedProfileSchema>;

export const profileDefaults = {
  timeZone: 'Europe/Paris',
  neaFactor: NEA_FACTOR_DEFAULT,
  grossEfficiency: GROSS_EFFICIENCY_DEFAULT,
  proteinGPerKg: PROTEIN_G_PER_KG_DEFAULT,
  carbPointInRange: CARB_POINT_IN_RANGE_DEFAULT,
} as const;
