# Fuel Planner

Personal PWA that turns the activities planned for one day into that day's
energy and macro targets and a list of meals with their timing, targets and
the type of meal to aim for. One user, local-first, no account, no backend.
Food logging stays in the user's separate tracking app.

## Read first

- `docs/PRODUCT.md`: scope, features, non-goals.
- `docs/DOMAIN.md`: nutrition and exercise-energy rules. It is the only source
  of truth for every number the engine uses.
- `docs/DATA_MODEL.md`: entities and TypeScript types.
- `docs/ARCHITECTURE.md`: stack, folder layout, storage, offline behaviour.
- `docs/UX.md`: screens and flows.
- `docs/ROADMAP.md`: milestones with acceptance criteria. Work on one milestone
  at a time, in order.
- `docs/DECISIONS.md`: decision log and open questions.
- `seed/`: example profile used for fixtures and first-run data.

## Stack

- Vite, React 19, TypeScript (strict), React Router.
- `vite-plugin-pwa` (Workbox) for the service worker and manifest.
- Dexie (IndexedDB) for local storage. Zod schemas for every persisted entity
  and every import/export payload.
- Tailwind CSS for styling.
- Vitest for unit tests, Playwright for end-to-end tests.
- pnpm as package manager.
- Tooling: ESLint (typescript-eslint, react-hooks, react-refresh), Prettier,
  `@vitejs/plugin-react`, `@tailwindcss/vite`, `workbox-window`,
  `fake-indexeddb` (tests only), `lucide-react` (icons, D51).

Ask before adding any dependency not listed here.

## Commands

```
pnpm install
pnpm dev          # Vite dev server
pnpm build        # type-check and production build
pnpm preview      # serve the build, needed to test the service worker
pnpm test         # Vitest
pnpm test:e2e     # Playwright
pnpm lint
pnpm typecheck
pnpm check       # typecheck, lint, format check, test, build
```

## Rules

- All nutrition and energy logic lives in `src/engine/`. Engine code is pure:
  no React, no Dexie, no `Date.now()`, no network. Inputs in, plan out.
- Every coefficient (BMR formula terms, g/kg ranges, g/h fueling rates,
  efficiency, MET values) is a named constant in `src/engine/constants.ts`
  with a comment naming its source as listed in `docs/DOMAIN.md`.
- Never invent or "round to something sensible" a nutrition number. If
  `docs/DOMAIN.md` does not cover a case, stop, ask, and add the question to
  `docs/DECISIONS.md`.
- Engine functions get unit tests with hand-computed expected values. Put the
  arithmetic in the test as a comment so it can be checked.
- Units are metric: kg, cm, g, kcal, kJ, ml, minutes. Times are local wall
  clock in the profile time zone (default Europe/Paris), stored as ISO strings.
- The app shows ranges where the source gives ranges. A single target is the
  user-selected point inside the range, never a hidden choice.
- No analytics, no third-party scripts and no network calls at runtime, other
  than the service worker update check (`docs/ARCHITECTURE.md`).
- UI text in English, all strings through one i18n module so French can be
  added later.

## Definition of done for a milestone

1. Acceptance criteria in `docs/ROADMAP.md` are met.
2. `pnpm typecheck`, `pnpm lint`, `pnpm test` and `pnpm build` pass.
3. New engine functions have tests; new screens have at least one Playwright
   path for the main flow.
4. The milestone checkbox in `docs/ROADMAP.md` is ticked and any new decision
   is in `docs/DECISIONS.md`.

## Writing style for code, comments and docs

- Describe what the code does now. No comments about past versions, fixes or
  the diff; that goes in the commit body.
- Keep non-obvious constraints, units and invariants in comments.
- Plain, direct English. No em dashes, no emojis, no marketing words.
- Commit messages: imperative subject under 72 characters, body explaining why.
