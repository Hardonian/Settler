# Settler

Settler is a deterministic reconciliation and operations platform for teams that need reproducible runs, replayable outcomes, and operator-visible evidence. Built for financial-grade precision, Settler integrates **TigerBeetle** for its immutable ledger core while maintaining **PostgreSQL** for projection and operational metadata.

## Core Capabilities

- **Deterministic Pipeline** — Every reconciliation run is reproducible.
- **TigerBeetle Ledger** — Financial transactions are recorded in an immutable, high-performance ledger.
- **Operator Console** — Visual drill-down into runs, proofs, and exceptions.
- **Foundry CLI** — Tooling for engineers to simulate scenarios and replay historical runs.
- **Tenant Isolation** — Native multi-tenancy with strict data boundaries.

## Architecture Snapshot

Settler uses a hybrid storage model to balance financial safety with operational flexibility:

- **TigerBeetle** (Ledger Core): Immutable source of truth for all double-entry postings and account balances.
- **PostgreSQL/Supabase** (Projection Layer): Searchable projections, tenant configurations, audit logs, and operational state.
- **Redis** (Coordination): Real-time synchronization and idempotency guarding.

## Repository Structure

- `packages/api` — Node.js Control Plane (Express, TypeScript).
- `packages/web` — Next.js Operator Console.
- `packages/cli` — Engineering and Foundry tooling.
- `packages/types` — Shared domain models and ledger protocols.
- `scripts` — Verification, repo hygiene, and automation.

## Quick Start

### 1. Prerequisites

- Node.js >= 22.0
- pnpm >= 10.13
- Docker (for local TigerBeetle and Postgres)

### 2. Setup

```bash
pnpm install
cp .env.local.example .env.local
# Initialize infrastructure
pnpm tb:start
# Verify readiness
pnpm settler:doctor -- --first-run
```

### 3. Verification

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## TigerBeetle Management

Settler provides global helper scripts for managing the TigerBeetle ledger:

- `pnpm tb:start` — Start TigerBeetle container.
- `pnpm tb:status` — Check ledger health.
- `pnpm tb:logs` — Follow ledger logs.
- `pnpm tb:reset` — Wipe and reformat the ledger (Dev only).

## Documentation Hub

- [Architecture Overview](docs/ARCHITECTURE.md)
- [TigerBeetle Integration Design](docs/TIGERBEETLE_INTEGRATION_DESIGN.md)
- [Local Development Guide](docs/getting-started/README.md)
- [Security Policy](SECURITY.md)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the contribution workflow and quality gates. All pull requests must pass the `pnpm verify` suite.

## License

Settler is licensed under the terms found in [LICENSE](LICENSE). See [LICENSING_OVERVIEW.md](docs/LICENSING_OVERVIEW.md) for component-level licensing details.
