# Verification Commands

This document contains a list of commands necessary to verify the environment, ensure tests are passing, and validate that enterprise constraints are holding.

## 1. Environment Health Check

Before pushing any code, run the doctor script to verify the toolchain, DB connectivity, and workspace health.

```bash
pnpm run doctor
```

For machine-readable JSON:

```bash
pnpm run doctor -- --json
```

## 2. Populate Demo Data

To test the operator UI or API locally, seed the database with realistic demo data.

```bash
pnpm demo:seed
```

This is idempotent and will write both to the Database and to `demo/data/*.json`.
To reset and re-seed from scratch:

```bash
pnpm demo:reset
```

## 3. Type Checking

Ensure the whole monorepo compiles and respects strict TypeScript boundaries.

```bash
pnpm tsc:check
```

## 4. Run Unit & Contract Tests

We use Vitest for the entire monorepo.

```bash
pnpm test
```

## 5. Build Verification

Verify that the `api` and `web` projects can successfully output production builds.

```bash
pnpm build
```
