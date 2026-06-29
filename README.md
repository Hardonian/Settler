# Settler — Open Source Reconciliation Engine

Deterministic transaction matching with configurable rules, audit trails, and a REST API. Built as a monorepo with TypeScript, Node.js, and PostgreSQL.

**Status:** Active development (local). Not yet production-ready. See [Intentional Boundaries](docs/getting-started/INTENTIONAL_BOUNDARIES.md).

## What It Does

Settler compares financial records from two sources (e.g., a payment processor's statement and a bank statement) and produces a deterministic match report identifying:

- **Matched records** — records that agree within configured tolerances
- **Unmatched source records** — records in the source with no corresponding match
- **Unmatched target records** — records in the target with no corresponding match
- **Conflicts** — records where reference data exists on both sides but values differ beyond tolerance

Results are stored in PostgreSQL with an append-only audit trail. The system supports tenant-isolated data, configurable matching rules, and idempotent ingestion.

## Tech Stack

| Layer           | Technology                              |
| --------------- | --------------------------------------- |
| Runtime         | Node.js 22+ / 24+                       |
| Language        | TypeScript 5.x                          |
| API framework   | Express 5.x                             |
| Package manager | pnpm 9.x                                |
| Database        | PostgreSQL 15+ via Prisma ORM           |
| Ledger (opt.)   | TigerBeetle (Docker, optional)          |
| Queue (opt.)    | Redis via BullMQ / Upstash              |
| Frontend        | Next.js (App Router) — operator console |
| CLI tooling     | TypeScript CLI via tsx                  |

See [packages/api/package.json](packages/api/package.json) and [package.json](package.json) for the full dependency tree.

## Repository Structure

```
packages/
  api/                  Express API server — routes, services, middleware
  web/                  Next.js operator console
  cli/                  CLI tooling (foundry, replay, verification)
  reconciliation-core/  Core matching engine and run result serialization
  types/                Shared TypeScript types
  adapters/             Source/target adapters
  sdk/                  Client SDK
  support-intake/       Support ticket integration
  proofs/               Proofpack generation utilities
  edge-ai-core/         ML matching enhancement (optional)
  agents/               Workflow agent runner (experimental)
  workhorse/            Python background worker
tools/
  settler-engine/       Go reconciliation engine (experimental)
  reconciliation_intel/ Drift detection, compliance snapshots (experimental)
  reconciliation_engine/ Python reconciliation engine
docs/                   Documentation
scripts/                Build, CI, and operational automation
prisma/                 Prisma schema and migrations
```

## Prerequisites

- **Node.js** 22.x or 24.x (see `.nvmrc` or engine field in `package.json`)
- **pnpm** 9.x (enable via `corepack enable`)
- **Docker** (for local PostgreSQL, Redis, and optional TigerBeetle)
- **PostgreSQL** 15+ (via Docker or native install)

## Quick Start

```bash
git clone https://github.com/settler/settler.git
cd settler
pnpm run bootstrap     # creates .env.local, installs deps, validates setup
pnpm tb:start          # starts PostgreSQL + Redis + TigerBeetle (Docker)
pnpm dev               # http://localhost:3000 (console), http://localhost:4000 (API)
```

For step-by-step setup instructions, see [SETUP.md](SETUP.md).

## API Overview

The API exposes versioned routes under `/api/v1/`. Key endpoints include:

- `POST /api/v1/ingestion` — Ingest source/target records (CSV, JSON, webhooks)
- `POST /api/v1/reconciliation/run` — Execute a reconciliation run
- `GET /api/v1/reconciliation/runs` — List reconciliation runs
- `GET /api/v1/reconciliation/runs/:id` — Reconciliation result detail
- `GET /api/v1/audit-trail` — Append-only audit log

Routes require authentication and are scoped by tenant ID. See [API Reference](docs/API_REFERENCE.md) for full documentation.

## Verification

The monorepo includes a comprehensive verification pipeline:

```bash
pnpm verify   # lint, typecheck, build, test, integrity checks
pnpm test     # unit tests
pnpm test:e2e # Playwright-based end-to-end tests
```

## Development

```bash
pnpm dev              # Start API + web in dev mode (hot reload)
pnpm run demo:seed    # Seed 100+ realistic transaction scenarios
pnpm run doctor       # Environment diagnostics
```

## Documentation

- [SETUP.md](SETUP.md) — Canonical local development setup
- [What Works Today](docs/getting-started/WHAT_WORKS.md) — Currently functional features
- [Intentional Boundaries](docs/getting-started/INTENTIONAL_BOUNDARIES.md) — Known limitations
- [Architecture](docs/platform-architecture.md) — System design overview

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). All pull requests must pass `pnpm verify` and `pnpm run typecheck`.

## License

See [LICENSE](LICENSE).
