# Quickstart

## Canonical Path (Recommended)

For the most reliable local development setup, follow the canonical install/run order defined in [SETUP.md](../../SETUP.md). This ensures all services are properly configured and validated.

### Fastest Path to Working Screen

```bash
# One-time setup
git clone https://github.com/settler/settler.git
cd settler
pnpm run bootstrap          # Creates .env.local, installs deps, validates setup
pnpm tb:start               # Starts TigerBeetle and PostgreSQL
pnpm dev                    # Starts web (localhost:3000) and API (localhost:4000)
```

## What `pnpm demo:settler` Does

The `demo:settler` script provides a guided deterministic demonstration:

1. Verifies environment with `pnpm doctor -- --skip-pipeline --first-run`
2. Attempts migrations when `DATABASE_URL` is set
3. Loads demo dataset into `examples/demo-data/dataset.json`
4. Starts local services (`pnpm dev:stack`) if not already running
5. Runs deterministic reconciliation simulation (`pnpm demo`)
6. Runs replay verification and prints guided operator URLs

## Success Criteria

- `demo:settler` exits successfully
- Demo artifacts are generated in `examples/demo-output/`
- Web console is reachable at `http://localhost:3000`
- API is reachable at `http://localhost:4000`

## Explicit Degraded States (Local Dev)

Settler supports explicit degraded states for optional dependencies in local development:

- Redis unavailable: in-memory fallback is used for queue/cache paths.
- TigerBeetle unavailable: ledger-dependent workflows are limited; core app routes can still run.
- Missing non-critical API keys (for example, Sentry): local `pnpm dev` works, while production-grade `pnpm build` may fail until secrets are provided.

Use `pnpm run doctor -- --first-run` to confirm which degraded states are active before evaluating behavior claims.

## Teardown / Cleanup (Reversible)

When you finish a local evaluation and want to stop services plus clean demo artifacts:

```bash
pnpm run dev:teardown
```

What this does:

1. Stops TigerBeetle/Postgres local service stack (`pnpm tb:stop`) on a best-effort basis.
2. Resets seeded demo records (`pnpm demo:reset`) on a best-effort basis.
3. Removes local teardown artifacts under `examples/demo-output/local/` when present.
4. Prints a machine-readable summary indicating any degraded cleanup steps that need manual follow-up.

For destructive database reset workflows, use explicit DB commands separately (`pnpm db:reset`) so data-loss intent remains operator-visible.

## Environment Variables

For the quickstart path, the default values in `.env.local` (created from `.env.local.example`) are sufficient to see the working screen. For full functionality, consult `.env.example` and configure required variables as needed.
