import { z } from 'zod';
import { isoDate, stored } from './common.ts';

export const bodyMassEntrySchema = z.object({
  date: isoDate,
  massKg: z.number().positive(),
  // History only: the profile body fat is set on purpose (DECISIONS D25).
  bodyFatPct: z.number().min(0).max(100).optional(),
});
export type BodyMassEntry = z.infer<typeof bodyMassEntrySchema>;

export const storedBodyMassEntrySchema = stored(bodyMassEntrySchema);
export type StoredBodyMassEntry = z.infer<typeof storedBodyMassEntrySchema>;
