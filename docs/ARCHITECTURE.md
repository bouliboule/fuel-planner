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
    guidance.ts    meal guidance key per slot (G1)
    plan.ts        planDay(inputs)
    trace.ts
  model/           Zod schemas and inferred types
  db/              Dexie database, migrations, repositories
  features/        one folder per screen: onboarding, day, profile
  ui/              shared components
  i18n/            every UI string, including guidance and example text
  pwa/             service worker registration, update prompt
tests/
  engine/          Vitest, hand-computed fixtures
  e2e/             Playwright
```

The Day screen reads the profile, the goal valid on that date and the
sessions of that date and the next date from Dexie, and calls `planDay` with
plain objects. The next date's sessions are needed for fast recovery (T4).
The result is held in memory, never stored. The engine never reads storage.

## Network

The app makes no network calls at runtime other than the service worker's
update check against its own origin.

## PWA

- `vite-plugin-pwa` with `registerType: 'prompt'`: show an "update available"
  banner instead of reloading silently.
- Precache the app shell. No runtime caching.
- Manifest: standalone display, maskable icons, theme colour. `start_url`
  and `scope` are the base path (see Hosting); the router redirects the base
  path to `day`. `index.html` also links a 180x180 PNG `apple-touch-icon`,
  because iOS ignores maskable manifest icons for the home screen.
- Call `navigator.storage.persist()` on first launch and show the result in
  Profile. Safari can evict storage for sites not added to the home screen;
  the export button and a "last export" date in Profile are the backup.
- Test offline with `pnpm preview`, not `pnpm dev`.

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
  install prompt, so Profile shows these steps when the app is not running
  standalone.
- Moving to another host or a custom domain changes the origin. The installed
  app on the new origin starts empty; move data with export and import.

## Testing

- Engine: Vitest, table-driven, one fixture per DOMAIN rule, plus full-day
  fixtures (rest day, Monday intervals run, Sunday long ride).
- E2E: first run with a profile, add a long ride for tomorrow, see the
  pre-workout, during and post-workout cards, go offline, reload, same plan
  visible.
