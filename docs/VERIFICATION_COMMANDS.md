# Verification Commands

**Last Updated:** 2026-03-18  
**Purpose:** Consolidated reference for all verification commands available in Settler.

---

## Quick Verification

### Full Verification Suite

```bash
pnpm verify
```

Runs complete verification:

- Linting
- Type checking
- Build verification
- Unit tests
- Repository integrity checks

---

## Setup Verification

### Initial Setup Check

```bash
pnpm run bootstrap
```

Creates `.env.local`, installs dependencies, validates setup.

### Verify Environment Setup

```bash
pnpm run verify:setup
```

Validates:

- Environment variable presence
- Workspace integrity
- Toolchain versions

### Doctor Check

```bash
pnpm run doctor -- --first-run
```

Diagnostic tool for environment issues.

---

## Development Verification

### Start Local Stack

```bash
pnpm tb:start          # Start TigerBeetle + Postgres
pnpm dev               # Start web + API
```

### Check Service Health

```bash
pnpm tb:status         # TigerBeetle ledger health
pnpm tb:logs           # Follow ledger logs
```

### Check Database

```bash
pnpm db:check          # Database connectivity
```

---

## Testing Commands

### Run All Tests

```bash
pnpm test              # Run all tests
```

### Run CI Verification Tests

```bash
pnpm test:ci:verify    # Jest tests (banded, forceExit)
```

### Run E2E Tests

```bash
pnpm test:e2e          # Playwright E2E tests
pnpm test:smoke        # Smoke tests
```

### Run Visual Tests

```bash
pnpm test:visual       # Visual regression tests
pnpm test:visual:desktop # Desktop visual tests
pnpm test:visual:mobile  # Mobile visual tests
```

---

## Quality Gates

### Lint

```bash
pnpm lint              # Run ESLint
pnpm lint:fix          # Fix lint issues
```

### Type Check

```bash
pnpm typecheck         # Run TypeScript compiler
```

### Format Check

```bash
pnpm format:check      # Prettier format check
```

### Combined Validation

```bash
pnpm validate          # Lint + typecheck + format
pnpm check             # Lint + typecheck
```

---

## Demo and Seed

### Seed Demo Data

```bash
pnpm demo:seed         # Generate demo data
pnpm demo:seed:reset   # Clear and regenerate
```

### Generate Demo Data

```bash
pnpm demo:setup        # Setup demo environment
pnpm demo:start        # Setup + start dev servers
```

---

## Build Verification

### Build Application

```bash
pnpm build             # Build Next.js app
pnpm build:all         # Build all packages
```

---

## Database Commands

### Database Operations

```bash
pnpm db:push           # Push schema to DB
pnpm db:reset          # Reset local database
pnpm db:migrate:local  # Run local migrations
pnpm db:verify         # Verify backend contract
pnpm prisma:generate   # Generate Prisma client
pnpm prisma:status     # Check migration status
```

---

## QA Commands

### Full QA Suite

```bash
pnpm qa:all           # Routes + links + smoke + visual + a11y
```

### Individual QA Checks

```bash
pnpm qa:routes        # Generate route registry
pnpm qa:links         # Check for dead links
pnpm qa:smoke         # Run smoke tests
pnpm qa:visual        # Visual regression
pnpm qa:a11y          # Accessibility tests
pnpm qa:dom-reality   # DOM reality enforcement
```

---

## Launch Readiness

### Full Launch Check

```bash
pnpm verify:launch:readiness
```

Runs comprehensive launch verification.

---

## Troubleshooting Verification

### Repo Integrity

```bash
pnpm repo-integrity    # Verify monorepo contracts
```

### Production Parity

```bash
pnpm verify:production-parity
```

### Schema Verification

```bash
pnpm verify:schema
```

---

## Command Quick Reference

| Category    | Command                          | Purpose               |
| ----------- | -------------------------------- | --------------------- |
| **Setup**   | `pnpm run bootstrap`             | Initial setup         |
| **Setup**   | `pnpm run verify:setup`          | Verify environment    |
| **Setup**   | `pnpm run doctor -- --first-run` | Diagnostic check      |
| **Dev**     | `pnpm tb:start`                  | Start local infra     |
| **Dev**     | `pnpm dev`                       | Start dev servers     |
| **Test**    | `pnpm test`                      | Run tests             |
| **Test**    | `pnpm test:e2e`                  | Run E2E tests         |
| **Quality** | `pnpm lint`                      | Lint code             |
| **Quality** | `pnpm typecheck`                 | Type check            |
| **Quality** | `pnpm validate`                  | Full validation       |
| **Demo**    | `pnpm demo:seed`                 | Seed demo data        |
| **Build**   | `pnpm build`                     | Build application     |
| **Full**    | `pnpm verify`                    | Complete verification |

---

## Success Criteria

| Command          | Success Indicator          |
| ---------------- | -------------------------- |
| `pnpm verify`    | Exit code 0                |
| `pnpm dev`       | Web at :3000, API at :4000 |
| `pnpm tb:status` | "OK" status                |
| `pnpm demo:seed` | Demo data in DB            |

---

## Related Documentation

- [Quickstart](./docs/getting-started/quickstart.md)
- [What Works Today](./docs/getting-started/WHAT_WORKS.md)
- [Troubleshooting](./docs/troubleshooting/)
