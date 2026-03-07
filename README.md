# Settler — Open Source Reconciliation Engine

**Open-source engine that reconciles financial data across systems, surfaces mismatches, and produces verifiable evidence for every run.**

Stripe says one thing. Your bank says another. Your ledger says something else. Settler finds every difference, explains why, and proves the results are correct.
Settler runs reconciliation workflows, detects mismatches, and generates verifiable evidence for every result.

## Why Settler Exists

Most teams still reconcile across spreadsheets, exports, and one-off scripts. When mismatches appear, operators lose hours tracing row-level differences and cannot clearly explain why balances diverged.

Companies reconcile across Stripe, banks, ERPs, and internal ledgers using spreadsheets and scripts that break silently, produce unexplainable results, and cannot be audited.

Settler replaces that with a reconciliation engine where:
- Every run is **repeatable** — same inputs and rules always produce the same results
- Every mismatch is **surfaced** — with full context about what didn't match and why
- Every result is **provable** — evidence packs are generated automatically for audit
- Every exception is **tracked** — from detection through resolution
Settler exists to replace fragile manual reconciliation with replayable runs, explicit rule checks, and audit-ready evidence.

## What Settler Does

- Run reconciliation workflows across source systems.
- Detect mismatches across systems with deterministic matching.
- Generate evidence for every run.
- Replay runs to explain what changed and why.
- Export audit proof for incidents and external reviews.

1. **Ingest** records from Stripe, banks, ERPs, and ledgers.
2. **Reconcile** with explicit matching rules defined in code.
3. **Detect** mismatches and route them to a review queue.
4. **Prove** results with exported evidence (input data, rules applied, outputs, cryptographic hashes).
5. **Replay** any run to verify or debug the results.

## What you can do in 5 minutes
## Five Minute Demo

```bash
pnpm install
cp .env.example .env
pnpm exec tsx scripts/run-migrations-remote.ts
pnpm --filter @settler/web dev
pnpm demo
pnpm settler:replay examples/demo-output/evidence.json
```

Demo outputs are written to `examples/demo-output`:
- `run.json`
- `results.json`
- `evidence.json`
- `report.html`

## Why Settler is different

- **Replayable runs:** re-run any reconciliation with identical results. Debugging and auditing become tractable.
- **Evidence generation:** every run produces an evidence pack — what data went in, what rules applied, what matched, what didn't.
- **Rules as code:** matching rules live in your repository, go through pull requests, and run in CI.
- **Exception workflow:** mismatches route to a review queue with assignment, resolution tracking, and audit context.
- **Self-hosted, open source:** Apache 2.0 licensed. Your data stays in your infrastructure.
- **API and SDK first:** reconciliation runs can be triggered programmatically and embedded in operational workflows.

## OSS vs Enterprise at a glance

### OSS (this repo, self-hostable)
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
