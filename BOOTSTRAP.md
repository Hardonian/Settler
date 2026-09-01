# Bootstrap

The fastest path from clone to running Settler.

## Prerequisites

- **Node.js** 24.x (24.15.0+) — install via [nvm](https://github.com/nvm-sh/nvm) or [nvm-windows](https://github.com/coreybutler/nvm-windows)
- **pnpm** 10.13+ — `corepack enable && corepack prepare pnpm@10.13.1 --activate`
- **Docker** — required for PostgreSQL, Redis, and TigerBeetle
- **Git**

## One-Command Bootstrap

```bash
git clone https://github.com/Hardonian/Settler.git
cd Settler
pnpm run bootstrap
```

This command:
1. Creates `.env.local` from `.env.local.example` (if missing)
2. Installs all dependencies
3. Validates the monorepo contract
4. Runs first-run environment validation

## Start Local Infrastructure

```bash
pnpm tb:start          # PostgreSQL, Redis, TigerBeetle via Docker Compose
```

## Run

```bash
pnpm dev               # Console: http://localhost:3000, API: http://localhost:4000
```

## Verify

```bash
pnpm verify:fast       # Quick: lint → typecheck → env contract
```

For the full setup reference (environment variables, troubleshooting, Rust kernel setup), see [SETUP.md](SETUP.md).
For Windows-specific instructions, see [WINDOWS_DEVELOPMENT.md](WINDOWS_DEVELOPMENT.md).
