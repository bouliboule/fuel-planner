# Data model

All entities are Zod schemas in `src/model/`, with TypeScript types inferred
from them. Every stored record has `id` (UUID v7, sortable by time),
`createdAt` and `updatedAt` (ISO strings). The Dexie database has a
`schemaVersion`; every change ships with a migration and a migration test.

Stored tables: `profile`, `goals`, `bodyMass`, `sessions`. Plans are computed
when shown and never stored.

## Profile (single record)

```ts
type Profile = {
  sex: 'male' | 'female';
  birthYear: number;          // age = plan year - birthYear (DOMAIN E1)
  heightCm: number;
  massKg: number;              // latest value, mirrored from BodyMassEntry
  bodyFatPct?: number;
  ftpW?: number;
  timeZone: string;            // IANA, default 'Europe/Paris'
  wakeTime: string;            // 'HH:mm'
  sleepTime: string;
  usualMeals: { name: string; time: string }[];
  neaFactor: number;           // DOMAIN E2
  grossEfficiency: number;     // DOMAIN E3
  proteinGPerKg: number;       // DOMAIN M1
  carbPointInRange: number;    // 0..1, position inside the M2 range
  onBikeCarbTargetGPerH?: number;
  eatingWindow?: { start: string; end: string };  // DOMAIN T6
  skipBreakfast?: boolean;     // DOMAIN S4, D49; absent means off
};
```

## Goal

```ts
type Goal = {
  kind: 'maintain' | 'lose' | 'gain';
  rateKgPerWeek?: number;      // lose/gain
  gainKcalPerDay?: number;
  event?: { name: string; date: string; expectedDurationMin: number };
  validFrom: string;           // date
};
```

## BodyMassEntry

```ts
type BodyMassEntry = { date: string; massKg: number; bodyFatPct?: number };
```

## Session

The UI calls a session an activity.

```ts
type Sport = 'ride' | 'run' | 'strength' | 'pilates' | 'walk' | 'other';

type Session = {
  date: string;                // local date
  start: string;               // 'HH:mm'
  durationMin: number;
  sport: Sport;
  intensity:
    | { kind: 'zone'; zone: 'Z1'|'Z2'|'Z3'|'SS'|'Z4'|'Z5' }
    | { kind: 'if'; value: number }
    | { kind: 'kj'; value: number }
    | { kind: 'rpe'; value: number }        // 1..10
    | { kind: 'effort'; value: 'easy' | 'moderate' | 'hard' }  // D44
    | { kind: 'met'; value: number; compendiumCode?: string }
    | { kind: 'pace'; secPerKm: number };   // runs: expected pace
  distanceKm?: number;         // measured distance, replaces the pace estimate
  key: boolean;                // key session: no deficit that day (E6)
  title?: string;
};
```

The editor writes `zone`, `kj`, `pace`, `effort` and `met`. The engine still
accepts `if` and `rpe`.

## Plan (computed, not stored)

```ts
type SlotKind = 'meal' | 'pre' | 'pre-snack' | 'during' | 'recovery' | 'snack' | 'bedtime';

type GuidanceKey =                              // DOMAIN G1
  | 'pre-meal' | 'pre' | 'pre-snack'
  | 'during' | 'during-rinse'
  | 'recovery-meal' | 'recovery' | 'recovery-fast'
  | 'meal' | 'snack' | 'bedtime';

type Slot = {
  id: string;                  // stable within a day plan, e.g. 'meal-1', 'during-s1'
  kind: SlotKind;
  time: string;
  name?: string;               // usual meal name
  role?: 'pre' | 'recovery';   // a usual meal acting as pre meal or recovery
  sessionId?: string;
  target: Macros;
  targetRanges?: { carbG?: [number, number]; proteinG?: [number, number] };
  carbGPerH?: number;          // during-session
  fluidMl?: number;
  sodiumMg?: number;
  schedule?: { atMin: number; carbG: number }[];   // during-session
  needsMultipleTransportableCarbs?: boolean;     // above 60 g/h (T2)
  mouthRinseOptional?: boolean;                  // 45 to 75 min (T2)
  fibreLimited?: boolean;                        // M4, T5
  guidance: GuidanceKey;
  warnings: Warning[];
};

type DayPlan = {
  date: string;
  energy: { bmr: number; nonExercise: number; exercise: { sessionId: string; kcal: number; method: string }[]; goalAdj: number; target: number };
  macros: Macros;
  ranges: { carbG: [number, number]; proteinG: [number, number] };
  load: 'rest' | 'light' | 'moderate' | 'high' | 'very-high';
  slots: Slot[];
  warnings: Warning[];
  trace: TraceStep[];          // inputs, rule IDs and intermediate values
};

type Macros = { kcal: number; carbG: number; proteinG: number; fatG: number };
type Warning = { code: string; ruleId: string; values?: Record<string, number|string> };
type TraceStep = { ruleId: string; label: string; inputs: Record<string, number|string>; output: number };
```

The engine emits warning codes, guidance keys and values only; the UI turns
them into text through the i18n module.

`trace` powers the number detail sheet. Every engine function that produces a
displayed value appends a `TraceStep`.

## Export format

One JSON file: `{ app: 'fuel-planner', schemaVersion, exportedAt, data: {...} }`
containing every table. Import validates with Zod and refuses unknown
`schemaVersion` values newer than the app's. A schema version 1 file imports
its profile, goals, body mass and sessions and ignores its other tables
(D43).
