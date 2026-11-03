# Architecture

## Layout

```
src/
  engine/          pure planning logic, no IO
    constants.ts   every coefficient, with DOMAIN rule ID and source
    energy.ts      E1 to E7
    macros.ts      M1 to M4
    timing.ts      T1 to T6, slot construction
    portions.ts    portion solver
    plan.ts        planDay(inputs) and planWeek(inputs)
    trace.ts
  model/           Zod schemas and inferred types
  db/              Dexie database, migrations, repositories
  data/            bundled food subset (CIQUAL), seed loader
  features/        one folder per screen: today, week, sessions, foods, templates, profile, settings
  ui/              shared components
  i18n/
  pwa/             service worker registration, update prompt
tests/
  engine/          Vitest, hand-computed fixtures
  e2e/             Playwright
```

The UI calls `planDay` with plain objects read from Dexie and stores the
result keyed by `date` and `inputsHash`. The engine never reads storage.

## PWA

- `vite-plugin-pwa` with `registerType: 'prompt'`: show an "update available"
  banner instead of reloading silently.
- Precache the app shell and the bundled food data. Runtime caching
  (stale-while-revalidate) only for Open Food Facts product images, capped.
- Manifest: standalone display, maskable icons, theme colour, start URL
  `/today`.
- Call `navigator.storage.persist()` on first launch and show the result in
  Settings. Safari can evict storage for sites not added to the home screen;
  the export button and a "last export" date in Settings are the backup.
- Test offline with `pnpm preview`, not `pnpm dev`.

## Food data

- CIQUAL (ANSES French food composition table): bundle a curated subset as a
  static JSON at build time (raw foods, common staples), with a script in
  `scripts/` that converts the official download. Check the licence terms of
  the current release before bundling and record them in DECISIONS.md.
- Open Food Facts: search and barcode lookup on user action, over HTTPS, with
  a user-agent string identifying the app as their API asks. Results are
  copied into the local Food table; the app never depends on OFF at plan time.
- Manual foods: always possible, and the default for homemade drink mixes.

Barcode scanning (later milestone): `BarcodeDetector` where available,
otherwise `@zxing/browser`. Check current Safari support at implementation
time rather than assuming.

## Hosting

Static build. Any static host works (GitHub Pages, Cloudflare Pages, or a
local server). HTTPS is required for the service worker outside localhost.

## Testing

- Engine: Vitest, table-driven, one fixture per DOMAIN rule, plus three
  full-day fixtures (rest day, Monday intervals run, Sunday long ride).
- Property tests (fast-check, optional) for the portion solver: results stay
  within bounds and steps.
- E2E: create profile, apply week template, open Sunday, see during-ride
  schedule, go offline, reload, same plan visible.
