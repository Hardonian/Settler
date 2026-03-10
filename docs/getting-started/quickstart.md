# Quickstart

## Fast path

```bash
pnpm install
cp .env.local.example .env.local
pnpm demo:settler
```

## What `pnpm demo:settler` does

1. Verifies environment with `pnpm doctor -- --skip-pipeline --first-run`.
2. Attempts migrations when `DATABASE_URL` is set.
3. Loads demo dataset into `examples/demo-data/dataset.json`.
4. Starts local services (`pnpm dev:stack`) if not already running.
5. Runs deterministic reconciliation simulation (`pnpm demo`).
6. Runs replay verification and prints guided operator URLs.

## Success criteria

- `demo:settler` exits successfully.
- Demo artifacts are generated in `examples/demo-output/`.
- Web console is reachable at `http://localhost:3000`.
- API is reachable at `http://localhost:4000`.
