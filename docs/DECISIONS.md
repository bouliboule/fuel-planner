# Decisions

## Decided

- D1. Local-first, no backend in v1. Backup by JSON export.
- D2. Rule-based planning from published ranges, no machine learning.
- D3. Engine is pure TypeScript, separate from UI and storage.
- D4. Metric units, kcal, Europe/Paris default time zone.
- D5. Suggestions come only from the user's foods and templates.

## Open questions (defaults in brackets)

- Q1. UI language for v1? [English, i18n-ready]
- Q2. Hosting: GitHub Pages, Cloudflare Pages, or local only? [decide at M0]
- Q3. Body mass source: manual entry only, or also import from a scale app
      export? [manual]
- Q4. Should homemade ride drink be one food with a fixed recipe, or a
      template built from sugar, maltodextrin, fructose and salt? [template,
      so the glucose:fructose ratio and sodium are computed]
- Q5. Default carbohydrate point inside M2 ranges? [midpoint]
- Q6. Show a time-restricted eating window by default? [off]
- Q7. CIQUAL licence terms for bundling: to verify at M5.
- Q8. MET values for Pilates and circuit training: to confirm against the
      2024 compendium at M1 and record the codes here.
