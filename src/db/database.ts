import { Dexie, type EntityTable } from 'dexie';
import type {
  StoredBodyMassEntry,
  StoredGoal,
  StoredProfile,
  StoredSession,
} from '../model/index.ts';

/**
 * Current schema version. Every change bumps it, adds a `version(n)` block
 * with its upgrade, and adds a migration test (docs/DATA_MODEL.md).
 */
export const SCHEMA_VERSION = 2;

export const TABLES = ['profile', 'goals', 'bodyMass', 'sessions'] as const;
export type TableName = (typeof TABLES)[number];

// Fields that version 2 removes from stored records (D43, D44).
const REMOVED_PROFILE_FIELDS = ['dislikedFoodIds', 'dislikedTags'] as const;
const REMOVED_SESSION_FIELDS = ['indoor', 'source', 'templateId'] as const;

export class FuelDatabase extends Dexie {
  profile!: EntityTable<StoredProfile, 'id'>;
  goals!: EntityTable<StoredGoal, 'id'>;
  bodyMass!: EntityTable<StoredBodyMassEntry, 'id'>;
  sessions!: EntityTable<StoredSession, 'id'>;

  constructor(name = 'fuel-planner') {
    super(name);
    // Only indexed fields are listed; records hold the rest.
    this.version(1).stores({
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
    // Version 2: one-day planner (D39). Drops the food, template, plan and
    // log tables and the fields nothing reads any more.
    this.version(2)
      .stores({
        weekTemplates: null,
        foods: null,
        mealTemplates: null,
        plans: null,
        logEntries: null,
      })
      .upgrade(async (tx) => {
        await tx
          .table('profile')
          .toCollection()
          .modify((p: Record<string, unknown>) => {
            for (const f of REMOVED_PROFILE_FIELDS)
              Reflect.deleteProperty(p, f);
          });
        await tx
          .table('sessions')
          .toCollection()
          .modify((s: Record<string, unknown>) => {
            for (const f of REMOVED_SESSION_FIELDS)
              Reflect.deleteProperty(s, f);
          });
      });
  }
}

export const db = new FuelDatabase();
