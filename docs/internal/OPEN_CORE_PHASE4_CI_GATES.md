# PHASE 4: Vercel Build Guarantee via Required Checks

**Date**: 2025-01-28  
**Status**: ✅ Complete

## Overview

Implemented comprehensive CI gates that must pass before merges are allowed. These gates ensure:
1. Code quality (lint, typecheck, tests)
2. Build success
3. Classification compliance
4. Smoke test pass (no 500 errors)
5. Anti-leak protection

## Required CI Checks

### 1. Standard CI (`ci.yml`)

**Workflow**: `.github/workflows/ci.yml`

**Jobs**:
- `validate-env`: Environment variable schema validation
- `lint-and-typecheck`: ESLint, Prettier, TypeScript checks
- `test`: Unit tests with coverage threshold (70%)
- `security-scan`: npm audit, Snyk, Semgrep
- `build`: Full build verification

**Status**: ✅ Already implemented

**Required for**: All PRs to main/develop

### 2. Classification Check (`classify.yml`)

**Workflow**: `.github/workflows/classify.yml`

**Jobs**:
- `classify`: Runs `pnpm classify:strict`

**Checks**:
- ✅ No SECRET_RISK files detected
- ✅ No OSS_PUBLIC importing proprietary/internal
- ✅ No INTERNAL_BUSINESS in public allowlist paths
- ✅ No violations detected

**Status**: ✅ Implemented

**Required for**: All PRs to main/develop

**Artifacts**:
- `classification-report.json`
- `classification-summary.md`

### 3. Smoke Tests (`smoke.yml`)

**Workflow**: `.github/workflows/smoke.yml`

**Jobs**:
- `smoke`: Runs smoke tests against deployment/preview

**Tests**:
- ✅ `GET /` returns 200 (or expected redirect), never 500
- ✅ `GET /pricing` returns 200, never 500
- ✅ `GET /console` returns 200 (with auth prompt), never 500
- ✅ `GET /api/health/console` returns 200
- ✅ `GET /api/status/health` returns 200

**Status**: ✅ Implemented

**Required for**: 
- Push to main (tests against production)
- PRs (tests against preview if available)

**Note**: Preview URLs must be configured for PR smoke tests.

### 4. Build Safety Validation

**Scripts**: Already exist in `package.json`

**Commands**:
- `validate:eslint-config`
- `validate:build-safety`
- `validate:nextjs`
- `validate:lint-config`
- `validate:comprehensive`

**Status**: ✅ Already implemented

**Required for**: All builds

## Branch Protection Rules

### Required Checks (Must Pass)

1. ✅ `ci / lint-and-typecheck`
2. ✅ `ci / test`
3. ✅ `ci / build`
4. ✅ `classify / classify`
5. ✅ `smoke / smoke` (on main branch)

### Optional Checks (Can Fail)

- `ci / security-scan` (warnings only)
- `ci / load-test` (only on main)

## Vercel Build Parity Script

**Script**: `pnpm vercel:build`

**Purpose**: Local script that mirrors Vercel build process for testing.

**Implementation**:
```json
{
  "scripts": {
    "vercel:build": "cd packages/web && npm run build:vercel"
  }
}
```

**Status**: ✅ Already exists as `build:vercel` in `packages/web/package.json`

## Environment Variable Validation

**Script**: `scripts/check-env.ts` (already exists)

**Purpose**: Validates required environment variables are present.

**Usage**:
```bash
pnpm validate:env production
pnpm validate:env:build
pnpm validate:env:runtime
```

**Status**: ✅ Already implemented

**Required for**: 
- Build validation
- Runtime validation
- CI checks

## Smoke Test Implementation

**Script**: `scripts/smoke-test.ts` (already exists)

**Routes Tested**:
- `/` - Landing page
- `/pricing` - Pricing page
- `/docs` - Documentation
- `/status` - Status page
- `/api/status/health` - Health check
- `/api/status` - Status API
- `/api/health/console` - Console health check
- `/console` - Console (unauthenticated, should return 200 not 500)
- `/dashboard` - Dashboard (protected, may redirect or 401)

**Success Criteria**:
- All routes return expected status codes
- No 500 errors
- Graceful handling of unauthenticated access

**Status**: ✅ Already implemented

## CI Gate Summary

### Pre-Merge Gates

| Gate | Workflow | Required | Status |
|------|----------|----------|--------|
| Lint & Typecheck | `ci.yml` | ✅ Yes | ✅ Implemented |
| Tests | `ci.yml` | ✅ Yes | ✅ Implemented |
| Build | `ci.yml` | ✅ Yes | ✅ Implemented |
| Classification | `classify.yml` | ✅ Yes | ✅ Implemented |
| Smoke Tests | `smoke.yml` | ✅ Yes (main) | ✅ Implemented |
| Security Scan | `ci.yml` | ⚠️ Optional | ✅ Implemented |

### Post-Merge Gates

| Gate | Workflow | Required | Status |
|------|----------|----------|--------|
| Production Deploy | `deploy-production.yml` | ✅ Yes | ✅ Exists |
| Preview Deploy | `deploy-preview.yml` | ✅ Yes | ✅ Exists |
| Smoke Tests (Prod) | `smoke.yml` | ✅ Yes | ✅ Implemented |

## Vercel Configuration

**File**: `vercel.json`

**Build Command**: `cd packages/web && npm run build:vercel`

**Root Directory**: Not set (defaults to repo root)

**Environment Variables**: Configured in Vercel dashboard

**Status**: ✅ Already configured

**Note**: Vercel must remain connected to PRIVATE canonical repository only.

## Required Check Configuration

To enforce these checks as required:

1. Go to GitHub repository settings
2. Navigate to "Branches" → "Branch protection rules"
3. Add rule for `main` branch
4. Enable "Require status checks to pass before merging"
5. Add required checks:
   - `ci / lint-and-typecheck`
   - `ci / test`
   - `ci / build`
   - `classify / classify`
   - `smoke / smoke`

## Verification Commands

### Local Testing

```bash
# Run all CI checks locally
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm classify:strict
pnpm test:smoke

# Vercel build parity
cd packages/web && npm run build:vercel
```

### CI Simulation

```bash
# Full CI pipeline
pnpm validate:all
pnpm classify:strict
pnpm test:smoke
```

## Error Handling

### Missing Environment Variables

**Error**: Clear error message indicating missing env vars
**Action**: Update Vercel environment variables

### Classification Violations

**Error**: Classification report shows violations
**Action**: Fix violations or reclassify files

### Smoke Test Failures

**Error**: Route returns 500 or unexpected status
**Action**: Fix route handler, check error logs

### Build Failures

**Error**: Build command fails
**Action**: Check build logs, fix compilation errors

## Next Steps

- **PHASE 5**: Mirror publish pipeline
- **PHASE 6**: Anti-leak tripwires
- **PHASE 7**: Backup/rollback playbooks

---

**Implementation Complete**: 2025-01-28  
**Next Phase**: PHASE 5 - Mirror Dry-Run + Publish Pipeline
