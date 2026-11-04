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

- [x] Food list and editor, meal templates.
- [x] Bundled CIQUAL subset and conversion script.
- [x] Portion solver (DOMAIN section 5) with tests.
- [x] Today screen with timeline, swaps, warnings and "why" traces.
- [x] Shopping list.
- [x] First-run step: load the seed food list, completing its nutrition
      values in the food editor.

Acceptance: a full week from the seed template plans in under 200 ms on a
recent phone; every slot either meets tolerance or shows its gap.

## M6. Logging (optional)

- [x] Tick foods as eaten, edit grams, add unplanned items.
- [x] Planned vs actual per day.

## M7. One-day planner

M7 replaces the week, food, portion, shopping and logging features of M4 to
M6 with a single Day screen (D39). Profile and the engine stay.

- [x] Delete foods, meal templates, CIQUAL data and conversion script, Open
      Food Facts search, portion solver, shopping and packing lists,
      logging, week view, week templates, `planWeek`, and
      `seed/foods.json` and `seed/week-template.json`, with their routes,
      tests and i18n strings.
- [x] Dexie schema v2: drop the `foods`, `mealTemplates`, `weekTemplates`,
      `plans` and `log` tables, and the dislike fields on the profile.
      Migration test from v1. Export writes v2; import reads v1 and v2
      (D43).
- [x] Engine: `effort` intensity for Pilates and strength (D44), meal
      guidance keys (DOMAIN G1), carbohydrate and protein ranges on the day
      plan, tests with hand-computed values.
- [x] Day screen: today or tomorrow, activity cards, totals, meal cards
      with guidance and example, warnings (UX Day).
- [x] Activity editor sheet with live kcal estimate.
- [x] Number detail sheet with range, profile point slider and trace.
- [x] Profile screen without food settings; first run is profile, goal,
      notice, then Day.
- [x] Playwright: first run, add a long ride for tomorrow, see pre-workout,
      during and post-workout cards, offline reload keeps the plan.

Acceptance: a rest day shows totals and the usual meals with no activity
entered; a 240 min Z2 ride from the seed profile shows pre-workout, during
(rate, feed rhythm, fluid) and post-workout cards whose carbohydrate sums to
the day target within 1 g; every meal card shows kcal, C / P / F, guidance
and example; the app makes no network request after load (Playwright).

## M8. Skip breakfast and icons

- [x] Engine: skip-breakfast rule (DOMAIN S4, D49) with hand-computed tests.
- [x] Profile: `skipBreakfast` field and its toggle in Profile.
- [x] Icons on the Day screen and activity editor (lucide-react, D51).
- [x] Playwright: with the preference on, a rest day shows no breakfast and
      a morning long ride keeps it.

Acceptance: with the preference on, a rest day has no breakfast card and
the same day totals as with it off; a morning session with a pre meal or
during slot keeps breakfast; an evening session does not.

## M9. Calendar, back-to-back warning, bolder icons

- [x] Engine: hard ride and hard run (D52) and the back-to-back check (D53),
      with tests.
- [x] Session `runType` and the run type choice in the editor.
- [x] Profile: the two back-to-back preferences.
- [x] Calendar screen and the Day screen for any date (`/day/:date`).
- [x] Back-to-back warning in the editor and on activity cards.
- [x] Coloured icon tiles, hard badge, day load banner, icons on guidance,
      during and profile lines.
- [x] Playwright: calendar opens a day; a hard ride after a hard ride warns,
      and stops warning once the preference allows it.

Acceptance: a Z4 ride on a day after a key ride warns in the editor and on
the card; with the preference on it does not; an easy run next to an
intervals run does not warn; the calendar shows a month with sport icons
and opens the tapped day.

## Later

- intervals.icu import of planned workouts.
- French UI.
