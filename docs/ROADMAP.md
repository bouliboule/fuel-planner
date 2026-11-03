# Roadmap

Work in order. Each milestone ends with the definition of done in CLAUDE.md.

## M0. Scaffold

- [x] Vite + React + TS strict, pnpm, ESLint, Prettier, Tailwind, Vitest,
      Playwright, vite-plugin-pwa, Dexie, Zod installed and configured.
- [x] Folder layout from ARCHITECTURE.md with empty modules.
- [x] Installable PWA shell with the four tabs, works offline in `pnpm preview`.
- [x] CI script (`pnpm check`) running typecheck, lint, test, build.

Acceptance: the Playwright installability test passes (manifest name, icons
including maskable, standalone display, start URL and scope, apple-touch-icon);
the Playwright offline test loads the app with the network off; the app,
installed from Safari on iPhone, opens in airplane mode (manual).

## M1. Engine: energy and macros

- [x] `constants.ts` with all E and M constants and sources.
- [x] E1 to E7, M1 to M3 implemented with trace steps.
- [x] Load classification for M2.
- [x] Fixtures: rest day, Monday run intervals, Wednesday sweet spot indoor,
      Thursday hard club ride, Sunday 4 h+ ride, using `seed/profile.json`
      (labelled test values where the seed is still TODO, see Q9).

Acceptance: fixture outputs match hand-computed values in the tests.

## M2. Engine: timing and slots

- [x] T1 to T6 and slot construction (DOMAIN section 4).
- [x] During-session schedule with g/h and intervals.
- [x] Eating-window conflict detection.

Acceptance: Sunday fixture produces pre, during (with schedule), recovery and
meal slots whose carbohydrate sums to the day target within 1 g.

## M3. Data layer and profile

- [x] Dexie schema v1, repositories, migrations test.
- [x] Profile, goal, body mass, settings screens.
- [x] JSON export/import with Zod validation.
- [x] First-run flow and seed loading (profile prefill from the seed; the
      week template step moves to M4 and seed foods to M5, D26).

## M4. Sessions and week

- [x] Session editor with live kcal preview.
- [x] Week templates, apply to a week, per-day edits.
- [x] Week view with kcal and carbohydrate g/kg per day.
- [x] First-run step: pick or create a week template.

## M5. Foods, portions, Today

- [ ] Food list and editor, meal templates.
- [ ] Bundled CIQUAL subset and conversion script.
- [ ] Portion solver (DOMAIN section 5) with tests.
- [ ] Today screen with timeline, swaps, warnings and "why" traces.
- [ ] Shopping list.
- [ ] First-run step: load the seed food list, completing its nutrition
      values in the food editor.

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
