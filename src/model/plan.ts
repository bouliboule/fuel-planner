import { z } from 'zod';
import { isoDate, stored } from './common.ts';

// Per-date plan record. Plans are recomputed when shown (D34), so `plan` and
// `inputsHash` stay unused for now; `foodChoices` keeps the user's swaps.
export const planCacheSchema = z.object({
  date: isoDate,
  inputsHash: z.string().min(1).optional(),
  plan: z.unknown().optional(),
  foodChoices: z.record(z.string(), z.array(z.string())).optional(),
});
export type PlanCache = z.infer<typeof planCacheSchema>;
export const storedPlanCacheSchema = stored(planCacheSchema);
