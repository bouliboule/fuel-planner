# Decisions

## Decided

- D1. Local-first, no backend in v1. Backup by JSON export.
- D2. Rule-based planning from published ranges, no machine learning.
- D3. Engine is pure TypeScript, separate from UI and storage.
- D4. Metric units, kcal, Europe/Paris default time zone.
- D5. Suggestions come only from the user's foods and templates.
      Superseded by D39.
- D6. Hosting on GitHub Pages as a project site, deployed by GitHub Actions
      (resolves Q2). The origin and base path are fixed from the first
      install, because iOS ties the installed app and its IndexedDB data to
      the exact origin. Pages on a free plan needs a public repository; user
      data never leaves the device, so only the code is public.
- D7. Tooling dependencies approved at M0: ESLint with typescript-eslint,
      eslint-plugin-react-hooks and eslint-plugin-react-refresh, Prettier,
      @vitejs/plugin-react, @tailwindcss/vite, workbox-window,
      @playwright/test. TypeScript stays on 6.0 because typescript-eslint
      does not support 7 yet.
- D8. The full check script is `pnpm check`, not `pnpm ci`: `ci` is a pnpm
      built-in command name.
- D9. Lighthouse 12 removed the PWA audits. Installability is checked by a
      Playwright test on the manifest, icons and apple-touch-icon, offline
      by a Playwright test with the network off (Chromium only, where
      Playwright supports service workers), and on iPhone by hand.

- D10. Runs are entered as duration and expected pace (min/km). Energy uses
      the E4 distance rule on `duration / pace`; a measured distance
      replaces the estimate. Intensity band comes from the compendium
      running code for that speed (DOMAIN M2).
- D11. Day load classification thresholds and session intensity bands as in
      DOMAIN M2 (resolves the gaps and overlaps of the published table).
- D12. MET defaults from the 2024 Compendium: Pilates 02105 at 2.8 (not
      3.0), body weight strength 02056 at 3.0. Rides without power data use
      cycling codes 01015, 01016, 01017 by effort, with a warning. Walk and
      other sports need an explicit MET. Resolves Q8.
- D13. Age is the plan year minus the birth year. Birth year 1989 (age 37 in
      2026).
- D14. The engine uses the profile protein g/kg as is; the 2.0 g/kg default
      for a lose goal is applied by the settings screen.
- D15. The E6 deficit applies exactly when the day has no key session and
      150 min of training or less. Rest days use the lower bound of the light
      carbohydrate range.
- D16. The engine returns unrounded numbers; the UI rounds for display.
      Warnings carry a code and values, and the UI writes the text through
      i18n. E7 intake is the planned day total, including any M3 excess.
- D17. Pre-session rules: pre meal amounts, which usual meal becomes the pre
      meal, when one is added, and the pre snack (DOMAIN T1).
- D18. During-session bands, rate point, the user override above 90 g/h up
      to 120 g/h, and a 20 min feed schedule (DOMAIN T2).
- D19. Fluid 600 ml/h and sodium 450 mg/h, midpoints, until temperature and
      sweat rate are inputs (DOMAIN T3).
- D20. Recovery only for the main session of 60 min or more; fast mode at
      1.1 g/kg/h for 4 h when a hard session follows within 8 h; normal mode
      uses or moves a meal (DOMAIN T4).
- D21. Carbohydrate loading on the two days before an event over 90 min;
      eating-window conflicts with a suggested window (DOMAIN T5, T6).
- D22. Meal moving, bedtime slot, and the protein, carbohydrate (1.5
      weights) and fat split (DOMAIN section 4).
- D23. Dexie schema v1 creates every table in DATA_MODEL, including those
      used from M4 on, so the first schema change is a real migration.
      `fake-indexeddb` (dev only) runs storage tests in Vitest.
- D24. Ids are UUID v7 from a small generator in `src/model/id.ts`.
- D25. Profile mass follows the latest body mass entry by date. Body fat on
      an entry is history only; the profile body fat is set on purpose,
      since it switches E1 to Katch-McArdle.
- D26. First run: profile (prefilled from `seed/profile.json`, TODO values
      required), goal, not-medical-advice notice, then Today. The week
      template step comes with M4; seed foods load in M5 because their
      nutrition values are empty on purpose.
- D27. Coefficient inputs accept only their DOMAIN ranges. Changing the goal
      to or from lose switches protein between 1.8 and 2.0 g/kg unless the
      user set another value. Import validates, summarises and replaces all
      data after confirmation; no merge.
- D28. Session intensity inputs by sport: ride zone, kJ or RPE; run pace
      or distance (a distance stores the implied pace, duration / distance);
      Pilates and strength RPE for the band, or an explicit MET; walk and
      other a MET. The editor shows the E3/E4 estimate live.
- D29. Week templates: applying one replaces every session of that week
      after confirmation. The seed week imports Saturday as a normal
      session; the morning circuit becomes one 15 min strength session per
      chosen weekday. First run offers the seed week with TODO values to
      fill, or skipping. Superseded by D39.
- D30. The Week view runs Monday to Sunday in the profile time zone and
      shows each day's energy target (kcal, whole number) and carbohydrate
      (g/kg, one decimal). Dates before the first goal use the earliest
      goal. Overlapping sessions are allowed. Superseded by D39.
- D31. CIQUAL 2025 (released 2025-11-19, Etalab 2.0, credited in Settings)
      is the bundled table. Energy uses the EU 1169/2011 kcal column and
      protein the N x Jones factor column. "traces" and "< x" are stored as
      0 and listed in `belowDetection`; a missing required macro leaves the
      food out; missing optional values stay empty. Resolves Q7.
      Superseded by D39.
- D32. Portion objective in kcal units relative to the slot kcal, weight 1
      per term; zero-target tolerance as 10 % of slot kcal (DOMAIN S5).
      Superseded by D39.
- D33. Slot candidate tags, meal template priority and the 1 to 4 food
      search from at most 12 candidates (DOMAIN S5). Imported foods open in
      the editor with portion 0 to 300 g, step 5 g, default 100 g, marked to
      check before saving. Superseded by D39.
- D34. Swaps persist per date and slot as `foodChoices` in the plans table;
      plans are recomputed, not cached. "Why" shows trace steps for header
      numbers, slots and sessions. Superseded by D39.
- D35. Open Food Facts requests send the browser's own User-Agent (a custom
      one cannot be set from a web page), only on submit. Superseded by D39.
- D36. Packing list: on-bike picks with total grams and unit counts; no
      bottle grouping. Shopping list: optional `shopSection` and
      `purchaseUnit` on foods, rounding up to whole units. Superseded by D39.
- D37. The homemade ride drink is one manual food in M5 (ARCHITECTURE);
      a proportional template stays open as Q4. Superseded by D39.
- D38. Logging: ticking a planned food logs its planned grams at the
      slot's time with the slot id (new optional `slotId` on LogEntry, no
      schema version change); the grams are editable and unticking deletes
      the entry. Logged foods stay when the plan changes and show as
      "logged, not planned". Unplanned items need a food from the list, with
      grams, a time and an optional slot. Today shows target, eaten and
      difference (eaten - target) for kcal, C, P and F, and each slot shows
      what was eaten. Entries of deleted foods are not counted and flagged.
      Superseded by D39.
- D39. Scope cut to one day at a time (2026-11-04). The user logs food in a
      separate tracking app, so foods, CIQUAL, Open Food Facts, portions,
      shopping and packing lists, logging, the week view and week templates
      are removed (ROADMAP M7). The profile, goal, body mass and the engine
      rules E, M, T and S4 stay. The app makes no runtime network calls.
- D40. Each meal card shows guidance chosen by slot kind and role, with a
      one-line example meal (DOMAIN G1). The text has no amounts and lives
      in the i18n module; the user can edit it.
- D41. Targets show as single numbers. Tapping one shows its range, the
      trace and, for carbohydrate and protein, a slider that moves the
      profile point for every day. No per-day override.
- D42. A day with no activity is a rest day and gets a full plan from the
      same screen.
- D43. Removed features are deleted, not hidden. Dexie schema v2 drops the
      food, template, plan and log tables and the profile dislike fields.
      Import reads v1 files and keeps their profile, goals, body mass and
      sessions.
- D44. Pilates and strength take an effort (easy, moderate, hard) that maps
      straight to the M2 low, moderate and high bands; energy uses the E4
      default MET. Rides use zones (kJ optional), runs pace (distance
      optional), walk and other a MET. Existing `rpe` and `if` sessions stay
      valid. The `indoor` field is dropped: no rule uses it.
- D45. The Day screen offers today and tomorrow, defaulting to tomorrow
      after the last usual meal time of today. Sessions are still stored by
      date, so a plan sees the next day's sessions when they were entered,
      which T4 fast recovery needs; otherwise fast recovery only reacts to
      same-day sessions.

- D46. Kcal and fat have no source range: their detail sheet shows how
      the number is built (resting, daily life, exercise and goal for kcal;
      the M3 remainder for fat), without a slider. Carbohydrate and protein
      show their range in grams and a slider for the profile point. On a
      rest day the carbohydrate slider is hidden, since rest days use the
      lower bound (D15).
- D47. Sessions stored from week templates before M7 stay and show on
      their dates as normal activities.
- D48. The profile sub-screens (profile, goal, body mass, coefficients,
      eating window, data) stay as they were, under `/profile`. Profile
      shows the iPhone install steps when the app is not running
      standalone. The activity editor deletes an activity; the Day screen
      has no swipe gesture.

- D49. Skip breakfast is a profile preference. Breakfast is the first usual
      meal by time; the morning ends at the second usual meal's time; a
      session needs fueling when it has a pre meal (T1) or a during slot
      (T2), which also covers every pre snack and recovery case. Breakfast's
      share is not removed from the day: the other meals take it through the
      S4 split, so protein per meal can exceed 0.3 to 0.4 g/kg, which S4
      already allows. With fewer than two usual meals nothing is skipped.
- D50. The bedtime gap (S4) keeps using the next day's first usual meal
      even when the next day may skip it: the engine does not know the next
      day's full sessions, and the user's usual 19:30 dinner already gives a
      gap over 10 h.
- D51. lucide-react (ISC) is approved for icons. Icons are decorative and
      marked `aria-hidden`; every control keeps its text label.

- D52. Hard, for the back-to-back check only (no effect on energy or
      macros): a ride is hard when its M2 band is high (sweet spot, Z4, Z5,
      or the same from IF or kJ) or it is a key session; a run is hard when
      its run type is intervals or hard long. Run type is a new optional
      field the user picks (easy by default), because every run from
      6.44 km/h is already high in M2 and pace alone cannot tell an easy run
      from intervals. No duration or pace threshold is used.
- D53. Back-to-back: two profile preferences, "allow back-to-back hard
      rides" and "allow back-to-back hard runs", off by default. When off,
      a hard ride (or run) on the day before or the day after another hard
      ride (or run) gets a warning in the editor and on its card. Rides and
      runs are checked separately. It never blocks saving.
- D54. Tracking is the stored activities themselves: no done or skipped
      status. The calendar opens any date on the Day screen, so a past day
      can be corrected and a future day planned.
- D55. Meal size. Meals are not equal shares: each usual meal has an
      optional kcal range in the profile, user-set. Defaults, from the
      user: breakfast 500 to 600, lunch 800 to 1200, dinner 400 to 600
      kcal, matched by name on first run and by the version 3 migration.
      The ranges act as ratios (midpoints 550, 1000, 500), so meals still
      add up to the day target on any day; a meal outside its range gets
      a warning. Carbohydrate and fat follow the ratio; protein stays
      equal across meals (M1). The S4 1.5 weight around the main session
      still applies on top (Q9).
- D56. Theme: System (default), Light or Dark, chosen under Appearance on
      the Profile screen. It is a per-device setting in localStorage, not a
      profile field and not exported, so index.html can apply it before
      first paint without a flash. System follows prefers-color-scheme live.
- D57. Visual style: neubrutalism (neobrutalism.com). Flat saturated
      colours, a 2px black outline and a hard 4px offset black shadow on
      raised surfaces, 6px corners, heavy type, no gradients. Pressable boxes
      drop onto their shadow when pressed. Colours are tokens in
      src/index.css (page, surface, sunken, ink, ink-muted, edge, main,
      danger, warn-ink) that swap for dark mode; outlines and shadows stay
      black in both. System fonts only, since the app makes no runtime
      network calls.

## Open questions (defaults in brackets)

- Q1. UI language for v1? [English, i18n-ready]
- Q3. Body mass source: manual entry only, or also import from a scale app
      export? [manual]
- Q5. Default carbohydrate point inside M2 ranges? [midpoint]
- Q6. Show a time-restricted eating window by default? [off]
- Q9. Source for the S4 1.5 carbohydrate weight on the meals around the
      main session, and whether it should scale with session length or
      carbohydrate need. [1.5, flat]
