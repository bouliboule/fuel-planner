import 'fake-indexeddb/auto';
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
  it('opens version 1 with every table', () => {
    expect(SCHEMA_VERSION).toBe(1);
    expect(db.verno).toBe(SCHEMA_VERSION);
    expect(db.tables.map((t) => t.name).sort()).toEqual([...TABLES].sort());
  });

  it('keeps data across reopening at the current version', async () => {
    // Migration test pattern: write with the previous version, reopen with
    // the current one, read back. With a single version both are v1.
    await saveProfile(db, testProfile);
    db.close();
    const reopened = new FuelDatabase(db.name);
    await reopened.open();
    expect((await getProfile(reopened))?.massKg).toBe(75);
    reopened.close();
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
    expect(file.schemaVersion).toBe(1);
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
      JSON.stringify({ app: 'fuel-planner', schemaVersion: 2, data: {} }),
    );
    expect(r).toEqual({ ok: false, reason: 'newer-version', detail: '2' });
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
