# Settler Canonical Local Setup

This document defines the single source of truth for setting up Settler for local development. All other documentation should conform to this sequence.

## Canonical Install/Run Order

### 1. Prerequisites

Ensure these are installed before beginning:

- **Node.js:** Version `24.x` (24.15.0 pinned in `.nvmrc`). Use nvm to install.
- **pnpm:** Version `10.13` or higher (corepack enabled)
- **Docker:** Required for running local instances of TigerBeetle and Postgres
- **Rust:** Optional — only needed for kernel development (`crates/`). Install via [rustup](https://rustup.rs/).
- **Doppler (Recommended):** For secret management (optional but recommended)

> **Windows users:** See [WINDOWS_DEVELOPMENT.md](WINDOWS_DEVELOPMENT.md) for platform-specific setup.

### 2. Initial Setup

Follow these steps in order:

#### Step 1: Clone the repository

```bash
git clone https://github.com/Hardonian/Settler.git
cd Settler
```

#### Step 2: Bootstrap environment

Run the canonical bootstrap command:

```bash
pnpm run bootstrap
```

This command performs:

1. Creates `.env.local` from `.env.local.example` (if missing)
2. Installs dependencies (`pnpm install`)
3. Validates monorepo contract (`pnpm run repo-integrity`)
4. Runs first-run environment validation (`pnpm run doctor -- --skip-pipeline --first-run`)

### 3. Start Local Infrastructure

The bootstrap process does not start local services. Start them explicitly:

```bash
pnpm tb:start
```

This starts:

- **PostgreSQL** on port `5432` - Main relational database
- **TigerBeetle** on port `4300` - Financial ledger for double-entry accounting
- **Redis** on port `6379` - Caching and queue backend (optional for basic dev)

Verify services are healthy:

- `pnpm tb:status` - Check ledger health
- `pnpm tb:logs` - Follow ledger logs (optional)

### 4. Verify Setup

Run comprehensive setup verification:

```bash
pnpm run verify:setup
pnpm run doctor -- --skip-pipeline --first-run
```

These commands validate:

- Environment variable presence and validity
- Workspace integrity
- Toolchain versions (Node, pnpm)
- Optional kernel health (if enabled)

### 5. Run the Application

Choose your preferred mode:

#### Development Mode (Hot-Reload - Recommended)

```bash
pnpm dev
```

- Web Console: `http://localhost:3000`
- API Server: `http://localhost:4000`

#### Production Mode (Local)

```bash
pnpm build
pnpm start
```

### 6. Verification and Testing

After setup, run the comprehensive verification suite:

```bash
pnpm verify
```

This includes:

- Linting
- Type checking
- Build verification
- Test suite execution
- Repository integrity checks

### 7. Verify Demo Data (Optional)

For interactive playground functionality, generate demo data:

```bash
pnpm demo:seed
```

Verify:

```bash
ls demo/data/  # Should show JSON files
curl http://localhost:4000/api/v1/playground/demo-dataset  # Requires running API
```

## Time-to-First-Working-Screen

The minimal path to see a working Settler console is:

```bash
# One-time setup
git clone https://github.com/Hardonian/Settler.git
cd Settler
pnpm run bootstrap
pnpm tb:start

# Start development servers
pnpm dev
```

Then navigate to `http://localhost:3000` in your browser.

## Environment Variables

The bootstrap process creates a starter `.env.local` file. For a first run, the default values are sufficient to see the working screen. For full functionality, refer to `.env.example` and configure:

### Required for Basic Operation

- `NEXT_PUBLIC_SUPABASE_URL` (can use placeholder for initial screen)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (can use placeholder for initial screen)
- `DATABASE_URL` (or individual DB\_\* variables)

### Required for Full Functionality

- `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- `JWT_SECRET` (minimum 32 characters)
- `ENCRYPTION_KEY` (exactly 32 characters)
- `REDIS_URL` (for production features)
- `RESEND_API_KEY` (for email functionality)

## Troubleshooting

### EACCES Permission Errors

If `pnpm install` fails with EACCES permission errors:

```bash
# Use the dedicated reinstall command (recommended)
pnpm reinstall

# If that doesn't work, force clear cache
pnpm reinstall:force
```

For more troubleshooting, see [Common Setup Traps](docs/troubleshooting/SETUP_TRAPS.md).

If the bootstrap process fails:

1. Run `pnpm run doctor` to diagnose issues
2. Check that Docker is running and accessible
3. Verify Node.js and pnpm versions match requirements
4. Ensure `.env.local` was created correctly

For service-specific issues:

- TigerBeetle: `pnpm tb:status` and `pnpm tb:logs`
- PostgreSQL: Verify connection with `pnpm db:check`

## Related Documentation

- [Environment Variable Matrix](docs/setup/env-matrix.md) - Complete reference
- [What Works Today](docs/getting-started/WHAT_WORKS.md) - Core functional workflows
- [Intentional Boundaries](docs/getting-started/INTENTIONAL_BOUNDARIES.md) - Production readiness
- [Demo Walkthrough](docs/getting-started/DEMO_WALKTHROUGH.md) - Step-by-step demo guide
- [Verification Commands](docs/VERIFICATION_COMMANDS.md) - All verification commands
- [Common Setup Traps](docs/troubleshooting/SETUP_TRAPS.md) - Avoid setup issues
- [Quickstart Guide](docs/getting-started/quickstart.md) - Fastest path to demo
- [Doctor Script Reference](docs/getting-started/doctor.md) - Diagnostic tool details
