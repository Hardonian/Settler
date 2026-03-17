# Getting Started: Local Development Setup

This is the canonical guide for setting up Settler for local development.

## 1. Prerequisites

- **Node.js:** Version `22.0` or higher. We recommend using a version manager like `nvm`.
- **pnpm:** Version `10.13` or higher.
- **Docker:** Required for running local instances of TigerBeetle and Postgres.
- **Doppler (Recommended):** For secret management.

## 2. Initial Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/settler/settler.git
    cd settler
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

3.  **Set up environment variables:**
    Copy the example `.env` file. For a first run, the defaults are sufficient.
    ```bash
    cp .env.local.example .env.local
    ```
    For production or advanced configurations, refer to the [Environment Variable Matrix](docs/setup/env-matrix.md).

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

- **Architecture Overview:** [`docs/architecture/platform-architecture.md`](../architecture/platform-architecture.md)
- **Using the CLI:** [`packages/cli/README.md`](../../packages/cli/README.md)
- **API Reference:** [`docs/api/README.md`](../api/README.md)
