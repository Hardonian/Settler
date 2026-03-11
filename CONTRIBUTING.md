# Contributing to Settler

Thanks for helping improve Settler.

## Development setup

```bash
pnpm install
pnpm dev:stack
```

For a deterministic local demo and fixtures:

```bash
pnpm demo:settler
pnpm generate:test-data:smoke
```

## Repository structure

- `packages/api`: API routes, domain services, security middleware.
- `packages/web`: operator console (run explorer, replay, health, alerts).
- `packages/cli`: reconciliation foundry, replay tools, simulation harnesses.
- `scripts`: verification tooling, quality gates, operational scripts.
- `docs`: architecture, API reference, launch and operations guidance.

## Core modules

- Reconciliation runtime: `packages/cli/src` + `scripts/settler-engine.mjs`.
- API route surfaces: `packages/api/src/routes/v1`.
- Operator telemetry and health routes: `packages/api/src/routes/alerts.ts`, `packages/api/src/routes/metrics.ts`, `packages/api/src/routes/observability.ts`.
- Replay and run evidence tooling: `scripts/settler-replay.ts`, `scripts/reconciliation-run-tools.mjs`.

## Test strategy

Run these before opening a PR:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm demo:settler
```

Optional deeper validation:

```bash
pnpm verify
pnpm benchmark
pnpm demo:assets
```

## Simulations and demos

- `pnpm demo:settler`: end-to-end demo pipeline.
- `pnpm simulate:settler`: simulation flow for scenario testing.
- `pnpm replay:run`: replay execution for determinism checks.

## Adding connectors

1. Add/extend connector logic under API route and service boundaries (`packages/api/src/routes` and `packages/api/src/services`).
2. Keep tenant context explicit in request handling and persistence.
3. Add route and integration tests under `packages/api/src/__tests__` and/or `tests/integrations`.
4. Update `docs/API_REFERENCE.md` and any relevant architecture docs.

## Pull request expectations

- Keep diffs minimal and deterministic.
- Do not ship unverified claims.
- Include evidence for behavior changes (tests, script output, docs).
- If a security or tenancy assumption changes, call it out explicitly in the PR body.
