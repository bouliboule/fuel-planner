import {
  logEntrySchema,
  type LogEntry,
  type StoredLogEntry,
} from '../model/index.ts';
import type { FuelDatabase } from './database.ts';
import { withMeta } from './repositories.ts';

/** Entries of a date, by time. */
export async function listLog(
  db: FuelDatabase,
  date: string,
): Promise<StoredLogEntry[]> {
  const rows = await db.logEntries.where('date').equals(date).toArray();
  return rows.sort((a, b) => a.time.localeCompare(b.time));
}

export async function logFood(
  db: FuelDatabase,
  entry: LogEntry,
): Promise<StoredLogEntry> {
  const record = withMeta(logEntrySchema.parse(entry));
  await db.logEntries.put(record);
  return record;
}

export async function updateLoggedGrams(
  db: FuelDatabase,
  id: string,
  grams: number,
): Promise<void> {
  const existing = await db.logEntries.get(id);
  if (!existing) return;
  const { id: _id, createdAt: _c, updatedAt: _u, ...entry } = existing;
  await db.logEntries.put(
    withMeta(logEntrySchema.parse({ ...entry, grams }), existing),
  );
}

export async function deleteLogEntry(
  db: FuelDatabase,
  id: string,
): Promise<void> {
  await db.logEntries.delete(id);
}
