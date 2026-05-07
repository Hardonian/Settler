## 2026-05-07 - [🧪 Add tests for Plaid webhook verification]

**Learning:** When adding tests in a large monorepo with strict CI checks, limit the scope strictly to the task. Unrelated test failures in other packages may exist, and trying to fix them can lead to compounding errors and rabbit holes out of scope. Use `pnpm run test --filter @settler/<package>` to only run and verify tests for the specific package modified.
**Action:** Prioritize isolated testing for the specific task and package. Only touch other files if explicitly requested or if directly impacted by the change.
