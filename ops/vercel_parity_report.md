# Vercel ↔ Repo Parity Report

**Generated:** 2025-01-27  
**Last Updated:** 2025-01-27  
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

**Root `vercel.json`:**
```json
{
  "buildCommand": "cd packages/web && npm run build:vercel",
  "installCommand": "npm ci --prefer-offline --no-audit --omit=optional",
  "framework": "nextjs",
  "outputDirectory": "packages/web/.next",
  "regions": ["iad1", "sfo1", "lhr1", "syd1"]
}
```

**Package-level `packages/web/vercel.json`:**
```json
{
  "buildCommand": "cd ../.. && npx turbo run build --filter=@settler/web...",
  "installCommand": "npm ci --prefer-offline --no-audit --omit=optional",
  "framework": "nextjs",
  "regions": ["iad1"]
}
```

**Deployment Target:** `packages/web` (Next.js application)  
**Build Script:** `build:vercel` (defined in `packages/web/package.json`)  
**Actual Build Command Used:** Root vercel.json takes precedence, uses `cd packages/web && npm run build:vercel`

### Detected Deploy Path

**Primary Deploy Root:** Repository root  
**Build Context:** Monorepo root (all packages available)  
**Output Directory:** `packages/web/.next`  
**Install Command:** `npm ci --prefer-offline --no-audit --omit=optional` (runs at root, installs all workspaces)

### Mismatches Identified

#### 🔴 CRITICAL: Multiple Vercel Configurations

**Issue:** Both root `vercel.json` and `packages/web/vercel.json` exist with different configurations.

**Root vercel.json:**
- Build: `cd packages/web && npm run build:vercel`
- Output: `packages/web/.next`
- Regions: Multiple (iad1, sfo1, lhr1, syd1)

**packages/web/vercel.json:**
- Build: `cd ../.. && npx turbo run build --filter=@settler/web...`
- Output: Not specified (defaults to `.next`)
- Regions: Single (iad1)

**Impact:** Vercel may use different configs depending on project setup, causing inconsistent builds.

**Resolution:** Standardize on root `vercel.json` and remove or document package-level config.

#### 🟡 WARNING: Build Command Inconsistency

**Root vercel.json** uses: `cd packages/web && npm run build:vercel`  
**packages/web/vercel.json** uses: `cd ../.. && npx turbo run build --filter=@settler/web...`

**Impact:** Different build strategies may produce different outputs.

**Resolution:** CI must validate exact Vercel build command matches expectations.

#### 🟡 WARNING: Optional Script Dependencies

**Issue:** `build:vercel` script references optional `scripts/vercel-build-optimizer.js`:
```bash
(test -f ../../scripts/vercel-build-optimizer.js && node ../../scripts/vercel-build-optimizer.js || echo '⚠️  Build optimizer script not available')
```

**Impact:** Build may succeed even if optimizer script is missing, leading to inconsistent optimizations.

**Resolution:** Either make script required or remove conditional execution.

### Risks

1. **Workspace Drift:** If a workspace package is added without proper `package.json`, builds may fail silently or succeed with missing dependencies.

2. **Phantom Dependencies:** Internal `@settler/*` packages referenced but not defined will cause runtime failures.

3. **Script Ghosts:** Scripts in `package.json` pointing to non-existent files will fail at runtime.

4. **Partial Builds:** If CI doesn't validate all packages, some may be unbuilt but still referenced.

5. **Vercel Config Ambiguity:** Multiple configs may cause Vercel to use unexpected settings.

### Why This Problem Occurred

1. **Evolutionary Growth:** Configs were added incrementally without consolidation.
2. **Missing CI Enforcement:** No checks to prevent drift or validate parity.
3. **Optional Dependencies:** Scripts designed to be optional create inconsistent states.
4. **No Single Source of Truth:** Multiple configs without clear precedence.

## Remediation Status

✅ **Phase 0 Complete:** Forensics and evidence gathering  
🔄 **Phase 1 In Progress:** Permanent anti-drift guardrails  
⏳ **Phase 2 Pending:** CI as law  
⏳ **Phase 3 Pending:** Auto-merge pipeline  
⏳ **Phase 4 Pending:** Founder Ops Command Center  
⏳ **Phase 5 Pending:** Support Autopilot  
⏳ **Phase 6 Pending:** Hardening

## Next Steps

1. ✅ Complete Phase 0 (this report)
2. 🔄 Implement comprehensive integrity scripts
3. ⏳ Update CI to enforce all checks
4. ⏳ Create deployment contract documentation
5. ⏳ Build ops dashboard
6. ⏳ Implement support autopilot
7. ⏳ Add production hardening
