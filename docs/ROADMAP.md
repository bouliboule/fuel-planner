# Roadmap

Work in order. Each milestone ends with the definition of done in CLAUDE.md.

## M0. Scaffold

- [ ] Vite + React + TS strict, pnpm, ESLint, Prettier, Tailwind, Vitest,
      Playwright, vite-plugin-pwa, Dexie, Zod installed and configured.
- [ ] Folder layout from ARCHITECTURE.md with empty modules.
- [ ] Installable PWA shell with the four tabs, works offline in `pnpm preview`.
- [ ] CI script (`pnpm ci`) running typecheck, lint, test, build.

Acceptance: Lighthouse PWA installability passes; app loads offline.

## M1. Engine: energy and macros

- [ ] `constants.ts` with all E and M constants and sources.
- [ ] E1 to E7, M1 to M3 implemented with trace steps.
- [ ] Load classification for M2.
- [ ] Fixtures: rest day, Monday run intervals, Wednesday sweet spot indoor,
      Thursday hard club ride, Sunday 4 h+ ride, using `seed/profile.json`.

Acceptance: fixture outputs match hand-computed values in the tests.

## M2. Engine: timing and slots

- [ ] T1 to T6 and slot construction (DOMAIN section 4).
- [ ] During-session schedule with g/h and intervals.
- [ ] Eating-window conflict detection.

Acceptance: Sunday fixture produces pre, during (with schedule), recovery and
meal slots whose carbohydrate sums to the day target within 1 g.

## M3. Data layer and profile

- [ ] Dexie schema v1, repositories, migrations test.
- [ ] Profile, goal, body mass, settings screens.
- [ ] JSON export/import with Zod validation.
- [ ] First-run flow and seed loading.

## M4. Sessions and week

- [ ] Session editor with live kcal preview.
- [ ] Week templates, apply to a week, per-day edits.
- [ ] Week view with kcal and carbohydrate g/kg per day.

## M5. Foods, portions, Today

- [ ] Food list and editor, meal templates.
- [ ] Bundled CIQUAL subset and conversion script.
- [ ] Portion solver (DOMAIN section 5) with tests.
- [ ] Today screen with timeline, swaps, warnings and "why" traces.
- [ ] Shopping list.

Acceptance: a full week from the seed template plans in under 200 ms on a
recent phone; every slot either meets tolerance or shows its gap.

## M6. Logging (optional)

- [ ] Tick foods as eaten, edit grams, add unplanned items.
- [ ] Planned vs actual per day.

## Later

- intervals.icu import of planned and completed workouts.
- Adaptive maintenance estimate from intake log and smoothed mass trend
  (exponentially weighted average, at least 3 weeks of data).
- Open Food Facts barcode scanning.
- French UI.
- File-based sync.
