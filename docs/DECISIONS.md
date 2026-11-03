# Decisions

## Decided

- D1. Local-first, no backend in v1. Backup by JSON export.
- D2. Rule-based planning from published ranges, no machine learning.
- D3. Engine is pure TypeScript, separate from UI and storage.
- D4. Metric units, kcal, Europe/Paris default time zone.
- D5. Suggestions come only from the user's foods and templates.
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

## Open questions (defaults in brackets)

- Q1. UI language for v1? [English, i18n-ready]
- Q3. Body mass source: manual entry only, or also import from a scale app
      export? [manual]
- Q4. Should homemade ride drink be one food with a fixed recipe, or a
      template built from sugar, maltodextrin, fructose and salt? [template,
      so the glucose:fructose ratio and sodium are computed]
- Q5. Default carbohydrate point inside M2 ranges? [midpoint]
- Q6. Show a time-restricted eating window by default? [off]
- Q7. CIQUAL licence terms for bundling: to verify at M5.
- Q9. Profile values still marked TODO in `seed/profile.json` (sex, body
      mass, FTP, wake, sleep and meal times) and session start times and
      durations in `seed/week-template.json`. [engine tests use labelled
      test values until these are filled]
