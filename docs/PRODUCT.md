# Product

## Problem

Training load changes a lot from day to day: a rest day, a 45-minute run, a
Pilates class, a hard evening club ride, a four-hour Sunday ride. Eating the
same thing every day under-fuels the big days and over-fuels the small ones.
Under-fueling during and after long afternoon sessions is a known recurring
problem. Planning by hand means redoing the same arithmetic every week.

## What the app does

Given a profile, a goal and the planned sessions for a day or a week, the app
produces for each day:

1. An energy target in kcal, split into resting, non-exercise activity and
   exercise components, so the number can be checked.
2. Macro targets in grams (carbohydrate, protein, fat), with carbohydrate
   scaled to that day's training load.
3. A timeline of eating slots placed around the sessions: pre-session,
   during-session fueling, recovery, and regular meals, each with its own
   carbohydrate and protein amount.
4. Concrete food suggestions per slot, picked from the user's own food list
   and meal templates, with portions scaled to hit the slot target.
5. A shopping list for the week.

The user can then log what was actually eaten (optional) and see the gap.

## Inputs

- Profile: sex, age, height, body mass, optional body-fat %, optional FTP,
  time zone, wake and sleep times, usual meal times.
- Goal: maintain, lose (kg per week, capped), or gain. Optional event date for
  carbohydrate loading.
- Sessions: sport, start time, duration, intensity (zone, RPE, or planned
  kJ / TSS for cycling), indoor or outdoor.
- Recurring weekly template of sessions, editable per week.
- Constraints: disliked foods, eating window (optional time-restricted
  eating), foods to avoid during sessions, max caffeine.
- Food list: foods with per-100 g nutrition, usual portion, and tags
  (breakfast, pre-ride, on-bike, recovery, dinner).
- Meal templates: named combinations of foods with scalable portions.

## Non-goals for v1

- No social, sharing or coaching features.
- No AI-generated recipes. Suggestions come from the user's foods and
  templates.
- No medical use. The app does not handle diabetes, allergies as a safety
  feature, or eating disorders. It shows a fixed notice that it is not medical
  advice.
- No micronutrient planning beyond sodium and fluid around sessions.
- No backend or account. Data stays on the device, with JSON export/import.

## Later (not v1)

- Import planned workouts from intervals.icu (API) or from `.ics` / `.zwo` /
  `.fit` files.
- Import completed rides to correct exercise energy with measured kJ.
- Adaptive expenditure: estimate real maintenance from logged intake and a
  smoothed body-mass trend.
- Barcode scanning against Open Food Facts.
- French UI.
- Sync between devices through a JSON file in a synced folder.

## Success criteria

- Planning a normal week takes under 5 minutes once the template exists.
- Every number on screen can be traced to a formula and an input in one tap
  ("why this number").
- Works offline after first load, including on iPhone from the home screen.
