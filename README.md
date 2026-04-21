# Settler

Settler is **reconciliation intelligence plus an audit-grade operating system**: deterministic runs, hash-linked proofpacks, explicit degraded states, and tenant-scoped operator truth (not UI-invented summaries).

## What is Settler?

Settler matches financial transactions across data sources (e.g., Stripe payments vs. bank deposits) with **replayable outcomes**, **adjudication-backed institutional memory**, and **evidence exports** operators and auditors can verify.

## Who is this for?

- **Finance operations teams** who need automated, audit-ready reconciliation
- **Engineering teams** building financial products that require transaction matching
- **Compliance teams** needing deterministic evidence for every reconciliation decision

## Core Workflows That Work Today

- Stripe ↔ Bank transaction matching with configurable tolerances
- Manual review queue with audit trails
- Deterministic evidence generation for every decision
- CSV/API ingestion pipelines
- Multi-workspace tenant isolation

See [What Works Today](docs/getting-started/WHAT_WORKS.md) for full details.

## Architecture

Settler's architecture is composed of five primary layers, ensuring a separation of concerns between deterministic computation, policy enforcement, and operator interfaces.

1.  **Rust Kernel**: Provides deterministic primitives for computation, hashing, and proofs.
2.  **TypeScript Control Plane**: The `packages/api` service, which handles orchestration, tenancy, API routes, and persistence policies.
3.  **CLI Surface**: `packages/cli` provides the primary interface for operators, automation, and local development verification (e.g., `foundry`).
4.  **Console Surface**: The `packages/web` Next.js application, which serves as the visualization and control surface for operators.
5.  **Enterprise Integration Layer**: Connectors and policies for managed environments.

For persistence, the platform uses a hybrid model:

- **TigerBeetle**: Acts as the immutable, high-performance ledger core for all financial-grade transactions.
- **PostgreSQL (Supabase)**: Stores projections, operational metadata, audit logs, and tenant configurations.

## Repository Structure

- `packages/api` — Node.js Control Plane (Express, TypeScript).
- `packages/web` — Next.js Operator Console.
- `packages/cli` — Engineering and Foundry tooling.
- `crates` — Rust Kernel and related utilities.
- `docs` — Canonical documentation.
- `scripts` — Verification, repo hygiene, and automation.

## Quick Start

For the complete local setup guide, see **[Canonical Local Setup](SETUP.md)**.

After install, run a **deterministic onboarding checklist** (no network, no secrets):

```bash
pnpm exec tsx packages/cli/src/index.ts first-run
```

The canonical verification command to ensure your environment is correctly configured and the codebase is healthy is:

```bash
# Run the full linting, typechecking, and testing suite
pnpm verify
```

For **canonical run surface + proofpack + tenant posture** checks without the full `verify` wall clock:

```bash
pnpm run verify:moat-readiness
```

## TigerBeetle Management

Global helper scripts are available for managing the local TigerBeetle container:

- `pnpm tb:start` — Start the TigerBeetle container.
- `pnpm tb:status` — Check the ledger's health.
- `pnpm tb:logs` — Follow ledger logs.
- `pnpm tb:reset` — Wipe and reformat the ledger (for development use only).

## Documentation Hub

**Getting started:**

- [Quickstart](docs/getting-started/quickstart.md) — Fastest path to running locally
- [Canonical Local Setup](SETUP.md) — Full local development setup
- [Demo Walkthrough](docs/getting-started/DEMO_WALKTHROUGH.md) — Step-by-step demo guide
- [Starter Kits](examples/starter-kits/) — Runnable example projects
- [What Works Today](docs/getting-started/WHAT_WORKS.md) — Core functional workflows
- [Intentional Boundaries](docs/getting-started/INTENTIONAL_BOUNDARIES.md) — What's not production-ready
- [Common Setup Traps](docs/troubleshooting/SETUP_TRAPS.md) — Avoid setup issues

**Evaluation and pilot:**

- [Pilot Runbook](docs/pilot-runbook.md) — Run a pilot with go/no-go scorecard
- [Trust Packet](docs/trust-packet.md) — Security, privacy, and procurement info
- [Teardown Guide](docs/getting-started/teardown.md) — Clean removal and offboarding

**Reference:**

- [Architecture (Canonical)](docs/architecture/platform-architecture.md)
- [API Reference](docs/API_REFERENCE.md)
- [Verification Commands](docs/VERIFICATION_COMMANDS.md) — All verification commands
- [Security Policy](SECURITY.md)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the contribution workflow and quality gates. All pull requests must pass the `pnpm verify` suite.

## License

Settler is licensed under the terms found in [LICENSE](LICENSE).

## Repository Operations Standards

- Squash-only merges
- Auto-delete merged branches
- Weekly dependency update windows
- Security scanning in CI
