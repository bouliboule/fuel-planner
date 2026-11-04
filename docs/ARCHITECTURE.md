# Architecture

## Layout

```
src/
  engine/          pure planning logic, no IO
    constants.ts   every coefficient, with DOMAIN rule ID and source
    types.ts       engine input and output types
    zones.ts       IF to zone mapping (E3)
    energy.ts      E1 to E7
    load.ts        session intensity bands and day load (M2)
    macros.ts      M1 to M4
    time.ts        HH:mm to minutes of the day
    timing.ts      T1 to T6
    slots.ts       slot construction and macro split (section 4)
    portions.ts    portion solver
    plan.ts        planDayTargets, then planDay(inputs) and planWeek(inputs)
    trace.ts
  model/           Zod schemas and inferred types
  db/              Dexie database, migrations, repositories
  data/            bundled food subset (CIQUAL), seed loader
  features/        one folder per screen: onboarding, today, week, sessions, foods, templates, profile, settings
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
- Manifest: standalone display, maskable icons, theme colour. `start_url`
  and `scope` are the base path (see Hosting); the router redirects the base
  path to `today`. `index.html` also links a 180x180 PNG `apple-touch-icon`,
  because iOS ignores maskable manifest icons for the home screen.
- Call `navigator.storage.persist()` on first launch and show the result in
  Settings. Safari can evict storage for sites not added to the home screen;
  the export button and a "last export" date in Settings are the backup.
- Test offline with `pnpm preview`, not `pnpm dev`.

## Food data

- CIQUAL 2025 (ANSES, Licence Ouverte Etalab 2.0, D31): `scripts/ciqual-convert.mjs`
  converts the official XML download (kept in the git-ignored `data-src/`)
  into `src/data/ciqual.json`, committed. All groups except mixed dishes and
  baby food; foods missing energy, carbohydrate, protein or fat are left out.
- Open Food Facts (ODbL): search on user action, over HTTPS. Browsers cannot
  set the User-Agent header their API asks for, so requests carry the
  browser's own; searches run only on submit, under their 10 per minute
  limit (D35). Results are copied into the local Food table; the app never
  depends on OFF at plan time.
- Manual foods: always possible, and the default for homemade drink mixes.

Barcode scanning (later milestone): `BarcodeDetector` where available,
otherwise `@zxing/browser`. Check current Safari support at implementation
time rather than assuming.

## Hosting

GitHub Pages project site (DECISIONS D6), served at
`https://<user>.github.io/fuel-planner/`. HTTPS is required for the service
worker outside localhost, and Pages provides it.

- Vite `base` is `/fuel-planner/`, and React Router uses the same value as
  `basename`. The manifest `start_url`, `scope` and the service worker scope
  follow it.
- Pages has no rewrite rules. The build copies `index.html` to `404.html` so
  a deep link loaded without the service worker still boots the app. Once
  the service worker is installed, its navigation fallback serves the
  precached `index.html` for every route.
- Deploy with a GitHub Actions workflow on push to `main`: install, run
  `pnpm check`, upload `dist/` with `actions/upload-pages-artifact` and
  publish with `actions/deploy-pages`.
- On iPhone, install from Safari: Share, then Add to Home Screen. iOS shows no
  install prompt, so Settings shows these steps when the app is not running
  standalone.
- Moving to another host or a custom domain changes the origin. The installed
  app on the new origin starts empty; move data with export and import.

## Testing

- Engine: Vitest, table-driven, one fixture per DOMAIN rule, plus three
  full-day fixtures (rest day, Monday intervals run, Sunday long ride).
- Property tests (fast-check, optional) for the portion solver: results stay
  within bounds and steps.
- E2E: create profile, apply week template, open Sunday, see during-ride
  schedule, go offline, reload, same plan visible.
