# Vercel ↔ Repo Parity Report

**Generated:** 2025-01-27  
**Objective:** Eliminate drift between GitHub repo and Vercel deployments

## Executive Summary

This report documents the current state of the repository, identifies drift sources, and provides a remediation plan to ensure Vercel deployments are deterministic and aligned with the repository state.

## Current State Analysis

### Repository Structure

**Monorepo Type:** npm workspaces  
**Workspace Pattern:** `packages/*`  
**Root Package Manager:** npm@10.2.4  
**Node Version Requirement:** >=24.0.0

### Workspace Packages

All workspace packages have valid `package.json` files:

1. ✅ `packages/adapters` - Payment adapter implementations
2. ✅ `packages/api` - Backend API server
3. ✅ `packages/cli` - Command-line interface
4. ✅ `packages/edge-ai-core` - Edge AI core functionality
5. ✅ `packages/edge-node` - Edge node services
6. ✅ `packages/protocol` - Shared protocol definitions
7. ✅ `packages/react-settler` - React components library
8. ✅ `packages/sdk` - TypeScript SDK
9. ✅ `packages/types` - Shared TypeScript types
10. ✅ `packages/web` - Next.js web application (Vercel deployment target)

**Non-workspace packages** (not part of npm workspace, correctly excluded):
- `packages/sdk-go` - Go SDK (no package.json, expected)
- `packages/sdk-python` - Python SDK (no package.json, expected)
- `packages/sdk-ruby` - Ruby SDK (no package.json, expected)

### Vercel Configuration

**Current `vercel.json`:**
```json
{
  "buildCommand": "cd packages/web && npm run build:vercel",
  "installCommand": "npm ci --prefer-offline --no-audit --omit=optional",
  "framework": "nextjs",
  "regions": ["iad1", "sfo1", "lhr1", "syd1"]
}
```

**Deployment Target:** `packages/web` (Next.js application)  
**Build Script:** `build:vercel` (defined in `packages/web/package.json`)

### Critical Issues Identified

#### 🔴 CRITICAL: Committed node_modules

**Issue:** `node_modules` directories are committed to the repository.

**Locations:**
- `packages/web/node_modules/` - Contains production dependencies
- `packages/api/node_modules/` - Contains production dependencies

**Impact:**
- Repository bloat (large file size)
- Potential security vulnerabilities in committed dependencies
- CI/CD inconsistencies (local vs CI environments)
- Git merge conflicts on dependency updates
- Violates npm best practices

**Root Cause:** `.gitignore` includes `**/node_modules` but these were committed before the rule was added.

#### 🟡 WARNING: Workspace Integrity

**Status:** ✅ All workspace packages have valid `package.json` files  
**Status:** ✅ All internal dependencies (`@settler/*`) are properly declared  
**Status:** ✅ No phantom package references detected

#### 🟡 WARNING: Script References

**Status:** ✅ All scripts referenced in root `package.json` exist:
- `scripts/doctor.ts` ✅
- `scripts/check-production-readiness.ts` ✅
- `scripts/smoke-test.ts` ✅
- All other referenced scripts exist ✅

#### 🟢 INFO: CI Configuration

**Current CI Workflow:** `.github/workflows/ci.yml`

**Existing Checks:**
- ✅ Environment validation
- ✅ Lint and typecheck
- ✅ Tests
- ✅ Security scans
- ✅ Build verification

**Missing Checks:**
- ❌ No check for committed `node_modules`
- ❌ No workspace integrity validation
- ❌ No explicit Vercel build parity check
- ❌ No smoke test in CI (exists but not enforced)

### Suspected Drift Causes

1. **Committed node_modules**
   - Local development may use committed dependencies
   - CI may use different dependency versions
   - Vercel may use cached dependencies

2. **Missing CI Guardrails**
   - No enforcement of "no node_modules" rule
   - No workspace integrity checks
   - No explicit Vercel build simulation

3. **Vercel Configuration Ambiguity**
   - Build command uses relative paths (`cd packages/web`)
   - No explicit root directory setting
   - No output directory specification

4. **Script Dependencies**
   - Some scripts reference optional files (e.g., `vercel-build-optimizer.js`)
   - Scripts may fail silently in CI

## Remediation Plan

### Phase 1: Remove Committed node_modules

1. Remove `packages/web/node_modules/`
2. Remove `packages/api/node_modules/`
3. Verify `.gitignore` rules are comprehensive
4. Add CI check to prevent future commits

### Phase 2: Lock Vercel Configuration

1. Update `vercel.json` with explicit settings:
   - Root directory (if needed)
   - Output directory
   - Build command (already correct)
   - Framework (already set)

2. Ensure build command is deterministic:
   - Use absolute paths where possible
   - Remove optional script dependencies
   - Add explicit error handling

### Phase 3: Enhance CI Gate

1. Add "no node_modules" check
2. Add workspace integrity validation
3. Add explicit Vercel build simulation
4. Add smoke test enforcement
5. Make checks fail-fast (no warnings-only pass)

### Phase 4: Production Hardening

1. Add error boundaries to prevent 500 errors
2. Add route-level guards
3. Validate environment variables at runtime
4. Ensure graceful degradation

## Verification Criteria

After remediation, the following must be true:

- ✅ No `node_modules` directories in repository
- ✅ CI passes all checks
- ✅ Vercel build matches local build
- ✅ Smoke tests pass
- ✅ No workspace integrity issues
- ✅ All scripts execute successfully

## Next Steps

1. Execute Phase 1: Remove node_modules
2. Execute Phase 2: Lock Vercel config
3. Execute Phase 3: Enhance CI
4. Execute Phase 4: Production hardening
5. Verify all checks pass
6. Document production readiness criteria
