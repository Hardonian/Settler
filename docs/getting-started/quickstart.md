# Quickstart

## Canonical Path (Recommended)

For the most reliable local development setup, follow the canonical install/run order defined in [SETUP.md](../SETUP.md). This ensures all services are properly configured and validated.

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

## Environment Variables

For the quickstart path, the default values in `.env.local` (created from `.env.local.example`) are sufficient to see the working screen. For full functionality, consult `.env.example` and configure required variables as needed.