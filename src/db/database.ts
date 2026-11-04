import { Dexie, type EntityTable } from 'dexie';
import type {
  PlanCache,
  RecordMeta,
  StoredBodyMassEntry,
  StoredFood,
  StoredGoal,
  StoredLogEntry,
  StoredMealTemplate,
  StoredProfile,
  StoredSession,
  WeekTemplate,
} from '../model/index.ts';

/**
 * Current schema version. Every change bumps it, adds a `version(n)` block
 * with its upgrade, and adds a migration test (docs/DATA_MODEL.md).
 */
export const SCHEMA_VERSION = 1;

export const TABLES = [
  'profile',
  'goals',
  'bodyMass',
  'sessions',
  'weekTemplates',
  'foods',
  'mealTemplates',
  'plans',
  'logEntries',
] as const;
export type TableName = (typeof TABLES)[number];

export class FuelDatabase extends Dexie {
  profile!: EntityTable<StoredProfile, 'id'>;
  goals!: EntityTable<StoredGoal, 'id'>;
  bodyMass!: EntityTable<StoredBodyMassEntry, 'id'>;
  sessions!: EntityTable<StoredSession, 'id'>;
  weekTemplates!: EntityTable<WeekTemplate & RecordMeta, 'id'>;
  foods!: EntityTable<StoredFood, 'id'>;
  mealTemplates!: EntityTable<StoredMealTemplate, 'id'>;
  plans!: EntityTable<PlanCache & RecordMeta, 'id'>;
  logEntries!: EntityTable<StoredLogEntry, 'id'>;

  constructor(name = 'fuel-planner') {
    super(name);
    // Version 1. Only indexed fields are listed; records hold the rest.
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
  }
}

export const db = new FuelDatabase();
