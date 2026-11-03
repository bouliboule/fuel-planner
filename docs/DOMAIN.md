# Domain rules

This file is the source of truth for every number in `src/engine/`. Each rule
has an ID (`E1`, `M2`...) that constants and tests reference. Where sources
give a range, the engine stores the range and the profile stores the chosen
point inside it (default: midpoint unless stated).

These rules come from sports-nutrition consensus statements aimed at healthy
trained adults. They are population averages; individual needs vary and the
uncertainty on daily expenditure is easily 10 % or more.

## 1. Energy

### E1. Resting energy (BMR)

Default, Mifflin-St Jeor (1990):

- male: `10 * mass_kg + 6.25 * height_cm - 5 * age + 5`
- female: `10 * mass_kg + 6.25 * height_cm - 5 * age - 161`

If body-fat % is set, Katch-McArdle:

- `370 + 21.6 * lean_mass_kg`, with `lean_mass_kg = mass_kg * (1 - bf)`

### E2. Non-exercise activity

`daily_base = BMR * nea_factor`, where `nea_factor` covers daily life
without training: 1.2 (desk, little walking) to 1.5 (on feet most of the day).
Default 1.35. Commuting by bike counts here only if not logged as a session.

Do not use the classic "activity multipliers" (1.55, 1.725...) on top of
logged sessions: they already include exercise and would count it twice.

### E3. Exercise energy, cycling with power

Mechanical work in kJ is either planned (`kJ`) or derived:
`kJ = avg_power_W * duration_s / 1000`, with
`avg_power_W = intensity_factor * FTP` if only IF or zone is known.

Metabolic energy: `kcal = kJ / (gross_efficiency * 4.184)`.
Gross efficiency default 0.24 (range 0.20 to 0.25). At 0.24, kcal is about
equal to kJ, which is the usual rule of thumb.

Zone to intensity factor (Coggan zones, midpoint):
Z1 0.50, Z2 0.65, Z3 0.83, sweet spot 0.90, Z4 0.98, Z5 1.10.
Ride-level IF for intervals is computed from the planned structure if given,
otherwise from the dominant zone.

### E4. Exercise energy, everything else

`kcal = (MET - 1) * mass_kg * hours` (net of resting energy, already counted
in E1). MET values from the 2024 Adult Compendium of Physical Activities.
Store the compendium code next to each value in `constants.ts`. Starting set
to verify against the compendium before use:

- running: by pace, compendium running codes
- Pilates, general: about 3.0
- resistance training, circuit, moderate effort: about 3.5 to 5.0
- cycling without power data: by speed or effort, compendium cycling codes

Running alternative when distance is known: net `kcal = 1.0 * mass_kg * km`
(range 0.9 to 1.05, roughly independent of pace on flat ground).

### E5. Daily total

`TDEE = daily_base + sum(exercise_kcal)`. Display all three parts.

### E6. Goal adjustment

- maintain: 0
- lose: `-rate_kg_per_week * 7700 / 7` kcal/day. Cap rate at 0.5 % of body
  mass per week. Apply the deficit on low and moderate days only; on days with
  more than 2.5 h of training or a key session, target maintenance.
- gain: `+250` kcal/day default, user editable.

### E7. Energy availability guard

`EA = (intake_kcal - exercise_kcal) / fat_free_mass_kg`.
If body-fat % is unknown, use `fat_free_mass = 0.85 * mass` for males and
`0.75 * mass` for females and show that it is an estimate.
Warn when a planned day has `EA < 30` kcal/kg FFM, the threshold associated
with low energy availability (IOC consensus on REDs, 2023). Warn, never block.

## 2. Macronutrients

### M1. Protein

1.6 to 2.2 g/kg/day (Morton et al. 2018 meta-analysis; ISSN 2017 position
stand). Default 1.8; default 2.0 when goal is lose.
Distribute over 4 to 5 eating occasions at about 0.3 to 0.4 g/kg each, one
of them within 2 h after the main session and one before sleep if the gap to
breakfast is over 10 h.

### M2. Carbohydrate, scaled to daily load

From Burke et al. 2011 and the ACSM 2016 joint position statement:

| Load      | Definition                                   | g/kg/day |
|-----------|----------------------------------------------|----------|
| light     | low intensity or skill work, under 1 h       | 3 to 5   |
| moderate  | about 1 h/day at moderate intensity          | 5 to 7   |
| high      | 1 to 3 h/day moderate to high intensity      | 6 to 10  |
| very high | over 4 to 5 h/day moderate to high intensity | 8 to 12  |

Load classification uses total session minutes and the highest intensity of
the day. Rest days use light, lower bound by default.

### M3. Fat

Remainder: `fat_g = (target_kcal - 4 * protein_g - 4 * carb_g) / 9`.
Floor at 20 % of energy and at 0.8 g/kg. If the floor is hit, reduce
carbohydrate toward the lower bound of its range first, then flag the day as
over target rather than cutting protein.

### M4. Fibre

Show only. Target 25 to 35 g/day, but limit fibre in the pre-session slot
(under about 5 g within 3 h of a hard or long session).

## 3. Timing

### T1. Pre-session

- Meal 3 to 4 h before: 1 to 4 g/kg carbohydrate, scaled by session length
  and intensity (ACSM 2016). Default 2 g/kg for sessions over 90 min,
  1 g/kg for 60 to 90 min hard sessions.
- Snack 30 to 60 min before when the last meal is over 3 h earlier: 0.5 g/kg
  easily digested carbohydrate, low fat and fibre.
- Sessions under 60 min at low intensity: no specific pre-session slot.

### T2. During session

From Jeukendrup 2014 and the ACSM 2016 statement:

| Duration       | Carbohydrate                                      |
|----------------|---------------------------------------------------|
| under 45 min   | none needed                                       |
| 45 to 75 min   | small amounts or mouth rinse                      |
| 1 to 2.5 h     | 30 to 60 g/h                                      |
| over 2.5 h     | up to 90 g/h, multiple transportable carbohydrate |

Above 60 g/h, use glucose (or maltodextrin) plus fructose, ratio about 1:0.8
(range 2:1 to 1:0.8). Rates above 90 g/h (up to 120 g/h) are used by some
athletes after gut training; allow as a user override with a warning, not as
a default. The user's historical target is 60 to 90 g/h on long efforts.

Output: total grams, grams per hour, and a schedule (every 20 to 30 min),
mapped to the user's on-bike foods.

### T3. Fluid and sodium during sessions

Default fluid 400 to 800 ml/h, adjusted by temperature if entered. Sodium
300 to 600 mg/h for sessions over 2 h or hot conditions. Individual sweat rate
varies widely; if the user enters a measured sweat rate
(`(mass_before - mass_after + fluid_drunk - urine) / hours`), use it and aim
to replace 60 to 80 % of it.

### T4. Recovery

- Next hard session within 8 h: 1.0 to 1.2 g/kg/h carbohydrate for the first
  4 h, starting as soon as practical (ACSM 2016).
- Otherwise: normal meals cover glycogen restoration; place the next main meal
  within about 2 h.
- Protein 0.3 to 0.4 g/kg in the recovery slot (counts toward M1).

### T5. Carbohydrate loading

For a goal event over 90 min: 10 to 12 g/kg/day for the 36 to 48 h before.
Only when an event date is set. Reduce fibre on those days.

### T6. Time-restricted eating

Optional eating window (for example 12:00 to 20:00). Any slot with energy
(including protein shakes and zero-carb drinks with calories) counts as
eating. If a session falls outside the window and needs T1, T2 or T4 slots,
the engine flags the conflict and proposes moving the window or the session;
it does not drop fueling silently.

## 4. Slot construction

For each day:

1. Place sessions on the timeline.
2. Insert fixed slots: T1, T2, T4 per session.
3. Fill remaining day with regular meals at the usual meal times, moving a
   meal if it lands within 90 min before a hard session.
4. Assign protein per M1 across slots.
5. Assign carbohydrate: T1, T2, T4 first, the remainder spread across meals
   weighted toward the meal before and the meal after the main session.
6. Assign fat to regular meals, avoiding the pre-session and during slots.

## 5. Portion solving

Each slot has targets (kcal, C, P, F) with tolerances (default: carbohydrate
and protein within 10 %, energy within 10 %). Pick a meal template or food set
tagged for that slot, then solve portion sizes:

- Variables: grams of each food, bounded by min and max portion and rounded to
  the food's step (for example 5 g, 1 unit, 1 scoop).
- Objective: minimise weighted squared deviation from slot targets.
- Small problem (2 to 6 foods), so a bounded least-squares or a small brute
  force over rounded steps is enough. No LP library needed in v1.

If no combination reaches tolerance, return the best one and mark the gap.

## Sources

- Mifflin MD et al. A new predictive equation for resting energy expenditure
  in healthy individuals. Am J Clin Nutr 1990.
- Herrmann SD et al. 2024 Adult Compendium of Physical Activities. J Sport
  Health Sci 2024.
- Thomas DT, Erdman KA, Burke LM. ACSM / Academy of Nutrition and Dietetics /
  Dietitians of Canada joint position statement: Nutrition and athletic
  performance. Med Sci Sports Exerc 2016.
- Burke LM et al. Carbohydrates for training and competition. J Sports Sci
  2011.
- Jeukendrup A. A step towards personalized sports nutrition: carbohydrate
  intake during exercise. Sports Med 2014.
- Morton RW et al. A systematic review, meta-analysis and meta-regression of
  the effect of protein supplementation on resistance training-induced gains.
  Br J Sports Med 2018.
- Jäger R et al. ISSN position stand: protein and exercise. JISSN 2017.
- Mountjoy M et al. 2023 IOC consensus statement on Relative Energy Deficiency
  in Sport (REDs). Br J Sports Med 2023.

Before implementing M0 to M2, Claude Code should check the MET values in E4
against the published compendium tables and record the codes used.
