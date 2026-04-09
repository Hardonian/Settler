# Phase 5: Script / Command / CI Truth Alignment Plan

## Executive Summary

The Settler monorepo has 300+ scripts across root and packages with significant duplication, inconsistencies, and room for simplification. This plan addresses these issues systematically.

## Current State Analysis

### Issues Identified

#### 1. Engine/Version Mismatch

- **Root**: `engines.node >=24.0.0 <25.0.0`
- **packages/web**: `engines.node >=22.0.0 <25.0.0` (allows Node 22, but root requires 24+)
- **.nvmrc**: `24.12.0` ✓

#### 2. Duplicate/Competing Scripts

| Script                                                                     | Issue                                      |
| -------------------------------------------------------------------------- | ------------------------------------------ |
| `doctor` + `doctor:old` + `settler:doctor`                                 | Redundant - all call same script           |
| `suite-doctor` + `suite-doctor:fast` + `suite-doctor:json`                 | Similar purpose, unclear when to use which |
| `demo:seed` + `demo:setup` + `demo:reset` + `demo:start`                   | Overlapping functionality                  |
| `verify:setup` + `verify:launch:readiness` + `verify:fast` + `verify:full` | Multiple verification levels, confusing    |
| `test:ci:verify` + `test:ci:verify:open-handles`                           | One is variant of other                    |

#### 3. Missing Root-Level Happy Path Commands

- No simple `install` command (only `pnpm:ci:install`)
- No `migrate` at root level
- No `seed` at root level (only `demo:seed`)

#### 4. NPM vs PNPM Inconsistencies

- Root uses `pnpm run` consistently
- But `operator-mode:daily` in root uses `npm run` instead of `pnpm run`
- `tb:*` scripts use `pnpm` to cd into packages/api

#### 5. Scripts with Fallback Error Handling

- `validate:eslint-config` - gracefully handles missing script
- `postinstall` - gracefully handles missing script
- Many others assume scripts exist

#### 6. Stale/Obscure Scripts

- `doctor:old` - explicitly labeled as old
- `verify:all` - duplicate of `validate:all`
- Some verify scripts may reference deprecated functionality

---

## Proposed Changes

### Phase 5.1: Fix Version Mismatch

**File**: `packages/web/package.json`

- Change `engines.node >=22.0.0 <25.0.0` to `engines.node >=24.0.0 <25.0.0`

### Phase 5.2: Consolidate Duplicate Scripts

**File**: `package.json` (root)

**Remove/Consolidate**:

1. Remove `doctor:old` (alias to `doctor`)
2. Remove `verify:all` (duplicate of `validate:all`)
3. Consolidate `suite-doctor*` into single command with flags

**Rename for clarity**:

1. `doctor` → keep, but mark as primary
2. `suite-doctor` → keep as-is (different purpose)

### Phase 5.3: Add Missing Happy Path Commands

**File**: `package.json` (root)

Add these commands:

```json
{
  "install": "pnpm install",
  "migrate": "pnpm run db:migrate:local",
  "seed": "pnpm run demo:seed"
}
```

### Phase 5.4: Fix NPM vs PNPM Inconsistencies

**File**: `package.json` (root)

Fix these scripts:

- `operator-mode:daily`: Change `npm run` to `pnpm run`

### Phase 5.5: Clean Up Stale Scripts

**File**: `package.json` (root)

Mark for potential deprecation (comment in docs, not delete):

- Scripts that reference removed functionality
- Legacy verify scripts without clear purpose

### Phase 5.6: Standardize Script Patterns

Ensure all scripts follow consistent patterns:

- Use `pnpm run` for calling other scripts
- Use `npx` or `pnpm exec` for calling workspace binaries
- Avoid mixing npm/pnpm

---

## Recommended Command Surface

After cleanup, the recommended commands for developers:

| Command          | Purpose                                             |
| ---------------- | --------------------------------------------------- |
| `pnpm install`   | Install dependencies (or use `install` alias)       |
| `pnpm dev`       | Start development servers                           |
| `pnpm doctor`    | Run diagnostics                                     |
| `pnpm verify`    | Full verification (lint + typecheck + build + test) |
| `pnpm test`      | Run tests                                           |
| `pnpm build`     | Build all packages                                  |
| `pnpm migrate`   | Run database migrations                             |
| `pnpm seed`      | Seed demo data                                      |
| `pnpm lint`      | Lint code                                           |
| `pnpm typecheck` | Type check                                          |

---

## Scripts to Keep (Consolidated View)

### Core Development

- `dev` - Start dev servers
- `build` - Build packages
- `build:all` - Build all (including excluded packages)

### Testing

- `test` - Run all tests
- `test:e2e` - Run E2E tests
- `test:smoke` - Run smoke tests

### Verification

- `verify` - Full verification
- `verify:fast` - Fast verification
- `verify:security` - Security verification

### Quality

- `lint` - Lint code
- `lint:fix` - Fix lint issues
- `typecheck` - Type check
- `format` - Format code
- `format:check` - Check formatting

### Database

- `db:push` - Push schema
- `db:reset` - Reset database
- `db:migrate:local` - Run migrations locally
- `db:migrate:prod` - Run migrations in production

### Operations

- `doctor` - Run diagnostics
- `demo:seed` - Seed demo data
- `demo:start` - Start demo

---

## Implementation Order

1. **Quick Wins** (5-10 min):
   - Fix `packages/web` engine version
   - Add `install`, `migrate`, `seed` aliases
   - Fix npm vs pnpm in `operator-mode:daily`

2. **Script Cleanup** (15-30 min):
   - Remove `doctor:old`
   - Remove `verify:all`
   - Consolidate documented duplicates

3. **Documentation** (10-15 min):
   - Update SETUP.md with recommended commands
   - Document the command surface

---

## Files to Modify

1. `packages/web/package.json` - Fix engines.node
2. `package.json` (root) - Add aliases, remove duplicates, fix inconsistencies
3. `SETUP.md` - Update documentation (optional)

---

## Risk Assessment

- **Low Risk**: Version fix ensures consistency
- **Low Risk**: Adding aliases doesn't break existing scripts
- **Medium Risk**: Removing duplicate scripts - must verify no external dependencies
- **Recommendation**: Use deprecation comments instead of deletion for obscure scripts
