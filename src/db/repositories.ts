import { proteinOnGoalChange } from '../engine/goalDefaults.ts';
import {
  bodyMassEntrySchema,
  goalSchema,
  profileSchema,
  uuidv7,
  type BodyMassEntry,
  type Goal,
  type Profile,
  type RecordMeta,
  type StoredBodyMassEntry,
  type StoredGoal,
  type StoredProfile,
} from '../model/index.ts';
import type { FuelDatabase } from './database.ts';

/** Stamps record metadata; keeps id and createdAt of an existing record. */
export function withMeta<T extends object>(
  value: T,
  existing?: RecordMeta,
  now: Date = new Date(),
): T & RecordMeta {
  const at = now.toISOString();
  return {
    ...value,
    id: existing?.id ?? uuidv7(now.getTime()),
    createdAt: existing?.createdAt ?? at,
    updatedAt: at,
  };
}

export async function getProfile(
  db: FuelDatabase,
): Promise<StoredProfile | undefined> {
  return db.profile.toCollection().first();
}

/** Saves the single profile record. */
export async function saveProfile(
  db: FuelDatabase,
  profile: Profile,
): Promise<StoredProfile> {
  const value = profileSchema.parse(profile);
  return db.transaction('rw', db.profile, async () => {
    const existing = await getProfile(db);
    const record = withMeta(value, existing);
    await db.profile.put(record);
    return record;
  });
}

/** The goal in force on `date`: the latest `validFrom` on or before it. */
export async function currentGoal(
  db: FuelDatabase,
  date: string,
): Promise<StoredGoal | undefined> {
  const goals = await db.goals.where('validFrom').belowOrEqual(date).toArray();
  return goals
    .sort(
      (a, b) =>
        a.validFrom.localeCompare(b.validFrom) ||
        a.updatedAt.localeCompare(b.updatedAt),
    )
    .at(-1);
}

/**
 * Adds a goal from `goal.validFrom` on. When the goal kind changes, the
 * profile protein follows the default for the new kind (D27).
 */
export async function saveGoal(
  db: FuelDatabase,
  goal: Goal,
): Promise<StoredGoal> {
  const value = goalSchema.parse(goal);
  return db.transaction('rw', db.goals, db.profile, async () => {
    const previous = await currentGoal(db, value.validFrom);
    const sameDay =
      previous?.validFrom === value.validFrom ? previous : undefined;
    const record = withMeta(value, sameDay);
    await db.goals.put(record);
    const profile = await getProfile(db);
    if (profile) {
      const proteinGPerKg = proteinOnGoalChange(
        profile.proteinGPerKg,
        previous?.kind,
        value.kind,
      );
      if (proteinGPerKg !== profile.proteinGPerKg) {
        await db.profile.put(withMeta({ ...profile, proteinGPerKg }, profile));
      }
    }
    return record;
  });
}

export async function listBodyMass(
  db: FuelDatabase,
): Promise<StoredBodyMassEntry[]> {
  return db.bodyMass.orderBy('date').toArray();
}

/** Profile mass mirrors the latest body mass entry by date. */
async function syncProfileMass(db: FuelDatabase): Promise<void> {
  const latest = await db.bodyMass.orderBy('date').last();
  const profile = await getProfile(db);
  if (latest && profile && profile.massKg !== latest.massKg) {
    await db.profile.put(
      withMeta({ ...profile, massKg: latest.massKg }, profile),
    );
  }
}

/** Adds an entry, replacing any entry on the same date. */
export async function addBodyMass(
  db: FuelDatabase,
  entry: BodyMassEntry,
): Promise<StoredBodyMassEntry> {
  const value = bodyMassEntrySchema.parse(entry);
  return db.transaction('rw', db.bodyMass, db.profile, async () => {
    const existing = await db.bodyMass.where('date').equals(value.date).first();
    const record = withMeta(value, existing);
    await db.bodyMass.put(record);
    await syncProfileMass(db);
    return record;
  });
}

export async function removeBodyMass(
  db: FuelDatabase,
  id: string,
): Promise<void> {
  await db.transaction('rw', db.bodyMass, db.profile, async () => {
    await db.bodyMass.delete(id);
    await syncProfileMass(db);
  });
}

/** First run: profile, goal and first body mass entry in one transaction. */
export async function completeFirstRun(
  db: FuelDatabase,
  input: { profile: Profile; goal: Goal; date: string },
): Promise<void> {
  const profile = profileSchema.parse(input.profile);
  const goal = goalSchema.parse(input.goal);
  await db.transaction('rw', db.profile, db.goals, db.bodyMass, async () => {
    await db.profile.put(withMeta(profile, await getProfile(db)));
    await db.goals.put(withMeta(goal));
    await db.bodyMass.put(
      withMeta({ date: input.date, massKg: profile.massKg }),
    );
  });
}
