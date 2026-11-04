import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  FuelDatabase,
  checkImport,
  deleteLogEntry,
  exportData,
  listLog,
  logFood,
  updateLoggedGrams,
} from '../../src/db/index.ts';

let db: FuelDatabase;
let counter = 0;
beforeEach(async () => {
  counter += 1;
  db = new FuelDatabase(`log-${String(counter)}`);
  await db.open();
});
afterEach(async () => {
  db.close();
  await db.delete();
});

describe('food log (D38)', () => {
  it('ticks, edits, unticks and lists by date and time', async () => {
    const tick = await logFood(db, {
      date: '2026-11-04',
      time: '12:30',
      slotKind: 'meal',
      slotId: 'meal-1',
      foodId: 'pasta',
      grams: 160,
    });
    await logFood(db, {
      date: '2026-11-04',
      time: '10:00',
      foodId: 'banana',
      grams: 120,
    });
    await logFood(db, {
      date: '2026-11-05',
      time: '08:00',
      foodId: 'oats',
      grams: 50,
    });
    expect((await listLog(db, '2026-11-04')).map((e) => e.foodId)).toEqual([
      'banana',
      'pasta',
    ]);

    await updateLoggedGrams(db, tick.id, 140);
    const edited = await db.logEntries.get(tick.id);
    expect(edited?.grams).toBe(140);
    expect(edited?.slotId).toBe('meal-1');
    expect(edited?.createdAt).toBe(tick.createdAt);

    await deleteLogEntry(db, tick.id);
    expect(await listLog(db, '2026-11-04')).toHaveLength(1);
  });

  it('rejects non-positive grams', async () => {
    await expect(
      logFood(db, { date: '2026-11-04', time: '10:00', foodId: 'x', grams: 0 }),
    ).rejects.toThrow();
  });

  it('round-trips log entries through export', async () => {
    await logFood(db, {
      date: '2026-11-04',
      time: '10:00',
      slotId: 'meal-0',
      foodId: 'x',
      grams: 5,
    });
    const check = checkImport(JSON.stringify(await exportData(db)));
    expect(check.ok && check.counts.logEntries).toBe(1);
  });
});
