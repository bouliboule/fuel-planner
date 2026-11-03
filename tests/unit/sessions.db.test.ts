import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  FuelDatabase,
  applyTemplateToWeek,
  completeFirstRun,
  deleteSession,
  duplicateTemplate,
  listSessions,
  listTemplates,
  saveSession,
  saveTemplate,
} from '../../src/db/index.ts';
import type { WeekTemplate } from '../../src/model/index.ts';
import { testProfile } from '../engine/fixtures.ts';

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

const template: WeekTemplate = {
  name: 'Standard',
  sessions: [
    {
      weekday: 1,
      sport: 'run',
      start: '18:00',
      durationMin: 60,
      indoor: false,
      key: true,
      intensity: { kind: 'pace', secPerKm: 300 },
    },
    {
      weekday: 7,
      sport: 'ride',
      start: '09:30',
      durationMin: 240,
      indoor: false,
      key: true,
      intensity: { kind: 'zone', zone: 'Z2' },
    },
  ],
};

const manual = {
  date: '2026-11-04',
  start: '07:00',
  durationMin: 15,
  sport: 'strength' as const,
  indoor: true,
  intensity: { kind: 'rpe' as const, value: 5 },
  key: false,
  source: 'manual' as const,
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

describe('templates', () => {
  it('replaces the week with the template sessions', async () => {
    const tpl = await saveTemplate(db, template);
    await saveSession(db, manual); // Wednesday, same week: removed
    await saveSession(db, { ...manual, date: '2026-11-09' }); // next week: kept
    await applyTemplateToWeek(db, tpl, '2026-11-04');
    const week = await listSessions(db, '2026-11-02', '2026-11-08');
    expect(week.map((s) => [s.date, s.sport, s.source, s.templateId])).toEqual([
      ['2026-11-02', 'run', 'template', tpl.id],
      ['2026-11-08', 'ride', 'template', tpl.id],
    ]);
    expect(await listSessions(db, '2026-11-09', '2026-11-15')).toHaveLength(1);
  });

  it('duplicates under a new name', async () => {
    const tpl = await saveTemplate(db, template);
    await duplicateTemplate(db, tpl.id, 'Race week');
    expect((await listTemplates(db)).map((x) => x.name)).toEqual([
      'Race week',
      'Standard',
    ]);
  });

  it('applies a template during first run', async () => {
    await completeFirstRun(db, {
      profile: testProfile,
      goal: { kind: 'maintain', validFrom: '2026-11-04' },
      date: '2026-11-04',
      template,
    });
    expect(await db.weekTemplates.count()).toBe(1);
    expect(
      (await listSessions(db, '2026-11-02', '2026-11-08')).map((s) => s.date),
    ).toEqual(['2026-11-02', '2026-11-08']);
  });
});
