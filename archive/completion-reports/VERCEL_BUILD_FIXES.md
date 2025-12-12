# Vercel Build Hardening & Debugging Guide

## 🎯 Overview

This document contains all fixes applied to resolve Vercel build failures (SIGKILL, environment, cache issues) that occur **after** TypeScript/ESLint checks pass.

## 📋 Changes Summary

### 1. Node.js Version Locking
- **File**: `package.json`, `packages/web/package.json`
- **Change**: Locked Node.js to exact version `20.19.6` (matching `.nvmrc`)
- **Rationale**: Prevents version drift between local and Vercel environments

### 2. Build Script Optimization
- **File**: `packages/web/package.json`
- **Changes**:
  - Added `clean:build` script to remove `.next`, `dist`, `out` directories
  - Added `prebuild` hook to run cleanup before build
  - Updated `build` script with memory limit: `NODE_OPTIONS='--max-old-space-size=4096'`
  - Added `build:vercel` script with environment validation
- **Rationale**: Prevents cache corruption and SIGKILL errors from memory exhaustion

### 3. Prisma Postinstall Guard
- **File**: `scripts/vercel-prisma-postinstall.js`
- **Change**: Smart Prisma generate that skips in Vercel/CI environments
- **Rationale**: Prevents Prisma from trying to download binaries during postinstall when dependencies aren't fully resolved

### 4. Environment Variable Validation
- **File**: `scripts/vercel-env-check.js`
- **Change**: Script to validate required environment variables during build
- **Rationale**: Fails fast with clear error messages if critical env vars are missing

### 5. Next.js Config Optimization
- **File**: `packages/web/next.config.js`
- **Changes**:
  - Added `output: 'standalone'` for optimized builds
  - Enabled `compress: true`
  - Enabled `optimizeCss: true` in experimental
- **Rationale**: Reduces build output size and memory footprint

### 6. Vercel Configuration
- **File**: `vercel.json`
- **Changes**:
  - Updated build command to use `build:vercel` with env check
  - Changed `PRISMA_CLIENT_ENGINE_TYPE` from `binary` to `library` (WASM-compatible)
  - Reduced `NODE_OPTIONS` memory from 8192 to 4096 (more stable)
  - Added explicit `NODE_VERSION: "20.19.6"`
- **Rationale**: Ensures Prisma uses WASM (Edge-compatible) and matches Node version

## 🔧 Rollback Instructions

### To Revert Memory Limit Changes:
```json
// packages/web/package.json
"build": "next build"  // Remove NODE_OPTIONS
```

### To Revert Clean Script:
```json
// packages/web/package.json
// Remove "clean:build" and "prebuild" scripts
```

### To Revert Prisma Postinstall:
```json
// package.json
"postinstall": "prisma generate 2>/dev/null || true"
```

### To Revert Vercel Config:
```json
// vercel.json
"buildCommand": "npx turbo run build --filter=@settler/web...",
"PRISMA_CLIENT_ENGINE_TYPE": "binary",
"NODE_OPTIONS": "--max-old-space-size=8192"
```

## 📝 Vercel Dashboard Steps

### 1. Clear Build Cache
1. Go to Vercel Dashboard → Your Project → Settings → General
2. Scroll to "Build & Development Settings"
3. Click "Clear Build Cache"
4. Confirm the action
5. Trigger a new deployment

### 2. Verify Environment Variables
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify these **required** variables are set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (marked as **Secret**)
3. Verify these **recommended** variables:
   - `DATABASE_URL` (if using Prisma, marked as **Secret**)
   - `POSTGRES_URL` (marked as **Secret**)
   - `POSTGRES_PRISMA_URL` (marked as **Secret**)

### 3. Set Node.js Version
1. Go to Vercel Dashboard → Your Project → Settings → General
2. Scroll to "Build & Development Settings"
3. Set "Node.js Version" to `20.19.6` (or use `.nvmrc` file)
4. Save changes

### 4. Redeploy Without Cache
1. Go to Vercel Dashboard → Your Project → Deployments
2. Click the three dots (⋯) on the latest deployment
3. Select "Redeploy"
4. **Check** "Use existing Build Cache" → **Uncheck it**
5. Click "Redeploy"

## 🐛 Troubleshooting

### Build Fails with SIGKILL
**Symptoms**: Build stops abruptly with exit code 137 or SIGKILL

**Solutions**:
1. Verify `NODE_OPTIONS='--max-old-space-size=4096'` is set in `vercel.json`
2. Check Vercel build logs for memory usage warnings
3. Consider reducing `max-old-space-size` to `3072` if still failing
4. Clear build cache and redeploy

### Prisma Generate Fails
**Symptoms**: Error about Prisma client not found or binary download fails

**Solutions**:
1. Verify `PRISMA_CLIENT_ENGINE_TYPE=library` in `vercel.json`
2. Check that `scripts/vercel-prisma-postinstall.js` exists and is executable
3. Ensure Prisma schema is at `prisma/schema.prisma`
4. Add explicit `prisma generate` step in build command if needed:
   ```json
   "buildCommand": "npx prisma generate && cd packages/web && npm run build:vercel"
   ```

### Environment Variable Errors
**Symptoms**: Build fails with "Missing required environment variable"

**Solutions**:
1. Run `node scripts/vercel-env-check.js` locally to see what's missing
2. Add missing variables in Vercel Dashboard → Environment Variables
3. Ensure variables are available to **Build** environment (not just Production)
4. Mark sensitive variables (database URLs, API keys) as **Secret**

### TypeScript Errors After These Changes
**Symptoms**: TypeScript compilation fails

**Solutions**:
1. These changes should NOT introduce TypeScript errors
2. If errors appear, verify `skipLibCheck: false` in `tsconfig.json`
3. Run `npm run typecheck` locally before deploying
4. Check that all previous TypeScript fixes are still in place

## ✅ Verification Checklist

Before deploying, verify:

- [ ] Node.js version is locked to `20.19.6` in `package.json` and `vercel.json`
- [ ] `NODE_OPTIONS` is set to `--max-old-space-size=4096` in build scripts
- [ ] `PRISMA_CLIENT_ENGINE_TYPE=library` in `vercel.json` (WASM-compatible)
- [ ] All required environment variables are set in Vercel Dashboard
- [ ] Build cache has been cleared in Vercel Dashboard
- [ ] `scripts/vercel-env-check.js` runs successfully
- [ ] `scripts/vercel-prisma-postinstall.js` exists and is executable
- [ ] `packages/web/.next` directory is cleaned before build (via `prebuild`)

## 📊 Expected Build Output

A successful build should show:
```
🔍 Vercel Environment Variable Check
✅ All checks passed!
🔧 Running Prisma generate... (if needed)
✅ Prisma generate completed successfully
> Cleaning build cache directories...
> Building Next.js application...
✓ Compiled successfully
```

## 🚨 Emergency Rollback

If build still fails after all fixes:

1. **Revert to minimal build**:
   ```json
   // vercel.json
   "buildCommand": "cd packages/web && next build"
   ```

2. **Disable all optimizations**:
   ```json
   // packages/web/next.config.js
   // Remove output: 'standalone'
   // Remove experimental.optimizeCss
   ```

3. **Use Build Output API fallback** (last resort):
   - Create `vercel-output-build.json` with static export configuration
   - This forces Vercel to treat the project as static

## 📞 Support

If issues persist:
1. Check Vercel build logs for specific error messages
2. Compare local build (`npm run build`) with Vercel build
3. Verify all environment variables match between local `.env.local` and Vercel Dashboard
4. Check Vercel status page for platform issues
