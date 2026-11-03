import { z } from 'zod';

export const sportSchema = z.enum([
  'ride',
  'run',
  'strength',
  'pilates',
  'walk',
  'other',
]);
export type Sport = z.infer<typeof sportSchema>;

export const zoneSchema = z.enum(['Z1', 'Z2', 'Z3', 'SS', 'Z4', 'Z5']);
export type Zone = z.infer<typeof zoneSchema>;

export const intensitySchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('zone'), zone: zoneSchema }),
  z.object({ kind: z.literal('if'), value: z.number().positive() }),
  z.object({ kind: z.literal('kj'), value: z.number().positive() }),
  z.object({ kind: z.literal('rpe'), value: z.number().min(1).max(10) }),
  z.object({
    kind: z.literal('met'),
    value: z.number().positive(),
    compendiumCode: z.string().optional(),
  }),
  // Runs: expected pace in seconds per km (DOMAIN E4).
  z.object({ kind: z.literal('pace'), secPerKm: z.number().positive() }),
]);
export type Intensity = z.infer<typeof intensitySchema>;

export const sessionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD'),
  start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'HH:mm'),
  durationMin: z.number().positive(),
  sport: sportSchema,
  indoor: z.boolean(),
  intensity: intensitySchema,
  // Measured distance; replaces the pace estimate for runs.
  distanceKm: z.number().positive().optional(),
  key: z.boolean(),
  title: z.string().optional(),
  source: z.enum(['manual', 'template', 'import']),
  templateId: z.string().optional(),
});

export type Session = z.infer<typeof sessionSchema>;
