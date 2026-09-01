# Quickstart

The fastest path to a running Settler instance.

## Prerequisites

| Tool        | Version            | Install                                                                                           |
| ----------- | ------------------ | ------------------------------------------------------------------------------------------------- |
| **Node.js** | `24.x` (24.15.0+)  | [nvm](https://github.com/nvm-sh/nvm) or [nvm-windows](https://github.com/coreybutler/nvm-windows) |
| **pnpm**    | `10.13.1+`         | `corepack enable && corepack prepare pnpm@10.13.1 --activate`                                     |
| **Docker**  | Any recent version | [docker.com](https://www.docker.com)                                                              |
| **Git**     | Any                | —                                                                                                 |

## 1. Clone and bootstrap

```bash
git clone https://github.com/Hardonian/Settler.git
cd Settler
pnpm run bootstrap
```

The `bootstrap` command:

- Creates `.env.local` from `.env.local.example`
- Installs all dependencies
- Validates the monorepo contract
- Runs the first-run environment check

## 2. Start local infrastructure

```bash
pnpm tb:start
```

This starts TigerBeetle (ledger), PostgreSQL, and Redis via Docker Compose.

Verify services are healthy:

```bash
pnpm tb:status
```

## 3. Start the development servers

```bash
pnpm dev
```

- **Console:** `http://localhost:3000`
- **API:** `http://localhost:4000`

## 4. Verify your setup

```bash
pnpm run verify:setup
```

Or run the full suite:

```bash
pnpm verify
```

## Run a deterministic first-run check (no secrets required)

```bash
pnpm exec tsx packages/cli/src/index.ts first-run
```

This validates your environment and local fixture data without any network calls or live credentials.

## Troubleshooting

- **Permission errors on install:** Run `pnpm reinstall`
- **Port conflicts:** `PORT=3001 pnpm --filter @settler/web dev`
- **Service issues:** `pnpm tb:logs` for TigerBeetle, `pnpm db:check` for PostgreSQL
- **Doctor:** `pnpm run doctor` for a comprehensive environment diagnostic

Full reference: [SETUP.md](SETUP.md) and [Common Setup Traps](docs/troubleshooting/SETUP_TRAPS.md).
