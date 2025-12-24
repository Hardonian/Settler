# Deployment Contract

**Last Updated:** 2025-01-27  
**Status:** Active  
**Enforcement:** CI/CD Pipeline

## Purpose

This document defines the **invariants** that must hold for any code to be deployed to production. These invariants are enforced automatically by CI and cannot be bypassed.

## Core Invariants

### 1. Repository Integrity

**Invariant:** The repository structure must be consistent and valid.

**Enforced By:** `npm run repo-integrity`

**Checks:**
- ✅ All workspace folders have `package.json` (except non-JS packages)
- ✅ No workspace is referenced but missing
- ✅ No internal dependencies (`@settler/*`) are imported but not defined
- ✅ No `package.json` scripts reference missing files
- ✅ All TypeScript packages have `build` and `typecheck` contracts
- ✅ No `node_modules/` directories are committed to git

**Failure Impact:** CI blocks merge, deployment impossible.

### 2. Build Parity

**Invariant:** CI build must match Vercel build exactly.

**Enforced By:** `npm run vercel:parity`

**Checks:**
- ✅ Vercel configuration is valid and parseable
- ✅ Build command exists and is executable
- ✅ Install command matches Vercel settings
- ✅ Output directory structure is valid
- ✅ No conflicting Vercel configurations

**Failure Impact:** CI blocks merge, prevents deployment drift.

### 3. Code Quality

**Invariant:** All code must pass linting and type checking.

**Enforced By:** CI workflow `lint-and-typecheck` job

**Checks:**
- ✅ ESLint passes for all packages
- ✅ TypeScript type checking passes for all packages
- ✅ Prettier formatting is consistent

**Failure Impact:** CI blocks merge.

### 4. Test Coverage

**Invariant:** All tests must pass.

**Enforced By:** CI workflow `test` job

**Checks:**
- ✅ Unit tests pass
- ✅ Integration tests pass
- ✅ Test coverage meets threshold (70%)

**Failure Impact:** CI blocks merge.

### 5. Production Readiness

**Invariant:** Code must pass canonical production check.

**Enforced By:** `npm run check:production`

**Execution Order (MUST RUN IN ORDER):**
1. Repository integrity (`repo-integrity`)
2. Lint all packages (`lint`)
3. Type check all packages (`typecheck`)
4. Build all deployable apps (`build`)
5. Vercel parity verification (`vercel:parity`)
6. Smoke tests (`test:smoke`) - optional but recommended

**Failure Impact:** CI blocks merge.

## Deployment Flow

```
┌─────────────────┐
│  PR Created     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  CI Runs        │
│  - repo-integrity│
│  - lint         │
│  - typecheck    │
│  - test         │
│  - build        │
│  - vercel:parity│
│  - check:prod   │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
  ❌ FAIL   ✅ PASS
    │         │
    │         ▼
    │    ┌─────────────┐
    │    │ Auto-merge  │
    │    │ (if enabled)│
    │    └──────┬──────┘
    │           │
    └───────────┼───────────┐
                │           │
                ▼           ▼
         ┌──────────┐  ┌──────────┐
         │  Merge   │  │  Block   │
         │  Allowed │  │  Merge   │
         └─────┬────┘  └──────────┘
               │
               ▼
         ┌──────────┐
         │  Deploy   │
         │  to Main │
         └─────┬────┘
               │
               ▼
         ┌──────────┐
         │  Vercel   │
         │  Deploy   │
         └──────────┘
```

## CI Enforcement

### Required Checks (All Must Pass)

1. **validate-env** - Environment variable schema validation
2. **repo-integrity** - Repository structure integrity
3. **lint-and-typecheck** - Code quality checks
4. **test** - Test suite execution
5. **security-scan** - Security vulnerability scanning
6. **build** - Build all packages
7. **production-check** - Canonical production readiness
8. **smoke-test** - Smoke test verification

### Failure Behavior

- **Any required check fails** → CI status = ❌ RED
- **CI RED** → Merge blocked (GitHub branch protection)
- **Merge blocked** → Deployment impossible

### Bypass Prevention

- No manual merges allowed (branch protection)
- No force pushes to `main` (branch protection)
- No skipping CI checks (enforced by GitHub)

## Vercel Deployment Contract

### Build Command

**Root `vercel.json` takes precedence:**
```json
{
  "buildCommand": "cd packages/web && npm run build:vercel",
  "installCommand": "npm ci --prefer-offline --no-audit --omit=optional",
  "outputDirectory": "packages/web/.next"
}
```

**CI Must Validate:**
- Build command matches Vercel configuration
- Install command matches Vercel configuration
- Output directory structure matches expectations

### Deployment Triggers

- **Automatic:** Push to `main` branch
- **Manual:** Via Vercel dashboard (not recommended)
- **Preview:** Every PR gets preview deployment

### Deployment Requirements

1. ✅ CI must pass on `main` branch
2. ✅ Build must succeed locally (matches CI)
3. ✅ No environment variable drift
4. ✅ No build artifact drift

## Workspace Contract

### Package Requirements

Every workspace package (`packages/*`) must:

1. **Have `package.json`** (if JavaScript/TypeScript)
   - Must include `name` and `version`
   - Must be valid JSON

2. **Have build contract** (if TypeScript)
   - Must have `build` script (or `build:vercel`)
   - Must have `typecheck` script

3. **Have valid dependencies**
   - All `@settler/*` dependencies must exist
   - No phantom package references

4. **Have valid scripts**
   - All script file references must exist
   - No scripts pointing to missing files

### Non-Workspace Packages

Packages that are NOT part of npm workspace:
- `packages/sdk-go` (Go SDK)
- `packages/sdk-python` (Python SDK)
- `packages/sdk-ruby` (Ruby SDK)

These are excluded from workspace checks (no `package.json` required).

## Environment Variables

### Required at Build Time

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Required at Runtime

See `config/env.schema.ts` for complete list.

### Validation

- Schema validation in CI (`validate-env` job)
- Runtime validation via `requireEnvironment()` helper
- Friendly error messages (no stack traces to users)

## Auto-Merge Configuration

**Status:** Manual configuration required in GitHub

**Requirements:**
- All required CI checks must pass
- At least 1 approval (if required)
- No merge conflicts
- Branch is up to date

**Note:** Auto-merge cannot be enforced purely by code. Configure in GitHub repository settings → Branches → Branch protection rules.

## Manual Steps (Cannot Be Automated)

The following require manual configuration in GitHub/Vercel:

1. **GitHub Branch Protection**
   - Enable: "Require status checks to pass before merging"
   - Enable: "Require branches to be up to date before merging"
   - Enable: "Do not allow bypassing the above settings"

2. **Vercel Project Settings**
   - Root directory: Repository root
   - Build command: (from `vercel.json`)
   - Output directory: `packages/web/.next`
   - Install command: (from `vercel.json`)

3. **Auto-Merge (Optional)**
   - Enable in GitHub: Settings → Branches → Auto-merge

## Violation Consequences

### Repository Integrity Violation

- **Detection:** Immediate (CI fails)
- **Impact:** Merge blocked
- **Resolution:** Fix integrity issues, re-run CI

### Build Parity Violation

- **Detection:** CI `vercel:parity` check fails
- **Impact:** Merge blocked, prevents deployment drift
- **Resolution:** Align CI and Vercel configurations

### Workspace Drift

- **Detection:** `repo-integrity` check fails
- **Impact:** Merge blocked
- **Resolution:** Fix workspace structure, add missing packages/scripts

### Script Ghost Reference

- **Detection:** `repo-integrity` check fails
- **Impact:** Merge blocked
- **Resolution:** Fix script references or add missing files

## Monitoring

### CI Status

- View at: `https://github.com/YOUR_REPO/actions`
- Status badge: (add to README)

### Deployment Status

- View at: Vercel dashboard
- Deployment logs: Available in Vercel

### Health Checks

- Production: `https://settler.dev/api/health`
- Console: `https://settler.dev/api/health/console`

## Updates to This Contract

**Process:**
1. Update this document
2. Update CI workflow if needed
3. Update integrity scripts if needed
4. Test changes in PR
5. Merge after CI passes

**Version History:**
- `2025-01-27` - Initial contract definition

---

**This contract is enforced automatically. Violations will block deployment.**
