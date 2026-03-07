# Settler — Open Source Reconciliation Engine

**Settler helps teams reconcile data across systems, surface mismatches, and generate replayable evidence for every run.**

If Stripe, banking data, and your internal ledger disagree, Settler shows the differences, records why they happened, and exports evidence you can review later.

## What Settler does

1. **Ingest** records from source systems.
2. **Reconcile** with explicit matching rules.
3. **Detect** mismatches and route exceptions for review.
4. **Export evidence** (inputs, rules, outputs, fingerprints).
5. **Replay runs** to verify behavior with the same evidence package.

## Five Minute Demo

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

| Capability | OSS (this repo) | Enterprise |
|---|---|---|
| Reconciliation engine | Yes | Yes |
| Evidence generation | Yes | Yes |
| Replay and determinism | Yes | Yes |
| Rules as code | Yes | Yes |
| Self-hosted deployment | Yes | Yes |
| Multi-tenant isolation | Yes | Yes |
| Managed hosting | — | Yes |
| SSO / SAML | — | Yes |
| Priority support and SLA | — | Yes |
| Advanced integrations | Community adapters | Managed connectors |

See [docs/OSS_VS_ENTERPRISE.md](docs/OSS_VS_ENTERPRISE.md) for details.

## Demo Output

After running the demo, inspect:

## Documentation paths

The demo path shows reconciliation execution, mismatch detection, evidence generation, and replay verification.

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

## Core Concepts

- **Connections:** external data sources (Stripe, banks, ERPs, ledgers)
- **Pipelines:** reconciliation workflow configurations
- **Runs:** individual reconciliation executions (immutable, replayable)
- **Results:** matched and mismatched records with full context
- **Review Queue:** exception handling with assignment and resolution tracking
- **Evidence:** audit-ready proof of what happened in each run

## Key Packages

- `packages/api` – reconciliation API, domain logic, and data layer
- `packages/web` – Next.js web app (product console, docs, marketing)
- `packages/adapters` – connectors for Stripe, banks, ERPs, and other data sources
- `packages/sdk`, `packages/react-settler`, `packages/sdk-go`, `packages/workhorse` – client SDKs and background workers

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
