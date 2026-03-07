# Settler — Open Source Reconciliation Engine

**Settler helps teams reconcile data across systems, surface mismatches, and generate replayable evidence for every run.**

If Stripe, banking data, and your internal ledger disagree, Settler shows the differences, records why they happened, and exports evidence you can review later.

## What Settler does

1. **Ingest** records from source systems.
2. **Reconcile** with explicit matching rules.
3. **Detect** mismatches and route exceptions for review.
4. **Export evidence** (inputs, rules, outputs, fingerprints).
5. **Replay runs** to verify behavior with the same evidence package.

## What you can do in 5 minutes

```bash
pnpm install
cp .env.example .env
pnpm exec tsx scripts/run-migrations-remote.ts
pnpm --filter @settler/web dev
pnpm demo
pnpm settler:replay examples/demo-output/evidence.json
```

Demo outputs are written to `examples/demo-output` (`run.json`, `results.json`, `evidence.json`, `report.html`).

## Why teams choose Settler

- **Replayable runs** for audit and debugging.
- **Evidence-first outputs** for incident reviews.
- **Rules as code** for PR and CI workflows.
- **Open-source and self-hostable** (Apache 2.0).

## Documentation paths

- Start here: [`docs/START_HERE.md`](docs/START_HERE.md)
- Canonical docs map: [`docs/INDEX.md`](docs/INDEX.md)
- KPI instrumentation: [`docs/metrics/EVENT_TAXONOMY.md`](docs/metrics/EVENT_TAXONOMY.md)
- Canonical positioning: [`docs/positioning/CANONICAL_POSITIONING.md`](docs/positioning/CANONICAL_POSITIONING.md)

## Quickstart

Prerequisites:

- Node.js 22+
- pnpm 10.13.1+
- Postgres or Supabase

Set environment values:

```bash
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

Run locally:

```bash
pnpm install
pnpm exec tsx scripts/run-migrations-remote.ts
pnpm --filter @settler/web dev
```

Open `http://localhost:3000`.

## Why Settler

### 1) Problem

Reconciling financial data across systems is fragile.

### Feature

Settler records deterministic reconciliation runs with stable fingerprints.

### Outcome

You can prove exactly how each result was produced.

Core runtime primitives:

- **Connections:** external data sources (Stripe, banks, ERPs, ledgers).
- **Pipelines:** reconciliation workflow configurations.
- **Runs:** individual reconciliation executions (immutable, replayable).
- **Results:** matched and mismatched records with full context.
- **Review Queue:** exception handling with assignment and resolution tracking.
- **Evidence:** audit-ready proof of what happened in each run.

Key packages:

- `packages/api` – reconciliation API, domain logic, and data layer.
- `packages/web` – Next.js web app (product console, docs, marketing).
- `packages/adapters` – connectors for Stripe, banks, ERPs, and other data sources.
- `packages/sdk`, `packages/react-settler`, `packages/sdk-go`, `packages/workhorse` – client SDKs and background workers.

### 2) Problem

Manual triage makes mismatch resolution slow.

### Feature

Settler surfaces mismatch outcomes with rule-checked routing.

### Outcome

Teams focus on high-risk mismatches first.

### 3) Problem

Audit and incident questions require evidence collection after the fact.

### Feature

Settler generates evidence bundles during every run.

### Outcome

Operators can answer "what happened" immediately.

### 4) Problem

Run-to-run drift is hard to explain with scripts and spreadsheets.

### Feature

Settler replays historical runs against the same inputs and config.

### Outcome

You can isolate behavioral changes before release.

### 5) Problem

Compliance reviews fail when controls are implicit.

### Feature

Settler applies policy checks as part of run execution.

### Outcome

Control behavior becomes testable and reviewable.

## Architecture

Learn how the engine works → [`docs/ENGINE.md`](docs/ENGINE.md)

For contributor workflow, see [`CONTRIBUTING.md`](CONTRIBUTING.md).
For a top-level system map, see [`ARCHITECTURE.md`](ARCHITECTURE.md).

## Documentation

- Docs home: [`docs/README.md`](docs/README.md)
- Getting started: [`docs/getting-started/README.md`](docs/getting-started/README.md)
- Product docs: [`docs/product/README.md`](docs/product/README.md)
- API + SDK: [`docs/api/README.md`](docs/api/README.md)
- Security docs: [`docs/security/README.md`](docs/security/README.md)

## License and support

- License: [`LICENSE`](LICENSE)
- Security reports: [`SECURITY.md`](SECURITY.md)
