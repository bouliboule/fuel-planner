import { z } from 'zod';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD');

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
