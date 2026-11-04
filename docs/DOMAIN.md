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

Age is the plan date's year minus the birth year.

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

A ride with a zone or IF but no FTP, or with only an RPE, has no mechanical
work to start from. It falls back to E4 with the compendium cycling codes by
self-selected effort, indoor and outdoor alike, and carries a warning that
the estimate has no power data:

- easy, 01015, 4.3 MET: Z1, Z2, RPE under 4, IF under 0.83
- moderate, 01016, 7.0 MET: Z3, RPE 4 to 6, IF 0.83 to under 0.90
- vigorous, 01017, 9.0 MET: sweet spot, Z4, Z5, RPE 7 or more, IF 0.90 or more

An IF maps to the highest zone whose IF in the table above is at or below it.

### E4. Exercise energy, everything else

`kcal = (MET - 1) * mass_kg * hours` (net of resting energy, already counted
in E1). MET values from the 2024 Adult Compendium of Physical Activities.
Store the compendium code next to each value in `constants.ts`. A session can
carry its own MET and compendium code, which takes precedence. Defaults,
checked against the compendium:

- Pilates, general: 02105, 2.8 MET
- strength, body weight resistance exercises, general: 02056, 3.0 MET
  (the morning circuit: push-ups, bridges, lunges, curls, holds)
- Pilates and strength entered with an effort (easy, moderate, hard) use
  these defaults; the effort only sets the M2 band (D44)
- cycling without power data: see E3
- walk and other sports: no default; the session needs a MET, otherwise the
  engine counts 0 kcal and warns

Running uses distance: net `kcal = 1.0 * mass_kg * km` (range 0.9 to 1.05,
roughly independent of pace on flat ground). The user enters duration and
expected pace; `km = duration_s / pace_s_per_km`. A measured distance, when
given, replaces the estimate. A run with neither pace nor distance nor MET
counts 0 kcal and warns.

### E5. Daily total

`TDEE = daily_base + sum(exercise_kcal)`. Display all three parts.

### E6. Goal adjustment

- maintain: 0
- lose: `-rate_kg_per_week * 7700 / 7` kcal/day. Cap rate at 0.5 % of body
  mass per week. Apply the deficit on low and moderate days only; on days with
  more than 2.5 h of training or a key session, target maintenance. The
  engine applies the deficit exactly when the day has no key session and
  150 min of training or less.
- gain: `+250` kcal/day default, user editable.

### E7. Energy availability guard

`EA = (intake_kcal - exercise_kcal) / fat_free_mass_kg`, where intake is the
planned day total, including any excess from the M3 fat floor.
If body-fat % is unknown, use `fat_free_mass = 0.85 * mass` for males and
`0.75 * mass` for females and show that it is an estimate.
Warn when a planned day has `EA < 30` kcal/kg FFM, the threshold associated
with low energy availability (IOC consensus on REDs, 2023). Warn, never block.

## 2. Macronutrients

### M1. Protein

1.6 to 2.2 g/kg/day (Morton et al. 2018 meta-analysis; ISSN 2017 position
stand). Default 1.8; default 2.0 when goal is lose.
The engine uses the profile value as is. The 2.0 default for a lose goal is
applied by the settings screen when the goal changes, not by the engine.
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

Session intensity band, from the session's intensity input:

| Input | low      | moderate | high              |
|-------|----------|----------|-------------------|
| zone  | Z1       | Z2, Z3   | sweet spot, Z4, Z5 |
| RPE   | under 4  | 4 to 6   | 7 or more         |
| MET   | under 3  | 3 to 6   | 6 or more         |
| effort | easy   | moderate | hard              |

- IF: the zone it maps to (E3).
- kJ: the IF from FTP when known, otherwise the MET equivalent of the
  session's energy, `kcal / (mass_kg * hours) + 1`.
- pace: the MET of the compendium running code for that speed. Every code
  from 4 mph (6.44 km/h, 12028, 6.5 MET) up is 6 MET or more, so these
  runs are high; slower is jogging, 12026, 3.3 MET, moderate.

Day load:

| Load      | Rule                                                   |
|-----------|--------------------------------------------------------|
| rest      | no sessions                                            |
| light     | under 60 min in total, or every session is low         |
| moderate  | 60 to 89 min                                           |
| high      | 90 to 239 min                                          |
| very high | 240 min or more                                        |

### M3. Fat

Remainder: `fat_g = (target_kcal - 4 * protein_g - 4 * carb_g) / 9`.
Floor at 20 % of energy and at 0.8 g/kg (the higher of the two). If the
floor is hit, reduce carbohydrate toward the lower bound of its range first,
then flag the day as over target rather than cutting protein.

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

Engine rules (D17):

- Pre meal: 2 g/kg for sessions over 90 min; 1 g/kg for 60 to 90 min at
  moderate or high intensity (M2 band); no pre meal otherwise. A session
  with a pre meal counts as hard for meal moving (section 4).
- The pre meal is the latest usual meal 90 min to 4 h before the start; it
  keeps its time and takes the T1 carbohydrate. With no such meal, a pre
  meal is added 3 h before the start if that is at or after wake time and
  not inside another session; otherwise there is none.
- Pre snack at 45 min before the start, 0.5 g/kg, when the session has a pre
  meal or a during slot and the last eating slot before the start is more
  than 3 h earlier (or there is none that day), and 45 min before the start
  is at or after wake time.

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

Output: total grams, grams per hour, and a schedule (every 20 to 30 min).

Engine rules (D18), for every sport:

| Duration           | Planned                                         |
|--------------------|-------------------------------------------------|
| under 45 min       | no during slot                                  |
| 45 to under 75 min | during slot, 0 g, small amounts or rinse optional |
| 75 to 150 min      | 30 to 60 g/h                                    |
| over 150 min       | 60 to 90 g/h                                    |

- The rate is the profile's carbohydrate point inside the range. For
  sessions over 150 min, `onBikeCarbTargetGPerH` replaces it when set; above
  90 g/h it warns (gut training), and it is capped at 120 g/h.
- Schedule: one feed every 20 min from minute 20 while time is left in the
  session, the total split equally.
- Above 60 g/h the slot is marked as needing glucose plus fructose.

### T3. Fluid and sodium during sessions

Default fluid 400 to 800 ml/h, adjusted by temperature if entered. Sodium
300 to 600 mg/h for sessions over 2 h or hot conditions. Individual sweat rate
varies widely; if the user enters a measured sweat rate
(`(mass_before - mass_after + fluid_drunk - urine) / hours`), use it and aim
to replace 60 to 80 % of it.

Engine rules (D19): fluid 600 ml/h for every session with a during slot;
sodium 450 mg/h for sessions over 2 h. Temperature and sweat rate are not
inputs yet.

### T4. Recovery

- Next hard session within 8 h: 1.0 to 1.2 g/kg/h carbohydrate for the first
  4 h, starting as soon as practical (ACSM 2016).
- Otherwise: normal meals cover glycogen restoration; place the next main meal
  within about 2 h.
- Protein 0.3 to 0.4 g/kg in the recovery slot (counts toward M1).

Engine rules (D20), for the main session only (most exercise energy, first
one on a tie) and only when it lasts 60 min or more:

- Fast mode, when a hard session (high band or key) starts within 8 h after
  the end, the same day or the next day: recovery slots at the end and at
  +1, +2 and +3 h, 1.1 g/kg carbohydrate each. A usual meal within 30 min of
  one of those times takes that slot's carbohydrate instead. The first
  recovery slot carries the recovery protein.
- Normal mode: the first usual meal within 2 h after the end is the recovery
  meal. If none, the next usual meal moves to 2 h after the end. If no meal
  follows the session that day, a recovery slot is added at the end.
- Fast-mode slots that fall after midnight stay in this day's plan; their
  time shows the next day's clock.
- A standalone recovery slot gets 0.35 g/kg protein. A meal acting as the
  recovery occasion takes the meal share of protein.

### T5. Carbohydrate loading

For a goal event over 90 min: 10 to 12 g/kg/day for the 36 to 48 h before.
Only when an event date is set. Reduce fibre on those days.

Engine rule (D21): for an event over 90 min, the two days before the event
date use 10 to 12 g/kg at the profile's carbohydrate point instead of the M2
load range, and every slot on those days is marked fibre-limited.

### T6. Time-restricted eating

Optional eating window (for example 12:00 to 20:00). Any slot with energy
(including protein shakes and zero-carb drinks with calories) counts as
eating. If a session falls outside the window and needs T1, T2 or T4 slots,
the engine flags the conflict and proposes moving the window or the session;
it does not drop fueling silently.

Engine rule (D21): every slot with energy outside the window (bounds
included) gets an `eating-window-conflict` warning. When a pre, pre-snack,
during or recovery slot is outside, the warning suggests a window of the
same length starting at the earliest of those slots if it covers all of
them (a during slot spans the whole session), otherwise moving the session.

## 4. Slot construction

Rule ID for this section: `S4`.

For each day:

1. Place sessions on the timeline.
2. Insert fixed slots: T1, T2, T4 per session.
3. Fill remaining day with regular meals at the usual meal times, moving a
   meal if it lands within 90 min before a hard session.
4. Assign protein per M1 across slots.
5. Assign carbohydrate: T1, T2, T4 first, the remainder spread across meals
   weighted toward the meal before and the meal after the main session.
6. Assign fat to regular meals, avoiding the pre-session and during slots.

Engine rules (D22):

- Meals: a usual meal inside a session moves to 30 min after its end. A
  usual meal less than 90 min before a hard session moves to 90 min before
  the start if that is at or after wake time and at least 2 h after the
  previous meal; otherwise it moves to 30 min after the session's end.
- Bedtime slot at 30 min before sleep when the gap from the day's last
  eating slot to the next day's first usual meal is over 10 h. Protein only.
- Protein: recovery and bedtime slots 0.35 g/kg each; the rest split equally
  across meals. Pre, pre-snack and during slots get none. Each protein slot
  shows the 0.3 to 0.4 g/kg range; a meal above it is allowed.
- Carbohydrate: pre, pre-snack, during and fast-recovery amounts first. The
  remainder goes to the other meals and to a standalone normal-mode recovery
  slot, by weight: 1.5 for the last of them before the main session and the
  first of them after it, 1.0 otherwise. A negative remainder gives those
  slots 0 and a `carb-over-target` warning; a remainder with no slot to
  take it gives a `carb-unassigned` warning.
- Fat: split equally across meals that are not the pre meal. Other slots get
  none; with no such meal, `fat-unassigned`.
- Pre meals and pre snacks are fibre-limited (M4).
- Skip breakfast (D49), a profile preference, off by default. With it on
  and at least two usual meals, the first usual meal by time is left out of
  the day unless a session that needs fueling starts before the second usual
  meal's time. A session needs fueling when it gets a pre meal (T1) or a
  during slot (T2). The day's energy and macro targets do not change; the
  remaining slots share them by the rules above. The bedtime gap still runs
  to the next day's first usual meal.

## 5. Meal guidance

Rule ID: `G1` (D40). Each slot gets one guidance key, chosen by its kind and
role. The key selects two lines of text in the i18n module: what kind of meal
to aim for, and one example. The guidance carries no amounts; the slot's
targets are the amounts. Examples avoid the user's known dislikes (fish,
olives).

Key selection, first match wins:

1. `during` slot with `mouthRinseOptional`: `during-rinse`.
2. `during` slot: `during`.
3. `pre-snack` slot: `pre-snack`.
4. `pre` slot: `pre`.
5. usual meal with role `pre`: `pre-meal`.
6. usual meal with role `recovery`: `recovery-meal`.
7. `recovery` slot in fast mode (T4): `recovery-fast`.
8. `recovery` slot: `recovery`.
9. `bedtime` slot: `bedtime`.
10. `snack` slot: `snack`.
11. any other meal: `meal`.

| Key           | Aim for                                                    | Example                                                      |
|---------------|------------------------------------------------------------|--------------------------------------------------------------|
| pre-meal      | Carb-based meal with some lean protein. Low fat, low fibre. | White rice with chicken, or porridge with banana and honey. |
| pre           | Carb-based and easy to digest. Low fat, low fibre.         | A bagel or white bread with jam, and a banana.               |
| pre-snack     | A small, quick carb snack.                                 | A banana, a few dates or a cereal bar.                       |
| during        | Carbs every 20 min, with fluid.                            | Drink mix, gels, bars or bananas.                            |
| during-rinse  | Water. Some sports drink or a carb mouth rinse is optional. | Water bottle, sports drink optional.                        |
| recovery-meal | A full meal with carbs and protein.                        | Pasta with chicken and vegetables.                           |
| recovery      | Carbs and protein soon after the session.                  | Greek yogurt with granola and fruit, or a protein shake with a banana. |
| recovery-fast | Quick carbs to refill before the next hard session.        | Rice cakes, bread with honey, fruit juice.                   |
| meal          | A balanced plate: carbs, protein, vegetables, some fat.    | By meal name, below.                                         |
| snack         | A small snack with carbs and protein.                      | Greek yogurt with fruit, or a fruit and a few almonds.       |
| bedtime       | Protein, little else.                                      | Greek yogurt or cottage cheese.                              |

`meal` examples by the usual meal name, compared in lower case:

| Name      | Example                                          |
|-----------|--------------------------------------------------|
| breakfast | Oats with Greek yogurt, nuts and fruit.          |
| lunch     | Chicken, quinoa and vegetable salad, with bread. |
| dinner    | Rice or pasta, chicken or tofu, and vegetables.  |
| other     | Rice or pasta, a protein, and vegetables.        |

Extra lines on the card:

- `during` with `needsMultipleTransportableCarbs`: "Use glucose plus
  fructose: a 2:1 drink mix or dual-source gels." (T2)
- Any slot with `fibreLimited` whose key is not `pre-meal` or `pre`: "Keep
  fibre low: white bread, white rice, peeled fruit." (M4, T5)

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
