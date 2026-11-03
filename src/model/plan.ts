import { z } from 'zod';
import { isoDate, stored } from './common.ts';

// Cached engine output. The plan body is recomputed when `inputsHash`
// changes, so it is stored as plain JSON without a deep schema.
export const planCacheSchema = z.object({
  date: isoDate,
  inputsHash: z.string().min(1),
  plan: z.unknown(),
});
export type PlanCache = z.infer<typeof planCacheSchema>;
export const storedPlanCacheSchema = stored(planCacheSchema);
