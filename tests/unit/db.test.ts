import 'fake-indexeddb/auto';
import { Dexie } from 'dexie';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  FuelDatabase,
  SCHEMA_VERSION,
  TABLES,
  addBodyMass,
  checkImport,
  completeFirstRun,
  currentGoal,
  exportData,
  getProfile,
  listBodyMass,
  removeBodyMass,
  replaceAllData,
  saveGoal,
  saveProfile,
  updateProfile,
} from '../../src/db/index.ts';
import { testProfile } from '../engine/fixtures.ts';

let db: FuelDatabase;
let counter = 0;

beforeEach(async () => {
  counter += 1;
  db = new FuelDatabase(`test-${String(counter)}`);
  await db.open();
});

afterEach(async () => {
  db.close();
  await db.delete();
});

describe('schema', () => {
  it('opens version 2 with the profile, goal, body mass and session tables', () => {
    expect(SCHEMA_VERSION).toBe(2);
    expect(db.verno).toBe(SCHEMA_VERSION);
    expect(db.tables.map((t) => t.name).sort()).toEqual([...TABLES].sort());
  });

  it('migrates version 1 data: drops removed tables and fields (D43)', async () => {
    const name = `${db.name}-v1`;
    const v1 = new Dexie(name);
    v1.version(1).stores({
      profile: 'id',
      goals: 'id, validFrom',
      bodyMass: 'id, &date',
      sessions: 'id, date',
      weekTemplates: 'id',
      foods: 'id, name, *tags',
      mealTemplates: 'id',
      plans: 'id, &date',
      logEntries: 'id, date',
    });
    const meta = { createdAt: 'x', updatedAt: 'x' };
    await v1.table('profile').add({
      ...testProfile,
      ...meta,
      id: 'p',
      dislikedFoodIds: [],
      dislikedTags: ['fish'],
    });
    await v1.table('sessions').add({
      ...meta,
      id: 's',
      date: '2026-11-08',
      start: '09:00',
      durationMin: 240,
      sport: 'ride',
      indoor: false,
      intensity: { kind: 'zone', zone: 'Z2' },
      key: true,
      source: 'template',
      templateId: 't',
    });
    await v1.table('foods').add({ ...meta, id: 'f', name: 'Oats', tags: [] });
    v1.close();

    const v2 = new FuelDatabase(name);
    await v2.open();
    expect(v2.verno).toBe(2);
    expect(v2.tables.map((x) => x.name).sort()).toEqual([...TABLES].sort());
    const profile = await getProfile(v2);
    expect(profile && 'dislikedTags' in profile).toBe(false);
    expect(profile?.massKg).toBe(75);
    const session = await v2.sessions.get('s');
    expect(session && Object.keys(session).sort()).toEqual([
      'createdAt',
      'date',
      'durationMin',
      'id',
      'intensity',
      'key',
      'sport',
      'start',
      'updatedAt',
    ]);
    v2.close();
    await v2.delete();
  });
});

describe('repositories', () => {
  it('stamps metadata and keeps id and createdAt on update', async () => {
    const first = await saveProfile(db, testProfile);
    expect(first.id).toMatch(/^[0-9a-f-]{36}$/);
    const second = await saveProfile(db, { ...testProfile, heightCm: 182 });
    expect(second.id).toBe(first.id);
    expect(second.createdAt).toBe(first.createdAt);
    expect(await db.profile.count()).toBe(1);
  });

  it('rejects a coefficient outside its DOMAIN range', async () => {
    await expect(
      saveProfile(db, { ...testProfile, neaFactor: 1.6 }),
    ).rejects.toThrow();
  });

  it('mirrors the latest body mass entry into the profile', async () => {
    await saveProfile(db, testProfile);
    await addBodyMass(db, { date: '2026-11-01', massKg: 74.2 });
    const later = await addBodyMass(db, { date: '2026-11-03', massKg: 73.8 });
    await addBodyMass(db, { date: '2026-10-30', massKg: 75.5 });
    expect((await getProfile(db))?.massKg).toBe(73.8);

    await removeBodyMass(db, later.id);
    expect((await getProfile(db))?.massKg).toBe(74.2);
    expect((await listBodyMass(db)).map((e) => e.date)).toEqual([
      '2026-10-30',
      '2026-11-01',
    ]);
  });

  it('replaces an entry on the same date and does not copy body fat', async () => {
    await saveProfile(db, testProfile);
    await addBodyMass(db, { date: '2026-11-01', massKg: 74.2 });
    await addBodyMass(db, { date: '2026-11-01', massKg: 74.0, bodyFatPct: 14 });
    expect(await db.bodyMass.count()).toBe(1);
    const profile = await getProfile(db);
    expect(profile?.massKg).toBe(74.0);
    expect(profile?.bodyFatPct).toBeUndefined();
  });

  it('finds the goal in force on a date', async () => {
    await saveGoal(db, { kind: 'maintain', validFrom: '2026-01-01' });
    await saveGoal(db, {
      kind: 'lose',
      rateKgPerWeek: 0.3,
      validFrom: '2026-11-01',
    });
    expect((await currentGoal(db, '2026-10-31'))?.kind).toBe('maintain');
    expect((await currentGoal(db, '2026-11-01'))?.kind).toBe('lose');
    expect(await currentGoal(db, '2025-12-31')).toBeUndefined();
  });

  it('switches the protein default with the goal kind', async () => {
    await saveProfile(db, testProfile); // 1.8 g/kg
    await saveGoal(db, { kind: 'maintain', validFrom: '2026-01-01' });
    await saveGoal(db, {
      kind: 'lose',
      rateKgPerWeek: 0.3,
      validFrom: '2026-11-01',
    });
    expect((await getProfile(db))?.proteinGPerKg).toBe(2.0);
    await saveGoal(db, { kind: 'maintain', validFrom: '2026-12-01' });
    expect((await getProfile(db))?.proteinGPerKg).toBe(1.8);
  });

  it('merges concurrent profile patches without losing either', async () => {
    await saveProfile(db, testProfile);
    await Promise.all([
      updateProfile(db, { skipBreakfast: true }),
      updateProfile(db, { allowBackToBackHardRides: true }),
    ]);
    const p = await getProfile(db);
    expect(p?.skipBreakfast).toBe(true);
    expect(p?.allowBackToBackHardRides).toBe(true);
    expect(p?.massKg).toBe(75);
  });

  it('saves first-run data together', async () => {
    await completeFirstRun(db, {
      profile: testProfile,
      goal: { kind: 'maintain', validFrom: '2026-11-04' },
      date: '2026-11-04',
    });
    expect(await db.profile.count()).toBe(1);
    expect(await db.goals.count()).toBe(1);
    expect((await listBodyMass(db))[0]?.massKg).toBe(75);
  });
});

describe('export and import', () => {
  it('round-trips every table', async () => {
    await completeFirstRun(db, {
      profile: testProfile,
      goal: { kind: 'maintain', validFrom: '2026-11-04' },
      date: '2026-11-04',
    });
    const file = await exportData(db, new Date('2026-11-04T10:00:00Z'));
    expect(file.schemaVersion).toBe(2);
    expect(file.exportedAt).toBe('2026-11-04T10:00:00.000Z');

    const check = checkImport(JSON.stringify(file));
    if (!check.ok) throw new Error(check.reason);
    expect(check.counts.profile).toBe(1);
    expect(check.counts.goals).toBe(1);
    expect(check.counts.bodyMass).toBe(1);

    const other = new FuelDatabase(`${db.name}-other`);
    await other.open();
    const goal = file.data.goals[0];
    if (!goal) throw new Error('no goal');
    await other.goals.add({ ...goal, id: 'stale' });
    await replaceAllData(other, check.file);
    expect(await exportData(other, new Date('2026-11-04T10:00:00Z'))).toEqual(
      file,
    );
    other.close();
    await other.delete();
  });

  it('refuses a newer schema version', () => {
    const r = checkImport(
      JSON.stringify({ app: 'fuel-planner', schemaVersion: 3, data: {} }),
    );
    expect(r).toEqual({ ok: false, reason: 'newer-version', detail: '3' });
  });

  it('imports a version 1 file without its removed tables and fields', () => {
    const meta = { createdAt: 'x', updatedAt: 'x' };
    const r = checkImport(
      JSON.stringify({
        app: 'fuel-planner',
        schemaVersion: 1,
        exportedAt: 'x',
        data: {
          profile: [
            {
              ...testProfile,
              ...meta,
              id: 'p',
              dislikedFoodIds: [],
              dislikedTags: [],
            },
          ],
          goals: [],
          bodyMass: [],
          sessions: [
            {
              ...meta,
              id: 's',
              date: '2026-11-08',
              start: '09:00',
              durationMin: 60,
              sport: 'run',
              indoor: false,
              intensity: { kind: 'pace', secPerKm: 300 },
              key: false,
              source: 'manual',
            },
          ],
          weekTemplates: [],
          foods: [{ id: 'f' }],
          mealTemplates: [],
          plans: [],
          logEntries: [],
        },
      }),
    );
    if (!r.ok) throw new Error(r.reason);
    expect(Object.keys(r.file.data).sort()).toEqual([...TABLES].sort());
    expect('source' in (r.file.data.sessions[0] ?? {})).toBe(false);
    expect('dislikedTags' in (r.file.data.profile[0] ?? {})).toBe(false);
  });

  it('refuses other files and invalid data', () => {
    expect(checkImport('not json')).toEqual({ ok: false, reason: 'not-json' });
    expect(checkImport('{"app":"other"}')).toEqual({
      ok: false,
      reason: 'not-fuel-planner',
    });
    const bad = checkImport(
      JSON.stringify({
        app: 'fuel-planner',
        schemaVersion: 1,
        exportedAt: 'x',
        data: { profile: [{ sex: 'robot' }] },
      }),
    );
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.reason).toBe('invalid');
  });
});
