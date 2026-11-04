// English UI strings. Every user-visible string goes through `t()` so a
// French dictionary with the same keys can be added later. `{name}` marks a
// value filled in by `t(key, values)`.
export const en = {
  'app.name': 'Fuel Planner',
  'tabs.label': 'Main',
  'update.available': 'A new version is available.',
  'update.reload': 'Reload',
  'update.dismiss': 'Later',

  'common.save': 'Save',
  'common.saved': 'Saved.',
  'common.back': 'Back',
  'common.next': 'Next',
  'common.cancel': 'Cancel',
  'common.remove': 'Remove',
  'common.add': 'Add',
  'common.optional': 'optional',
  'form.check': 'Check this value.',
  'form.required': 'Required.',
  'form.range': 'Allowed range: {min} to {max}.',
  'form.fixErrors': 'Fix the highlighted fields to continue.',

  'notice.title': 'Not medical advice',
  'notice.body':
    'Fuel Planner gives general sports-nutrition estimates from published guidelines for healthy adults. It is not medical advice. If you have a medical condition, an eating disorder, or are pregnant, talk to a doctor or registered dietitian before changing how you eat.',

  'profile.title': 'Profile',
  'profile.sex': 'Sex',
  'profile.sex.choose': 'Choose',
  'profile.sex.male': 'Male',
  'profile.sex.female': 'Female',
  'profile.birthYear': 'Birth year',
  'profile.heightCm': 'Height (cm)',
  'profile.massKg': 'Body mass (kg)',
  'profile.massFromEntries':
    'Body mass: {mass} kg, from your latest body mass entry.',
  'profile.bodyFatPct': 'Body fat (%)',
  'profile.bodyFatHint':
    'When set, resting energy uses Katch-McArdle instead of Mifflin-St Jeor.',
  'profile.ftpW': 'FTP (W)',
  'profile.ftpHint': 'Needed to estimate ride energy from zones.',
  'profile.timeZone': 'Time zone',
  'profile.wakeTime': 'Wake time',
  'profile.sleepTime': 'Sleep time',
  'profile.meals': 'Usual meals',
  'profile.mealName': 'Meal name',
  'profile.mealTime': 'Time',
  'profile.addMeal': 'Add meal',
  'profile.mealsRequired': 'Add at least one meal.',

  'goal.title': 'Goal',
  'goal.kind': 'Goal',
  'goal.maintain': 'Maintain',
  'goal.lose': 'Lose weight',
  'goal.gain': 'Gain weight',
  'goal.rate': 'Rate (kg per week)',
  'goal.rateCap':
    'The plan caps the rate at 0.5 % of body mass per week: {cap} kg for {mass} kg.',
  'goal.gainKcal': 'Daily surplus (kcal)',
  'goal.gainHint': 'Default 250 kcal.',
  'goal.proteinNote':
    'Protein switches between 1.8 and 2.0 g/kg when the goal changes to or from losing weight, unless you set another value.',
  'goal.event': 'Goal event',
  'goal.eventName': 'Event name',
  'goal.eventDate': 'Event date',
  'goal.eventDuration': 'Expected duration (min)',
  'goal.eventHint':
    'Events over 90 min add carbohydrate loading on the two days before.',

  'bodyMass.title': 'Body mass',
  'bodyMass.date': 'Date',
  'bodyMass.massKg': 'Mass (kg)',
  'bodyMass.bodyFatPct': 'Body fat (%)',
  'bodyMass.bodyFatHint':
    'Kept as history. Set body fat in the profile to use it in plans.',
  'bodyMass.add': 'Add entry',
  'bodyMass.empty': 'No entries yet.',
  'bodyMass.trend': 'Body mass trend, {min} to {max} kg',
  'bodyMass.entries': 'Entries',

  'coefficients.title': 'Coefficients',
  'coefficients.nea': 'Non-exercise activity factor',
  'coefficients.neaHint':
    '1.2 desk work, little walking; 1.5 on your feet most of the day.',
  'coefficients.efficiency': 'Cycling gross efficiency',
  'coefficients.protein': 'Protein (g/kg/day)',
  'coefficients.carbPoint': 'Carbohydrate point in range',
  'coefficients.carbPointHint':
    '0 uses the lower bound of each range, 1 the upper bound, 0.5 the midpoint.',
  'coefficients.onBike': 'On-bike carbohydrate for rides over 2.5 h (g/h)',
  'coefficients.onBikeHint':
    'Leave empty to use the carbohydrate point in the 60 to 90 g/h range. Above 90 g/h needs gut training; the maximum is 120 g/h.',

  'window.title': 'Eating window',
  'window.enabled': 'Use a time-restricted eating window',
  'window.start': 'Start',
  'window.end': 'End',
  'window.hint': 'Slots outside the window are flagged, never dropped.',

  'data.title': 'Data',
  'data.export': 'Export data',
  'data.exportHint': 'Downloads every table as one JSON file.',
  'data.lastExport': 'Last export: {date}.',
  'data.neverExported': 'Not exported yet on this device.',
  'data.import': 'Import a backup',
  'data.importHint': 'Replaces all data on this device after you confirm.',
  'data.importSummary':
    'This file has {profile} profile, {goals} goals, {bodyMass} body mass entries, and {sessions} activities. Import it and replace all data on this device?',
  'data.importConfirm': 'Replace my data',
  'data.importDone': 'Backup imported.',
  'data.import.not-json': 'This file is not JSON.',
  'data.import.not-fuel-planner': 'This file is not a Fuel Planner export.',
  'data.import.newer-version':
    'This file comes from a newer version of the app (schema {detail}). Update the app first.',
  'data.import.invalid': 'This file has invalid data and was not imported.',
  'data.storage': 'Storage',
  'data.storage.persisted': 'This device keeps the data persistently.',
  'data.storage.not-persisted':
    'The browser may clear this data when space is low. Export regularly; adding the app to the home screen helps on iPhone.',
  'data.storage.unsupported':
    'This browser does not report storage persistence.',

  'settings.about': 'About',
  'settings.version': 'Version {version}',
  'settings.checkUpdate': 'Check for update',
  'settings.updateChecked': 'Checked for updates.',
  'settings.updateUnavailable':
    'Updates are checked only in the installed or deployed app.',

  'firstRun.title': 'Welcome',
  'firstRun.intro':
    'Set up your profile and goal. Everything stays on this device.',
  'firstRun.step': 'Step {step} of {total}',
  'firstRun.start': 'Start planning',
  'firstRun.restore': 'Restore from a backup instead',

  'sport.ride': 'Ride',
  'sport.run': 'Run',
  'sport.strength': 'Strength',
  'sport.pilates': 'Pilates',
  'sport.walk': 'Walk',
  'sport.other': 'Other',
  'zone.Z1': 'Z1 recovery',
  'zone.Z2': 'Z2 endurance',
  'zone.Z3': 'Z3 tempo',
  'zone.SS': 'Sweet spot',
  'zone.Z4': 'Z4 threshold',
  'zone.Z5': 'Z5 VO2max',
  'mode.zone': 'Zone',
  'mode.kj': 'Planned work (kJ)',
  'mode.pace': 'Expected pace',
  'mode.distance': 'Distance',
  'mode.met': 'MET value',
  'mode.effort': 'Effort',

  'session.sport': 'Sport',
  'session.start': 'Start',
  'session.duration': 'Duration (min)',
  'session.key': 'Key session (no deficit that day)',
  'session.zone': 'Zone',
  'session.kj': 'Planned work (kJ)',
  'session.pace': 'Expected pace (min:sec per km)',
  'session.paceHint': 'For example 5:00.',
  'session.distance': 'Distance (km)',
  'session.distanceHint': 'The pace is worked out from duration and distance.',
  'session.met': 'MET value',
  'session.compendiumCode': 'Compendium code',
  'session.metHint': 'From the 2024 Adult Compendium of Physical Activities.',
  'session.summary.minutes': '{minutes} min',

  'preview.title': 'Estimated energy',
  'preview.kcal': 'About {kcal} kcal',
  'preview.power': 'From power: {kj} kJ of work.',
  'preview.met': 'From MET {met}{code}.',
  'preview.distance': 'From distance: {km} km.',
  'preview.incomplete': 'Fill in the activity to see an estimate.',
  'warning.ride-no-power':
    'No FTP or planned kJ: estimated from effort without power data.',
  'warning.run-needs-pace': 'Add a pace or distance to estimate this run.',
  'warning.session-needs-met': 'Add a MET value to estimate this session.',

  'trace.title': 'How this number is calculated',

  'warning.low-energy-availability':
    'Energy availability {kcalPerKgFfm} kcal/kg fat-free mass is under 30. Consider eating more on this day.',
  'warning.over-target':
    'The fat floor puts this day {overKcal} kcal over its energy target.',
  'warning.lose-rate-capped':
    'Weight loss rate capped at {capKgPerWeek} kg per week.',
  'warning.carb-over-target':
    'Fixed fueling slots exceed the day carbohydrate by {overG} g.',
  'warning.carb-unassigned':
    '{unassignedG} g carbohydrate has no meal to go to.',
  'warning.protein-unassigned': '{unassignedG} g protein has no meal to go to.',
  'warning.fat-unassigned': '{unassignedG} g fat has no meal to go to.',
  'warning.during-rate-above-90': 'Above 90 g/h needs gut training.',
  'warning.during-rate-capped':
    'On-bike carbohydrate capped at {capGPerH} g/h.',
  'warning.eating-window-conflict': 'Outside your eating window.',
  'warning.eating-window-suggest-window':
    'A window from {start} to {end} would include all fueling.',
  'warning.eating-window-suggest-move-session':
    'No window of the same length includes all fueling; consider moving the session.',

  'nav.profile': 'Profile',
  'install.title': 'Install on iPhone',
  'install.body':
    'In Safari, tap Share, then Add to Home Screen. The app then works offline.',

  'day.which': 'Plan for',
  'day.today': 'Today',
  'day.tomorrow': 'Tomorrow',
  'day.activities': 'Activities',
  'day.rest': 'Rest day',
  'day.addActivity': 'Add activity',
  'day.totals': 'Day targets',
  'day.kcal': 'kcal',
  'day.carb': 'Carbs',
  'day.protein': 'Protein',
  'day.fat': 'Fat',
  'day.grams': '{grams} g',
  'day.meals': 'Meals',
  'day.carbLoading': 'Carbohydrate loading day',
  'day.mealMacros': 'C {carb} g · P {protein} g · F {fat} g',
  'day.mealKcal': '{kcal} kcal',
  'day.editActivity': 'Edit {name}',
  'day.deleteActivity': 'Delete {name}',
  'day.activityKcal': 'about {kcal} kcal',

  'meal.pre': 'Pre-workout',
  'meal.pre-snack': 'Pre-workout snack',
  'meal.during': 'During',
  'meal.recovery': 'Post-workout',
  'meal.snack': 'Snack',
  'meal.bedtime': 'Before bed',
  'meal.meal': 'Meal',
  'meal.role.pre': 'Pre-workout',
  'meal.role.recovery': 'Post-workout',

  'during.rate': '{rate} g carbs per hour, {total} g in total',
  'during.feeds': '{carb} g every 20 min',
  'during.fluid': 'Fluid {perHour} ml per hour, {ml} ml in total',
  'during.sodium': 'Sodium {perHour} mg per hour, {mg} mg in total',
  'during.glucoseFructose':
    'Use glucose plus fructose: a 2:1 drink mix or dual-source gels.',
  'guidance.lowFibre': 'Keep fibre low: white bread, white rice, peeled fruit.',

  'guidance.aim.pre-meal':
    'Carb-based meal with some lean protein. Low fat, low fibre.',
  'guidance.aim.pre': 'Carb-based and easy to digest. Low fat, low fibre.',
  'guidance.aim.pre-snack': 'A small, quick carb snack.',
  'guidance.aim.during': 'Carbs every 20 min, with fluid.',
  'guidance.aim.during-rinse':
    'Water. Some sports drink or a carb mouth rinse is optional.',
  'guidance.aim.recovery-meal': 'A full meal with carbs and protein.',
  'guidance.aim.recovery': 'Carbs and protein soon after the session.',
  'guidance.aim.recovery-fast':
    'Quick carbs to refill before the next hard session.',
  'guidance.aim.meal':
    'A balanced plate: carbs, protein, vegetables, some fat.',
  'guidance.aim.snack': 'A small snack with carbs and protein.',
  'guidance.aim.bedtime': 'Protein, little else.',
  'guidance.example.pre-meal':
    'White rice with chicken, or porridge with banana and honey.',
  'guidance.example.pre': 'A bagel or white bread with jam, and a banana.',
  'guidance.example.pre-snack': 'A banana, a few dates or a cereal bar.',
  'guidance.example.during': 'Drink mix, gels, bars or bananas.',
  'guidance.example.during-rinse': 'Water bottle, sports drink optional.',
  'guidance.example.recovery-meal': 'Pasta with chicken and vegetables.',
  'guidance.example.recovery':
    'Greek yogurt with granola and fruit, or a protein shake with a banana.',
  'guidance.example.recovery-fast':
    'Rice cakes, bread with honey, fruit juice.',
  'guidance.example.snack':
    'Greek yogurt with fruit, or a fruit and a few almonds.',
  'guidance.example.bedtime': 'Greek yogurt or cottage cheese.',
  'guidance.example.meal.breakfast': 'Oats with Greek yogurt, nuts and fruit.',
  'guidance.example.meal.lunch':
    'Chicken, quinoa and vegetable salad, with bread.',
  'guidance.example.meal.dinner':
    'Rice or pasta, chicken or tofu, and vegetables.',
  'guidance.example.meal.other': 'Rice or pasta, a protein, and vegetables.',
  'guidance.exampleLabel': 'For example: {example}',

  'detail.close': 'Close',
  'detail.why': 'How this is calculated',
  'detail.range': 'Range {low} to {high} g',
  'detail.target': 'Target {value} g',
  'detail.everyDay': 'Applies to every day.',
  'detail.restDay': 'Rest days use the lower end of the range.',
  'detail.carbPoint': 'Point in the carbohydrate range',
  'detail.proteinPerKg': 'Protein (g/kg/day)',
  'detail.kcalParts':
    'Resting {bmr} + daily life {base} + exercise {exercise} + goal {goal} kcal',
  'detail.fatRemainder':
    'Fat is what remains of the kcal target after carbs and protein, with a floor.',

  'activity.new': 'Add activity',
  'activity.edit': 'Edit activity',
  'activity.save': 'Save activity',
  'activity.delete': 'Delete activity',
  'activity.duration': 'Duration',
  'activity.custom': 'Other (min)',
  'activity.minutes': '{minutes} min',
  'activity.intensity': 'Intensity',
  'activity.more': 'More options',
  'activity.less': 'Fewer options',
  'activity.keyHint':
    'A key session removes the weight-loss deficit that day and can trigger fast recovery.',
  'effort.easy': 'Easy',
  'effort.moderate': 'Moderate',
  'effort.hard': 'Hard',
} as const;

export type MessageKey = keyof typeof en;
