# Settler — Omnichannel Reconciliation Intelligence OS

> Deterministic matching. Agentic AI exception resolution. Maker-Checker compliance. 6-Persona Enterprise Lock-In.

Settler replaces legacy spreadsheet reconciliation and isolated back-office scripts with a comprehensive, purpose-built, and **audit-grade Operating System**. Built for the modern enterprise, Settler provides deterministic runs, hash-linked proofpacks, live ERP sync, and explicit degraded states that ensure zero data drift.

## The Omnichannel Enterprise Suite

Settler is no longer just for operations. We provide natively integrated workspaces engineered to permanently solve the reconciliation burden across 6 critical enterprise personas:

| Audience                   | The Settler Solution                                                                                                 |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **CFO / FP&A**             | Maker-Checker SOX gates, Continuous Close APIs, Live FX Translation, and Liquidity Risk visualizers.                 |
| **CISO / InfoSec**         | Hardened Data Residency (Geo-fencing) controls, runtime PII Redaction engines, and verifiable SIEM exports.          |
| **IT & Engineering**       | Robust JSON/CSV Schema Registries, Real-time Webhook telemetry/replay loops, and developer tooling.                  |
| **FinOps & Operators**     | AI-Powered Rule Discovery (mines manual behavior), Agentic exception auto-triage, and ZKP payload syncs.             |
| **Customer Support (CX)**  | Native CRM syncing (Zendesk/Salesforce) directly tying support tickets to specific ledger exceptions.                |
| **External Vendors (B2B)** | Isolated Vendor Portals allowing external partners to submit SLA/Dispute evidence directly into the ledger workflow. |
| **External Auditors**      | Read-only statistical sampling portals specifically designed for Big 4 auditors checking ITGC/SOC2.                  |

## Core Capabilities

- **Deterministic Edge Matching:** Stripe ↔ Bank transaction matching with configurable, programmatic tolerance rules.
- **Agentic AI Resolution:** Deep reinforcement AI models that adjudicate exceptions within strict, deterministic bounds.
- **Zero-Knowledge Proofs (ZKP):** Secure payload syncing that proves reconciliation intent without exposing raw PII.
- **Live ERP Synchronization:** Write-back interfaces pushing perfectly matched datasets to Netsuite/Oracle/SAP.
- **Continuous Close:** Real-time financial period closure with Maker-Checker multi-party signature tracking.
- **Hash-Linked Proofpacks:** Cryptographic, byte-for-byte evidence generated on every single reconciliation run.

See [What Works Today](docs/getting-started/WHAT_WORKS.md) for the full verified capability list.  
See [Intentional Boundaries](docs/getting-started/INTENTIONAL_BOUNDARIES.md) for what is not yet production-ready.

## Architecture

Settler is composed of five primary layers with a strict separation of concerns:

```text
┌─────────────────────────────────────────────────────────┐
│  Console Surface  (packages/web — Next.js App Router)   │
│  Operator dashboard, CFO workflows, IT webhooks         │
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
pnpm run bootstrap     # creates .env.local, installs deps, validates contract
pnpm tb:start          # starts TigerBeetle + PostgreSQL + Redis
pnpm dev               # http://localhost:3000 (console), http://localhost:4000 (API)
```

Run a deterministic onboarding check with no network or secrets required:

```bash
pnpm exec tsx packages/cli/src/index.ts first-run
```

Run the full verification suite (Required before any PR merge):

```bash
pnpm verify
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

## Documentation

**Getting started:**

- [Canonical Local Setup](SETUP.md)
- [Quickstart](QUICKSTART.md) — Fastest path to a running system
- [What Works Today](docs/getting-started/WHAT_WORKS.md)
- [Demo Walkthrough](docs/getting-started/DEMO_WALKTHROUGH.md)

**Reference:**

- [Architecture](docs/platform-architecture.md)
- [API Reference](docs/API_REFERENCE.md)
- [Verification Commands](docs/VERIFICATION_COMMANDS.md)
- [Security Policy](SECURITY.md)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). All pull requests must pass `pnpm verify` and `pnpm run typecheck`.

## License

See [LICENSE](LICENSE).
