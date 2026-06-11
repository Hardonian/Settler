# Settler — Reconciliation Intelligence Platform

> Match financial transactions deterministically. Preserve adjudication memory. Export audit-grade evidence. Expose it all as an API.

Settler replaces spreadsheet reconciliation with a purpose-built engine: deterministic runs, hash-linked proofpacks, explicit degraded states, and tenant-scoped operator truth — not UI-invented summaries.

## What Settler Does

Given two data sources (e.g., Stripe payouts vs. bank deposits), Settler:

1. **Ingests** transactions from CSV uploads or API calls
2. **Matches** them deterministically using configurable tolerance rules
3. **Flags exceptions** — unmatched and conflicting items — into a structured review queue
4. **Records every decision** with full adjudication memory, so outcomes are replayable
5. **Exports proofpacks** — hash-linked, auditor-verifiable evidence bundles — on demand

Every reconciliation run produces a canonical result that can be replayed from scratch and verified byte-for-byte.

## Who This Is For

| Audience                     | Problem Solved                                                                 |
| ---------------------------- | ------------------------------------------------------------------------------ |
| **Finance operations teams** | Replace manual spreadsheet matching with automated, audit-ready reconciliation |
| **Engineering teams**        | Embed transaction matching into financial products via REST API                |
| **Compliance teams**         | Produce deterministic evidence for every reconciliation decision               |

## Core Capabilities (Shipped)

- Stripe ↔ Bank transaction matching with configurable tolerance rules
- CSV and API ingestion pipelines with idempotency guarantees
- Manual review queue with structured adjudication and audit trails
- Hash-linked proofpack generation for every reconciliation run
- Multi-workspace tenant isolation enforced at the database and application layer
- Live activity feed surfacing reconciliation and billing events
- Operator console with run history, exception review, and evidence export

See [What Works Today](docs/getting-started/WHAT_WORKS.md) for the full verified capability list.  
See [Intentional Boundaries](docs/getting-started/INTENTIONAL_BOUNDARIES.md) for what is not yet production-ready.

## Architecture

Settler is composed of five primary layers with a strict separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│  Console Surface  (packages/web — Next.js App Router)   │
│  Operator dashboard, exception review, evidence export  │
├─────────────────────────────────────────────────────────┤
│  CLI Surface  (packages/cli)                            │
│  Foundry tooling, deterministic verification, replay    │
├─────────────────────────────────────────────────────────┤
│  TypeScript Control Plane  (packages/api — Express)     │
│  API routes, orchestration, tenancy, persistence policy │
├─────────────────────────────────────────────────────────┤
│  Reconciliation Core  (packages/reconciliation-core)    │
│  Matching engine, tolerance evaluation, proofpack emit  │
├─────────────────────────────────────────────────────────┤
│  Rust Kernel  (crates/)                                 │
│  Deterministic primitives, hashing, cryptographic proof │
└─────────────────────────────────────────────────────────┘

Persistence:
  TigerBeetle ──── Immutable financial ledger (double-entry)
  PostgreSQL ────── Projections, audit logs, tenant config
  Redis ─────────── Queue backend and distributed cache
```

## Quick Start

For the complete local setup guide, see **[SETUP.md](SETUP.md)**.

Minimal path to a working console:

```bash
git clone https://github.com/settler/settler.git
cd settler
pnpm run bootstrap     # creates .env.local, installs deps, validates contract
pnpm tb:start          # starts TigerBeetle + PostgreSQL + Redis
pnpm dev               # http://localhost:3000 (console), http://localhost:4000 (API)
```

Run a deterministic onboarding check with no network or secrets required:

```bash
pnpm exec tsx packages/cli/src/index.ts first-run
```

Run the full verification suite:

```bash
pnpm verify
```

For a faster canonical surface + proofpack + tenant posture check:

```bash
pnpm run verify:moat-readiness
```

## Repository Structure

| Path                           | Purpose                                                     |
| ------------------------------ | ----------------------------------------------------------- |
| `packages/api`                 | Node.js Control Plane — Express, TypeScript, all API routes |
| `packages/web`                 | Operator Console — Next.js App Router                       |
| `packages/cli`                 | Foundry, replay, and verification tooling                   |
| `packages/reconciliation-core` | Core matching engine and proofpack generation               |
| `crates/`                      | Rust Kernel — deterministic primitives and proofs           |
| `docs/`                        | Canonical product and engineering documentation             |
| `scripts/`                     | Verification, operational automation, and repo hygiene      |
| `supabase/`                    | Database migrations and RLS policies                        |

## TigerBeetle Management

```bash
pnpm tb:start    # Start the ledger container
pnpm tb:status   # Check ledger health
pnpm tb:logs     # Follow ledger logs
pnpm tb:reset    # Wipe and reformat (development only)
```

## Documentation

**Getting started:**

- [Canonical Local Setup](SETUP.md)
- [Quickstart](QUICKSTART.md) — Fastest path to a running system
- [What Works Today](docs/getting-started/WHAT_WORKS.md)
- [Intentional Boundaries](docs/getting-started/INTENTIONAL_BOUNDARIES.md)
- [Demo Walkthrough](docs/getting-started/DEMO_WALKTHROUGH.md)
- [Common Setup Traps](docs/troubleshooting/SETUP_TRAPS.md)

**Reference:**

- [Architecture](docs/platform-architecture.md)
- [API Reference](docs/API_REFERENCE.md)
- [Verification Commands](docs/VERIFICATION_COMMANDS.md)
- [Security Policy](SECURITY.md)
- [Security Invariants](SECURITY_INVARIANTS.md)

**Evaluation and pilot:**

- [Pilot Runbook](docs/pilot-runbook.md)
- [Trust Packet](docs/trust-packet.md)
- [Teardown Guide](docs/getting-started/teardown.md)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). All pull requests must pass `pnpm verify`.

## License

See [LICENSE](LICENSE).

## Repository Standards

- Squash-only merges — no merge commits
- Auto-delete merged branches
- Weekly dependency update windows
- Secret scanning and code scanning enforced in CI
