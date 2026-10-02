# Quickstart

## Credential-free verified settlement demo

This is the shortest supported path. It requires Node.js 24.15.x and pnpm 10.13.1, but no database, provider credentials, or network access after dependencies are installed.

```bash
pnpm install --frozen-lockfile
pnpm run demo:quickstart
pnpm run demo:verify
```

The command parses the synthetic processor-settlement and bank CSVs in `docs/demo-data/`, validates their mappings, invokes the versioned engine in `@settler/reconciliation-core`, asserts every expected decision, replays the result, and proves that a modified committed amount fails verification.

Generated artifacts are under `docs/demo-output/`:

- `mapping-preview.json`: detected columns, mappings, row counts, and validation state.
- `reconciliation-results.json`: normalized records, rule version, decisions, and summary.
- `proofpack.json`: deterministic payload, SHA-256 commitment, and export metadata.
- `proofpack.tampered.json`: deliberately invalid example; verification must exit non-zero.
- `dashboard.html`: inspectable static operator report.

The fixture models Stripe settlement ledger lines, including payouts, a refund, a dispute, and a tolerance case. It does not match individual card charges directly to bank payouts and does not claim charge-to-payout aggregation.

The commitment covers the normalized inputs, versions, rules, and semantic results. `operationalMetadata.generatedAt` is intentionally outside that commitment. Verification proves integrity and replay under the recorded engine version; it does not prove that source data was truthful or that a decision is legally or economically correct.

## Canonical Path (Recommended)

For the most reliable local development setup, follow the canonical install/run order defined in [SETUP.md](../../SETUP.md). This ensures all services are properly configured and validated.

### Fastest Path to Working Screen

```bash
# One-time setup
git clone https://github.com/Hardonian/Settler.git
cd settler
pnpm run bootstrap          # Creates .env.local, installs deps, validates setup
pnpm tb:start               # Starts TigerBeetle and PostgreSQL
pnpm dev                    # Starts web (localhost:3000) and API (localhost:4000)
```

## Authenticated local pilot

The following path exercises persistence and authenticated application surfaces. It is separate from the credential-free demo and requires the environment contract in `.env.example` plus local infrastructure.

```bash
pnpm run bootstrap
pnpm tb:start
pnpm dev
```

Do not treat the credential-free demo as evidence for hosted authentication, database RLS, live connectors, billing, or durable background execution.

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
