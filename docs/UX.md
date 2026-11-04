# UX

Mobile first (iPhone width), usable on desktop. One screen does the job.
Large text and tap targets (at least 48 px high), one column, no tables, dark
mode following the system.

## Navigation

No tab bar. The Day screen is the home screen. A profile button in its header
opens Profile; Profile has a back button.

## Day

Top to bottom:

1. **Day switch.** Two large buttons: Today, Tomorrow. The default is Today,
   or Tomorrow once the last usual meal time of today has passed.
2. **Activities.** One card per activity: sport, start time, duration,
   intensity, and its kcal estimate. Tap to edit or delete.
   A large "Add activity" button below. With no activity the section reads
   "Rest day".
3. **Day totals.** The kcal target in large type, then carbohydrate, protein
   and fat in grams on one row.
4. **Meals.** One card per slot of the plan, in time order. Each card shows:
   - time and name (Breakfast, Pre-workout, Lunch, Post-workout, Snack,
     Dinner, Before bed, or the usual meal name with a Pre-workout or
     Post-workout tag when a usual meal takes that role);
   - kcal in large type, then C / P / F grams;
   - the meal guidance line and the example line (DOMAIN G1);
   - for the during-session card instead: carbohydrate per hour and total,
     the feed rhythm as one line ("25 g every 20 min"), fluid per hour,
     sodium per hour when set, and "glucose + fructose" when required.
5. **Warnings.** One plain sentence on the card it concerns (low energy
   availability on the totals, eating-window conflict on the meal).

The plan recomputes as soon as an activity changes. No save or plan button.

## Number detail

Tapping any target opens a bottom sheet:

- the range it comes from and where the target sits in it;
- for carbohydrate and protein, a slider that moves the profile point inside
  the range, labelled "applies to every day";
- the trace: rule ID, formula, inputs, result.

## Activity editor

A bottom sheet, one decision per row:

- Sport: large buttons for Ride, Run, Strength, Pilates, Walk, Other.
- Start time.
- Duration: chips for 30, 45, 60, 90, 120, 180, 240 min, and a custom field.
- Intensity, by sport:
  - Ride: zone buttons Z1, Z2, Z3, Sweet spot, Z4, Z5. "Planned kJ" under a
    "More" link.
  - Run: expected pace (min/km). "Distance" under "More".
  - Strength, Pilates: Easy, Moderate, Hard (D44).
  - Walk, Other: MET value, with the hint that it comes from the compendium.
- Key session toggle, with a one-line explanation.
- A live line with the activity's kcal estimate.

## Profile

Profile, goal, body mass entries with a small trend chart, coefficients each
showing the allowed range, on-bike carbohydrate rate, eating window,
export/import, storage persistence status, app version and update check,
install steps on iPhone, the not-medical-advice notice.

## First run

Profile, goal, the not-medical-advice notice, then the Day screen.
