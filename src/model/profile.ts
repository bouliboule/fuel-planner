import { z } from 'zod';

const clockTime = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'HH:mm');

export const profileSchema = z.object({
  sex: z.enum(['male', 'female']),
  birthYear: z.number().int().min(1900),
  heightCm: z.number().positive(),
  massKg: z.number().positive(),
  bodyFatPct: z.number().min(0).max(100).optional(),
  ftpW: z.number().positive().optional(),
  timeZone: z.string().min(1),
  wakeTime: clockTime,
  sleepTime: clockTime,
  usualMeals: z.array(z.object({ name: z.string().min(1), time: clockTime })),
  neaFactor: z.number().positive(),
  grossEfficiency: z.number().positive(),
  proteinGPerKg: z.number().positive(),
  carbPointInRange: z.number().min(0).max(1),
  onBikeCarbTargetGPerH: z.number().positive().optional(),
  eatingWindow: z.object({ start: clockTime, end: clockTime }).optional(),
  dislikedFoodIds: z.array(z.string()),
  dislikedTags: z.array(z.string()),
});

export type Profile = z.infer<typeof profileSchema>;
