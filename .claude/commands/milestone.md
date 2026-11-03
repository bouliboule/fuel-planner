---
description: Plan and implement one milestone from docs/ROADMAP.md
argument-hint: <milestone id, e.g. M1>
---

Implement milestone $ARGUMENTS from `docs/ROADMAP.md`.

1. Read `CLAUDE.md`, the milestone section in `docs/ROADMAP.md`, and every doc
   it depends on (`docs/DOMAIN.md` for engine work, `docs/DATA_MODEL.md` for
   storage, `docs/UX.md` for screens).
2. List anything ambiguous or missing that would force you to invent a number
   or a behaviour. Ask about those before writing code. Add each to
   `docs/DECISIONS.md` as an open question if I don't answer.
3. Propose a short plan: files to create or change, tests to write. Wait for
   approval.
4. Implement with tests first for engine code.
5. Run `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`. Fix failures.
6. Tick the milestone items in `docs/ROADMAP.md`, update
   `docs/DECISIONS.md`, and propose a commit message. Do not commit unless I
   say so.
