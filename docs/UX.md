# UX

Mobile first (iPhone width), usable on desktop. One-handed use in the kitchen
and on the bike stop. Large tap targets, dark mode following the system.

## Navigation

Bottom tab bar: Today, Week, Foods, Settings.

## Today

- Header: date, load badge (rest / light / moderate / high / very high),
  target kcal, and C / P / F in grams with g/kg underneath.
- Timeline, top to bottom, of slots and sessions. Each slot card shows time,
  kind, targets, and the picked foods with grams. Tap a food to swap it with
  another food carrying the same tag; portions re-solve.
- Session card shows estimated kcal and the method (power, MET, distance).
- During-session card shows total carbohydrate, g/h, fluid and sodium, the
  feed schedule, and what to pack: each on-bike food with its grams, or a
  unit count when the food has a unit (D36).
- A slot outside tolerance shows a Gap badge and what its foods give.
- Warnings inline on the card they concern (low EA, eating-window conflict,
  slot target not reachable with current foods).
- "Why" button on any number opens the trace: rule ID, formula, inputs.
- Logging (M6): tick a picked food as eaten (logs its planned grams), edit
  the grams eaten, add an eaten food that was not planned. The header shows
  target, eaten and difference for kcal, C, P and F once anything is logged.

## Week

- Seven rows, Monday to Sunday, with previous and next week: sessions,
  target kcal, carbohydrate g/kg. Tap a day to add, edit or delete its
  sessions.
- Apply a week template (replaces the week after confirmation), then edit
  sessions per day. Templates screen: create, edit, duplicate, delete.
- Shopping list button: aggregates picked foods for the selected days, groups
  by the food's shop section, rounds up to its purchase unit (D36).

## Session editor

Sport, start, duration, intensity input adapted to the sport (zone or kJ for
rides, pace or distance for runs, effort for strength), key session toggle.
Live preview of the kcal estimate.

## Foods

- List with search and tag filter.
- Add: manual, search CIQUAL subset, search Open Food Facts (online only).
- Food editor: per 100 g values, unit, portion bounds and step, tags.
- Meal templates tab.

## Settings

Profile, goal, body mass entries (with a small trend chart), coefficients
(NEA factor, efficiency, protein g/kg, carb point in range) each showing the
allowed range, eating window, export/import, storage persistence status,
app version and update check, the not-medical-advice notice.

## First run

Short setup: profile, goal, week template (the seed standard week with its
missing times filled in, or skip), the not-medical-advice notice, then the
seed food list: each food filled from CIQUAL or the label, or skipped. Then
land on Today.
