# Dead Code Report

Date: 2026-03-11

## Method
- Reference scan via `rg` across `package.json`, `.github/workflows`, and docs.
- Command-surface sanity checks via `pnpm run help:surface` and `pnpm run test:surface-commands`.

## SAFE DELETE (executed)
1. **Duplicate/invalid script declarations in `package.json`**
   - Removed second duplicate block for:
     - `demo:settler`
     - `replay:run`
     - `simulate:settler`
     - `tenant:create`
     - `chaos:test`
   - This resolved broken JSON and removed conflicting dead entries.

## LIKELY DEAD (not deleted)
- Ad-hoc maintenance and migration scripts with no package/CI references (examples):
  - `scripts/apply-all-fixes.sh`
  - `scripts/fix-all-syntax-errors.ts`
  - `scripts/apply-rls-final.ts`
  - `scripts/check-console-backend.sh`
- Retained due to potential operator/manual usage.

## NEEDS REVIEW
- Legacy one-off migration scripts under `scripts/` that are not referenced by package scripts or workflows.
- SQL/manual scripts that may be run out-of-band during incident response.

## Recommendation
Introduce `scripts/archive/` policy with owner approval + dated retention to remove high-risk ambiguity without losing recovery tooling.
