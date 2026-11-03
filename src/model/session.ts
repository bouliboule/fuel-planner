import { z } from 'zod';
import { clockTime, isoDate, stored } from './common.ts';

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
  date: isoDate,
  start: clockTime,
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

export const storedSessionSchema = stored(sessionSchema);
export type StoredSession = z.infer<typeof storedSessionSchema>;

export const weekTemplateSchema = z.object({
  name: z.string().min(1),
  sessions: z.array(
    sessionSchema
      .omit({ date: true, source: true })
      .extend({ weekday: z.number().int().min(1).max(7) }),
  ),
});
export type WeekTemplate = z.infer<typeof weekTemplateSchema>;
export const storedWeekTemplateSchema = stored(weekTemplateSchema);
