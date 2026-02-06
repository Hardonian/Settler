# Evidence Log

This log captures commands executed and observed results during the Reality Pass.

## Phase 0 — Baseline (Observed)

### Install

```bash
pnpm install
```

**Result:** Success. Prisma generate completed. Warnings about ignored build scripts and npm config keys were emitted.

### Lint

```bash
pnpm run lint
```

**Result:** Completed with warnings (no errors). Examples include unused variables in API and web packages, and console usage warnings.

### Typecheck

```bash
pnpm run typecheck
```

**Result:** Success. Turbo warned about missing outputs for `@settler/api#typecheck` and `@settler/cli#typecheck`.

### Unit Tests

```bash
pnpm run test
```

**Result:** Failed. `@jobforge/sdk-ts` had no test files and exited with code 1.

### Build

```bash
pnpm run build
```

**Result:** Success. Next.js build completed with warnings for missing environment variables and a Node 24 requirement note from the Next build output.

### Smoke Test

```bash
pnpm run test:smoke
```

**Result:** Failed. Requests to `http://localhost:3000` returned `ECONNREFUSED` because no server was running.

## Remediation Checks (Post-fix)

### JobForge SDK Unit Tests

```bash
pnpm --filter @jobforge/sdk-ts test
```

**Result:** Passed (1 test file, 2 tests).
