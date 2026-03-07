# Launch Gate Criteria

## DEVELOPMENT SAFE

`YES` when no blocking dimensions fail in `security/security-verdict.json`.

## LAUNCH SAFE

- `YES`: no blocking fails and no degraded dependency/RLS evidence.
- `CONDITIONAL`: no blocking fails, but dependency advisory completeness or runtime RLS evidence is degraded.
- `NO`: any blocking dimension fails.

## ENTERPRISE REVIEW SAFE

- `YES`: authenticated advisory completeness = complete and RLS evidence = runtime-confirmed.
- `IMPROVED_NOT_COMPLETE`: otherwise, with explicit constraints and operator actions.

## Recommended flows

- PR: `pnpm run verify:security:fast`
- Main/release: `pnpm run verify:security:full`
- Enterprise release gate: `pnpm run verify:security:enterprise`
