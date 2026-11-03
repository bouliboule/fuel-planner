# Data model

All entities are Zod schemas in `src/model/`, with TypeScript types inferred
from them. Every stored record has `id` (UUID v7, sortable by time),
`createdAt` and `updatedAt` (ISO strings). The Dexie database has a
`schemaVersion`; every change ships with a migration and a migration test.

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
  dislikedFoodIds: string[];
  dislikedTags: string[];      // e.g. 'fish', 'olive'
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

```ts
type Sport = 'ride' | 'run' | 'strength' | 'pilates' | 'walk' | 'other';

type Session = {
  date: string;                // local date
  start: string;               // 'HH:mm'
  durationMin: number;
  sport: Sport;
  indoor: boolean;
  intensity:
    | { kind: 'zone'; zone: 'Z1'|'Z2'|'Z3'|'SS'|'Z4'|'Z5' }
    | { kind: 'if'; value: number }
    | { kind: 'kj'; value: number }
    | { kind: 'rpe'; value: number }        // 1..10
    | { kind: 'met'; value: number; compendiumCode?: string }
    | { kind: 'pace'; secPerKm: number };   // runs: expected pace
  distanceKm?: number;         // measured distance, replaces the pace estimate
  key: boolean;                // key session: no deficit that day (E6)
  title?: string;
  source: 'manual' | 'template' | 'import';
  templateId?: string;
};

type WeekTemplate = {
  name: string;
  sessions: (Omit<Session, 'date' | 'source'> & { weekday: 1|2|3|4|5|6|7 })[];
};
```

## Food

```ts
type Food = {
  name: string;
  brand?: string;
  per100g: {
    kcal: number; carbG: number; sugarG?: number; fibreG?: number;
    proteinG: number; fatG: number; sodiumMg?: number;
    glucoseG?: number; fructoseG?: number;   // for T2 ratio checks
  };
  unit?: { name: string; grams: number };     // '1 scoop' = 30 g
  portion: { minG: number; maxG: number; stepG: number; defaultG: number };
  tags: string[];   // 'breakfast', 'pre', 'on-bike', 'recovery', 'meal', 'snack'
  source: 'manual' | 'ciqual' | 'off';
  sourceRef?: string;          // CIQUAL code or barcode
};
```

## MealTemplate

```ts
type MealTemplate = {
  name: string;
  slotKinds: SlotKind[];
  items: { foodId: string; fixedG?: number; scalable: boolean }[];
};
```

## Plan (computed, cached)

```ts
type SlotKind = 'meal' | 'pre' | 'pre-snack' | 'during' | 'recovery' | 'snack' | 'bedtime';

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
  picks: { foodId: string; grams: number }[];
  achieved: Macros;
  warnings: Warning[];
};

type DayPlan = {
  date: string;
  inputsHash: string;          // invalidate when inputs change
  energy: { bmr: number; nonExercise: number; exercise: { sessionId: string; kcal: number; method: string }[]; goalAdj: number; target: number };
  macros: Macros;
  load: 'rest' | 'light' | 'moderate' | 'high' | 'very-high';
  slots: Slot[];
  warnings: Warning[];
  trace: TraceStep[];          // inputs, rule IDs and intermediate values
};

type Macros = { kcal: number; carbG: number; proteinG: number; fatG: number };
type Warning = { code: string; ruleId: string; values?: Record<string, number|string> };
type TraceStep = { ruleId: string; label: string; inputs: Record<string, number|string>; output: number };
```

The engine emits warning codes and values only; the UI turns them into text
through the i18n module.

`trace` powers the "why this number" view. Every engine function that
produces a displayed value appends a `TraceStep`.

## LogEntry (optional, milestone M6)

```ts
type LogEntry = { date: string; time: string; slotKind?: SlotKind; foodId: string; grams: number };
```

## Export format

One JSON file: `{ app: 'fuel-planner', schemaVersion, exportedAt, data: {...} }`
containing every table. Import validates with Zod and refuses unknown
`schemaVersion` values newer than the app's.
