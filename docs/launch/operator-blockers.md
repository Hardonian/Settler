# Operator Blockers

## P0

1. `pnpm typecheck` fails in web console layout symbols (`ScanSearch`, `Gavel`, `Bot`, `coreNavItems`).
2. `pnpm run check:production` fails at `repo-integrity` because scripts reference missing files.
3. `pnpm run doctor -- --first-run` fails on required env + typecheck path, which is correct behavior but currently blocks "green" setup path without explicit sample population.

## P1

- Kernel readiness interpretation is non-trivial unless operators run explicit diagnostics.
- Command naming historically implied stronger production assurance than actually validated.

## Fixed in this pass

- Added `pnpm run kernel:health` command for startup + operation readiness evidence.
- Updated setup/runbook docs to call out first-action rollback and command honesty.
