# Installation and Setup Troubleshooting

## `repo-integrity` fails

Run `pnpm run repo-integrity` and fix the first failing contract:

- missing workspace manifest
- stale script file reference
- missing TypeScript `build` / `typecheck` scripts
- invalid internal workspace dependency reference

## `bootstrap` fails

`bootstrap` runs install + repo-integrity + first-run doctor. Inspect the first failing stage and rerun:

```bash
pnpm run bootstrap
```

If env file generation failed, recreate:

```bash
cp .env.local.example .env.local
```

## `doctor` fails on runtime/toolchain checks

- Use Node 24.x for full parity with declared toolchain targets.
- `pnpm run doctor -- --skip-pipeline --first-run` is for first-run readiness.
- `pnpm run doctor -- --skip-pipeline` is strict and expects fuller env/runtime readiness.

## `dev:stack` does not start cleanly

- Ensure required env exists (`.env.local` created from `.env.local.example`).
- Ensure required backing runtime services are reachable (local DB/Supabase where configured).
- Re-run `pnpm install` then `pnpm run repo-integrity`.

## `demo` fails

Run with a clean install and generated env first:

```bash
pnpm install
pnpm run bootstrap
pnpm run demo
```
