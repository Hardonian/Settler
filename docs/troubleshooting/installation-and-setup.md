# Installation and Setup Troubleshooting

## `repo-integrity` fails

Run `pnpm run repo-integrity` and fix the first failing contract:

- missing workspace manifest
- stale script file reference
- missing TypeScript `build` / `typecheck` scripts

## `doctor` fails on Node runtime

Use Node 24.x (project target), then rerun `pnpm run doctor`.

## `doctor` fails on env validation

For first-run local setup, use:

```bash
cp .env.local.example .env.local
pnpm run doctor -- --skip-pipeline --first-run
```

For strict checks, set required runtime variables and rerun strict doctor.

## `dev:stack` does not start cleanly

- Ensure ports are available.
- Re-run `pnpm install`.
- Re-run `pnpm run doctor -- --skip-pipeline`.
