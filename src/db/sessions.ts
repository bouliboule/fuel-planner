import { sessionsFromTemplate, weekDates } from '../engine/week.ts';
import {
  sessionSchema,
  weekTemplateSchema,
  type RecordMeta,
  type Session,
  type StoredSession,
  type WeekTemplate,
} from '../model/index.ts';
import type { FuelDatabase } from './database.ts';
import { withMeta } from './repositories.ts';

export type StoredWeekTemplate = WeekTemplate & RecordMeta;

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

export async function listTemplates(
  db: FuelDatabase,
): Promise<StoredWeekTemplate[]> {
  const rows = await db.weekTemplates.toArray();
  return rows.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getTemplate(db: FuelDatabase, id: string) {
  return db.weekTemplates.get(id);
}

export async function saveTemplate(
  db: FuelDatabase,
  template: WeekTemplate,
  existing?: RecordMeta,
): Promise<StoredWeekTemplate> {
  const record = withMeta(weekTemplateSchema.parse(template), existing);
  await db.weekTemplates.put(record);
  return record;
}

export async function duplicateTemplate(
  db: FuelDatabase,
  id: string,
  name: string,
): Promise<StoredWeekTemplate | undefined> {
  const source = await db.weekTemplates.get(id);
  if (!source) return undefined;
  return saveTemplate(db, { name, sessions: source.sessions });
}

export async function deleteTemplate(
  db: FuelDatabase,
  id: string,
): Promise<void> {
  await db.weekTemplates.delete(id);
}

/**
 * Replaces every session of the week containing `date` with the template's
 * sessions (D29).
 */
export async function applyTemplateToWeek(
  db: FuelDatabase,
  template: StoredWeekTemplate,
  date: string,
): Promise<StoredSession[]> {
  const dates = weekDates(date);
  const first = dates[0] ?? date;
  const last = dates[6] ?? date;
  const records = sessionsFromTemplate(template, template.id, date).map((s) =>
    withMeta(sessionSchema.parse(s)),
  );
  await db.transaction('rw', db.sessions, async () => {
    await db.sessions.where('date').between(first, last, true, true).delete();
    await db.sessions.bulkAdd(records);
  });
  return records;
}
