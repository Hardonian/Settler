# Getting Started: Local Development Setup

This is the canonical guide for setting up Settler for local development. For the definitive setup sequence, see [SETUP.md](../SETUP.md).

## Quick Reference

For the fastest path to a working screen, follow the [Canonical Install/Run Order](#canonical-installrun-order) below.

## 1. Prerequisites

- **Node.js:** Version `24.x` (24.12.0 recommended). We recommend using a version manager like `nvm`.
- **pnpm:** Version `10.13` or higher.
- **Docker:** Required for running local instances of TigerBeetle and Postgres.
- **Doppler (Recommended):** For secret management.

## 2. Initial Setup

Follow the [Canonical Install/Run Order](#canonical-installrun-order) detailed in [SETUP.md](../SETUP.md).

## 3. Start Local Infrastructure

This command uses Docker to start local instances of TigerBeetle and a Postgres database.

```bash
pnpm tb:start
```

- **PostgreSQL** will be available on port `5432`.
- **TigerBeetle** will be available on its default port.

To check the status of the local ledger: `pnpm tb:status`
To follow ledger logs: `pnpm tb:logs`

## 4. Verify Setup

Run the `settler:doctor` command to check that your environment, database connections, and configurations are correct.

```bash
pnpm settler:doctor -- --first-run
```

The doctor script will guide you through resolving any detected issues.

## 5. Running the Application

### Development Mode (Hot-Reload)

To run the entire stack (Next.js web app and Node.js API) with hot-reloading:

```bash
pnpm dev
```

- The Web Console will be available at `http://localhost:3000`.
- The API will be available at `http://localhost:4000`.

### Production Mode (Local)

To build and run the application in a production-like mode:

```bash
pnpm build
pnpm start
```

## 6. Verification and Testing

After setup, run the comprehensive verification suite to ensure everything is working correctly.

```bash
pnpm verify
```

This command will:
- Lint the codebase
- Run the TypeScript compiler
- Execute the full test suite (unit, integration)
- Verify repository integrity and boundaries

For a faster, iterative check during development:
```bash
pnpm check
```

## Next Steps

- **What Works Today:** [WHAT_WORKS.md](./WHAT_WORKS.md) - Core functional workflows
- **Demo Walkthrough:** [DEMO_WALKTHROUGH.md](./DEMO_WALKTHROUGH.md) - Step-by-step demo
- **Verification:** [VERIFICATION_COMMANDS.md](../VERIFICATION_COMMANDS.md) - All verification commands
- **Setup Traps:** [SETUP_TRAPS.md](../troubleshooting/SETUP_TRAPS.md) - Avoid common issues
- **Intentional Boundaries:** [INTENTIONAL_BOUNDARIES.md](./INTENTIONAL_BOUNDARIES.md) - What's not production-ready
- **Architecture Overview:** [`docs/architecture/platform-architecture.md`](../architecture/platform-architecture.md)
- **Using the CLI:** [`packages/cli/README.md`](../../packages/cli/README.md)
- **API Reference:** [`docs/api/README.md`](../api/README.md)
- **Starter Kits:** [`examples/starter-kits/`](../../examples/starter-kits/) - Runnable example projects
- **Pilot Runbook:** [`docs/pilot-runbook.md`](../pilot-runbook.md) - Run a pilot with go/no-go scorecard
- **Teardown Guide:** [`teardown.md`](./teardown.md) - Clean removal and offboarding