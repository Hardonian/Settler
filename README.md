# Settler

Settler is a deterministic reconciliation platform for teams that need reproducible runs, replayable outcomes, and operator-visible evidence.

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

## Getting Started

For the complete local setup guide, see **[Canonical Local Setup](../SETUP.md)**.

The canonical verification command to ensure your environment is correctly configured and the codebase is healthy is:

```bash
# Run the full linting, typechecking, and testing suite
pnpm verify
```

## TigerBeetle Management

Global helper scripts are available for managing the local TigerBeetle container:

- `pnpm tb:start` — Start the TigerBeetle container.
- `pnpm tb:status` — Check the ledger's health.
- `pnpm tb:logs` — Follow ledger logs.
- `pnpm tb:reset` — Wipe and reformat the ledger (for development use only).

## Documentation Hub

- [Architecture (Canonical)](docs/architecture/platform-architecture.md)
- [Canonical Local Setup](../SETUP.md)
- [Security Policy](SECURITY.md)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the contribution workflow and quality gates. All pull requests must pass the `pnpm verify` suite.

## License

Settler is licensed under the terms found in [LICENSE](LICENSE).