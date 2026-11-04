import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  FuelDatabase,
  deleteSession,
  listSessions,
  saveSession,
} from '../../src/db/index.ts';

let db: FuelDatabase;
let counter = 0;

beforeEach(async () => {
  counter += 1;
  db = new FuelDatabase(`sessions-${String(counter)}`);
  await db.open();
});

afterEach(async () => {
  db.close();
  await db.delete();
});

const manual = {
  date: '2026-11-04',
  start: '07:00',
  durationMin: 15,
  sport: 'strength' as const,
  intensity: { kind: 'effort' as const, value: 'moderate' as const },
  key: false,
};

describe('sessions', () => {
  it('lists a date range in date and start order', async () => {
    await saveSession(db, { ...manual, start: '18:00' });
    await saveSession(db, manual);
    await saveSession(db, { ...manual, date: '2026-11-10' });
    const rows = await listSessions(db, '2026-11-02', '2026-11-08');
    expect(rows.map((s) => s.start)).toEqual(['07:00', '18:00']);
  });

  it('updates in place and deletes', async () => {
    const first = await saveSession(db, manual);
    await saveSession(db, { ...manual, durationMin: 20 }, first);
    expect(await db.sessions.count()).toBe(1);
    expect((await db.sessions.get(first.id))?.durationMin).toBe(20);
    await deleteSession(db, first.id);
    expect(await db.sessions.count()).toBe(0);
  });
});
