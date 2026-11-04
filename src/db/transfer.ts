import { z } from 'zod';
import {
  storedBodyMassEntrySchema,
  storedGoalSchema,
  storedProfileSchema,
  storedSessionSchema,
} from '../model/index.ts';
import {
  SCHEMA_VERSION,
  TABLES,
  type FuelDatabase,
  type TableName,
} from './database.ts';

// Zod objects strip unknown keys, so a schema version 1 file parses to its
// profile, goals, body mass and sessions without the removed tables and
// fields (D43).
const dataSchema = z.object({
  profile: z.array(storedProfileSchema).max(1),
  goals: z.array(storedGoalSchema),
  bodyMass: z.array(storedBodyMassEntrySchema),
  sessions: z.array(storedSessionSchema),
}) satisfies z.ZodType<Record<TableName, unknown[]>>;

export const exportFileSchema = z.object({
  app: z.literal('fuel-planner'),
  schemaVersion: z.number().int().positive(),
  exportedAt: z.string(),
  data: dataSchema,
});
export type ExportFile = z.infer<typeof exportFileSchema>;

export async function exportData(
  db: FuelDatabase,
  now: Date = new Date(),
): Promise<ExportFile> {
  const entries = await Promise.all(
    TABLES.map(async (name) => [name, await db.table(name).toArray()] as const),
  );
  return {
    app: 'fuel-planner',
    schemaVersion: SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    data: Object.fromEntries(entries) as ExportFile['data'],
  };
}

export type ImportCheck =
  | { ok: true; file: ExportFile; counts: Record<TableName, number> }
  | {
      ok: false;
      reason: 'not-json' | 'not-fuel-planner' | 'newer-version' | 'invalid';
      detail?: string;
    };

/** Parses and validates an export file without touching the database. */
export function checkImport(text: string): ImportCheck {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, reason: 'not-json' };
  }
  const header = z
    .object({ app: z.literal('fuel-planner'), schemaVersion: z.number() })
    .safeParse(raw);
  if (!header.success) return { ok: false, reason: 'not-fuel-planner' };
  if (header.data.schemaVersion > SCHEMA_VERSION) {
    return {
      ok: false,
      reason: 'newer-version',
      detail: String(header.data.schemaVersion),
    };
  }
  const parsed = exportFileSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      reason: 'invalid',
      detail: z.prettifyError(parsed.error),
    };
  }
  const counts = Object.fromEntries(
    TABLES.map((name) => [name, parsed.data.data[name].length]),
  ) as Record<TableName, number>;
  return { ok: true, file: parsed.data, counts };
}

/** Replaces all local data with the file's data, in one transaction. */
export async function replaceAllData(
  db: FuelDatabase,
  file: ExportFile,
): Promise<void> {
  await db.transaction(
    'rw',
    TABLES.map((name) => db.table(name)),
    async () => {
      for (const name of TABLES) {
        await db.table(name).clear();
        await db.table(name).bulkAdd(file.data[name]);
      }
    },
  );
}
