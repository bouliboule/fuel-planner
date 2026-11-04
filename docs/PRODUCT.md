# Product

## Problem

Training load changes a lot from day to day: a rest day, a 45-minute run, a
Pilates class, a hard evening club ride, a four-hour Sunday ride. Eating the
same thing every day under-fuels the big days and over-fuels the small ones.
Under-fueling during and after long afternoon sessions is a known recurring
problem.

The user already logs food in a separate tracking app. What is missing is a
quick answer, the evening before or the same morning, to "given what I am
training today, what should I aim for, and when?".

## What the app does

The user opens the app, picks today or tomorrow, and enters the activities
planned for that day (or none, for a rest day). The app shows:

1. The day's energy target in kcal.
2. The day's macro targets in grams: carbohydrate, protein, fat.
3. The meals of the day in time order: breakfast, pre-workout, during the
   session, post-workout, lunch, snack, dinner, before bed, as the day
   requires. Each meal shows its kcal, its macros, the type of meal to aim for
   and a one-line example.

Each target is a single number. Tapping it shows the range it comes from and
how it was computed.

## Inputs

- Profile, set once: sex, birth year, height, body mass, optional body-fat %,
  optional FTP, time zone, wake and sleep times, usual meal times,
  coefficients (non-exercise activity, efficiency, protein g/kg, carbohydrate
  point in range), optional on-bike carbohydrate rate, optional eating window.
- Goal: maintain, lose (kg per week, capped), or gain. Optional event date for
  carbohydrate loading.
- Activities for the day: sport, start time, duration, intensity, and whether
  it is a key session.

## Non-goals

- No food database, portions, shopping list or food logging. The user's food
  tracking app covers these.
- No week planning or week templates. The app plans one day at a time.
- No social, sharing or coaching features.
- No medical use. The app does not handle diabetes, allergies as a safety
  feature, or eating disorders. It shows a fixed notice that it is not medical
  advice.
- No micronutrient planning beyond sodium and fluid around sessions.
- No backend or account. Data stays on the device, with JSON export/import.

## Later

- Import planned workouts from intervals.icu (API) or from `.ics` / `.zwo` /
  `.fit` files.
- French UI.

## Success criteria

- From opening the app to reading the plan for a day with one activity takes
  under 30 seconds.
- The plan screen is readable at arm's length on a phone: large numbers, one
  card per meal, no tables.
- Every number on screen can be traced to a formula and an input in one tap.
- Works offline after first load, including on iPhone from the home screen.
