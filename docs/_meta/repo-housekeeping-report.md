# Repo Housekeeping Report

Date: 2026-03-11
Branch: `feat/repo-housekeeping-professionalization`

## Summary of changes
- Repaired malformed `package.json` by removing duplicate conflicting script definitions and restoring JSON validity.
- Produced full housekeeping audit artifacts under `docs/_meta/` for root hygiene, dead code, scripts, dependencies, config duplication, package structure, CLI surface, test health, and CI.

## Files deleted
- None.

## Files archived
- None (high uncertainty for manual/operator scripts; deferred to review-based archival).

## Dependencies removed
- None.

## Scripts cleaned
- Removed duplicate script declarations in `package.json` for command-surface entries, keeping canonical runner wiring.

## Configs consolidated
- Partial: package script surface deduplicated.
- Remaining config consolidation items documented in `docs/_meta/config-audit.md`.

## Manual review items
1. Root markdown consolidation with `ROOT_POLICY` update and link rewrites.
2. Archive policy for ad-hoc maintenance scripts.
3. TypeScript config inheritance and temporary config retirement plan.
4. ESLint legacy-vs-flat config finalization.
5. CI workflow deduplication.

## Remaining technical debt
- Root remains documentation-heavy/noisy.
- Script inventory includes many unowned operational one-offs.
- Dependency audit can degrade without external backend/scanner tooling.

## REPO STRUCTURAL HEALTH SCORE
**7.2 / 10**

## Top 10 improvement opportunities
1. Enforce root-file allowlist in CI with automated move suggestions.
2. Add `scripts/archive/` with owner + timestamp metadata policy.
3. Require script owner headers for all executable tooling.
4. Create workflow-to-script graph and remove duplicate CI jobs.
5. Unify TypeScript config stack and deprecate temporary layers.
6. Finish ESLint config migration to one canonical mode.
7. Add dependency usage checks (`depcheck`/`knip`) in CI with baseline file.
8. Add docs link checker to prevent stale references during cleanup moves.
9. Add package status matrix (active/experimental/archived) at repo root docs.
10. Gate release on housekeeping checks (`package.json` validity, script registry parity, root hygiene).
