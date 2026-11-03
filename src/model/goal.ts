import { z } from 'zod';
import { isoDate, stored } from './common.ts';

export const goalSchema = z.object({
  kind: z.enum(['maintain', 'lose', 'gain']),
  rateKgPerWeek: z.number().positive().optional(),
  gainKcalPerDay: z.number().positive().optional(),
  event: z
    .object({
      name: z.string().min(1),
      date: isoDate,
      expectedDurationMin: z.number().positive(),
    })
    .optional(),
  validFrom: isoDate,
});

export type Goal = z.infer<typeof goalSchema>;

export const storedGoalSchema = stored(goalSchema);
export type StoredGoal = z.infer<typeof storedGoalSchema>;
