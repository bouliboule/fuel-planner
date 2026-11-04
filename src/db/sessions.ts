import {
  sessionSchema,
  type RecordMeta,
  type Session,
  type StoredSession,
} from '../model/index.ts';
import type { FuelDatabase } from './database.ts';
import { withMeta } from './repositories.ts';

/** Sessions dated `from` to `to`, inclusive, by date and start. */
export async function listSessions(
  db: FuelDatabase,
  from: string,
  to: string,
): Promise<StoredSession[]> {
  const rows = await db.sessions
    .where('date')
    .between(from, to, true, true)
    .toArray();
  return rows.sort(
    (a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start),
  );
}

export async function getSession(db: FuelDatabase, id: string) {
  return db.sessions.get(id);
}

export async function saveSession(
  db: FuelDatabase,
  session: Session,
  existing?: RecordMeta,
): Promise<StoredSession> {
  const record = withMeta(sessionSchema.parse(session), existing);
  await db.sessions.put(record);
  return record;
}

export async function deleteSession(
  db: FuelDatabase,
  id: string,
): Promise<void> {
  await db.sessions.delete(id);
}
