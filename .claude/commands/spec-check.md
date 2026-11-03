---
description: Check engine code and constants against docs/DOMAIN.md
---

Compare `src/engine/` with `docs/DOMAIN.md`.

- For every constant in `src/engine/constants.ts`, confirm it matches the
  rule ID and value or range in DOMAIN.md and cites a source listed there.
- List any number used in `src/engine/` that is not a named constant.
- List DOMAIN rules with no implementation or no test.
- List tests whose expected values are not shown as hand arithmetic.

Report findings as a table (rule ID, file, issue). Do not change code.
