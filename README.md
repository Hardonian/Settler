# Settler — Open Source Reconciliation Engine

Settler runs reconciliation workflows, detects mismatches, and generates verifiable evidence for every result.

## Why Settler Exists

Most teams still reconcile across spreadsheets, exports, and one-off scripts. When mismatches appear, operators lose hours tracing row-level differences and cannot clearly explain why balances diverged.

Settler exists to replace fragile manual reconciliation with replayable runs, explicit rule checks, and audit-ready evidence.

## What Settler Does

- Run reconciliation workflows across source systems.
- Detect mismatches across systems with deterministic matching.
- Generate evidence for every run.
- Replay runs to explain what changed and why.
- Export audit proof for incidents and external reviews.

## Five Minute Demo

```bash
pnpm install
cp .env.example .env
pnpm exec tsx scripts/run-migrations-remote.ts
pnpm --filter @settler/web dev
pnpm demo
pnpm settler:replay examples/demo-output/evidence.json
```

After running the demo, inspect:

- `examples/demo-output/run.json`
- `examples/demo-output/results.json`
- `examples/demo-output/evidence.json`
- `examples/demo-output/report.html`

The demo path shows reconciliation execution, mismatch detection, evidence generation, and replay verification.

## Key Features

- Replayable reconciliation
- Proof-first operations
- Policy enforcement
- Evidence export
- Audit-ready workflows

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
