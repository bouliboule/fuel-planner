# fuel-planner

Specification and Claude Code setup for a personal nutrition-planning PWA.
No application code yet; Claude Code builds it from these documents.

## Layout

```
CLAUDE.md                 project instructions Claude Code loads automatically
.claude/commands/         custom slash commands
docs/PRODUCT.md           what the app does and does not do
docs/DOMAIN.md            nutrition rules, formulas, sources
docs/DATA_MODEL.md        entities and types
docs/ARCHITECTURE.md      stack, storage, offline, food data sources
docs/UX.md                screens and flows
docs/ROADMAP.md           milestones and acceptance criteria
docs/DECISIONS.md         decision log and open questions
seed/                     example profile, week and foods
```

## Getting started

1. Fill in the `TODO` values in `seed/profile.json` (body mass is required for
   every g/kg target).
2. Read `docs/DECISIONS.md` and answer the open questions you care about.
   Unanswered ones keep the default listed there.
3. In this folder:

   ```
   git init && git add -A && git commit -m "Add project specification"
   claude
   ```

4. In Claude Code, run `/milestone M0` to scaffold the project, then
   `/milestone M1`, and so on. Review and commit after each milestone.
5. Use `/spec-check` when a change touches nutrition logic, to compare the
   engine against `docs/DOMAIN.md`.

Planning mode (Shift+Tab twice) is useful for the first run of each milestone:
Claude Code proposes the plan, you approve or correct it, then it builds.
