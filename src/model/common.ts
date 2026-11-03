import { z } from 'zod';

export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD');
export const clockTime = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'HH:mm');

/** Metadata on every stored record (docs/DATA_MODEL.md). */
export const recordMetaSchema = z.object({
  id: z.string().min(1),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});
export type RecordMeta = z.infer<typeof recordMetaSchema>;

export function stored<T extends z.ZodRawShape>(schema: z.ZodObject<T>) {
  return schema.extend(recordMetaSchema.shape);
}
