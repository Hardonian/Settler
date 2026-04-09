# Build Safety Guide

## Overview

This document outlines the proactive safeguards implemented to prevent build failures, particularly in Vercel deployments where the `scripts/` directory is excluded.

## Issues Fixed

### 1. ESLint Config Dependencies

**Problem**: Packages extending the root ESLint config (which includes `prettier`) were missing `eslint-config-prettier` dependency.

**Fixed Packages**:

- `@settler/web` ✅
- `@settler/sdk` ✅
- `@settler/adapters` ✅
- `@settler/cli` ✅
- `@settler/api` ✅

**Solution**: Added `eslint-config-prettier: ^10.1.8` to devDependencies of all affected packages.

### 2. Script References in Build Scripts

**Problem**: Build scripts referenced files in `scripts/` directory which is excluded by `.vercelignore`.

**Fixed**:

- `packages/web/build:vercel` - Made script optional with existence check
- Root `package.json` scripts - Made optional where appropriate

**Pattern Used**:

```bash
test -f scripts/script.js && node scripts/script.js || echo '⚠️  Script not available'
```

## Validation Tools

### Build Safety Validator

**Location**: `scripts/validate-build-safety.ts`

**Checks**:

- Scripts referenced but not available (especially in Vercel)
- Missing ESLint config dependencies
- Packages extending root ESLint config without required dependencies
- Config files that might not exist
- Build scripts with hard dependencies on ignored files

**Usage**:

```bash
npm run validate:build-safety
```

**Integration**:

- ✅ Pre-commit hook (`.husky/pre-commit`)
- ✅ CI pipeline (`.github/workflows/ci.yml`)
- ✅ Build Guardian (`scripts/build-guardian.ts`)

### ESLint Config Validator

**Location**: `scripts/validate-eslint-config.ts`

**Checks**:

- All ESLint configs in monorepo
- Validates that all `extends` configs have corresponding dependencies
- Reports missing dependencies with installation commands

**Usage**:

```bash
npm run validate:eslint-config
```

## Prevention Layers

### 1. Pre-Commit Hook

Runs before every commit:

- ESLint config validation
- Build safety validation
- TypeScript typecheck

### 2. CI Pipeline

Runs on every PR/push:

- ESLint config validation
- Build safety validation
- Full lint and typecheck

### 3. Pre-Build Validation

Runs before every build:

- TypeScript typecheck
- ESLint linting
- (ESLint config validation skipped in Vercel - scripts not available)

### 4. Build Guardian

Comprehensive health checks:

- Prisma client generation
- TypeScript configs
- Package.json validation
- Vercel config
- Environment files
- Dependencies
- ESLint configs (when scripts available)

## Best Practices

### When Adding New Scripts

1. **If script is needed in Vercel builds**:
   - Don't put it in `scripts/` directory, or
   - Remove from `.vercelignore`, or
   - Inline the logic in the build script

2. **If script is optional**:

   ```bash
   test -f scripts/script.js && node scripts/script.js || echo 'Skipping...'
   ```

3. **If script extends root ESLint config**:
   - Add `eslint-config-prettier` to package devDependencies
   - Run `npm run validate:eslint-config` to verify

### When Adding New Packages

1. Check if package extends root ESLint config
2. If yes, add `eslint-config-prettier` to devDependencies
3. Run `npm run validate:build-safety` to check for issues

### When Modifying Build Scripts

1. Check if script references `scripts/` directory
2. If yes, ensure it's optional or available in Vercel
3. Run `npm run validate:build-safety` before committing

## Common Issues to Watch For

### ❌ Bad Pattern

```json
{
  "scripts": {
    "build": "node scripts/build-optimizer.js && next build"
  }
}
```

**Problem**: Script won't be available in Vercel builds

### ✅ Good Pattern

```json
{
  "scripts": {
    "build": "(test -f scripts/build-optimizer.js && node scripts/build-optimizer.js || echo 'Skipping...') && next build"
  }
}
```

**Solution**: Script is optional, build continues if missing

### ❌ Bad Pattern

```json
{
  "devDependencies": {
    "eslint": "^8.0.0"
  }
}
```

**Problem**: Package extends root ESLint config with prettier but missing dependency

### ✅ Good Pattern

```json
{
  "devDependencies": {
    "eslint": "^8.0.0",
    "eslint-config-prettier": "^10.1.8"
  }
}
```

**Solution**: Required dependency is present

## Monitoring

Run these commands regularly:

```bash
# Check for build safety issues
npm run validate:build-safety

# Check ESLint config dependencies
npm run validate:eslint-config

# Full build guardian check
npx tsx scripts/build-guardian.ts
```

## Related Files

- `.vercelignore` - Defines what's excluded from Vercel builds
- `.eslintrc.js` - Root ESLint config (includes prettier)
- `scripts/validate-build-safety.ts` - Build safety validator
- `scripts/validate-eslint-config.ts` - ESLint config validator
- `scripts/build-guardian.ts` - Comprehensive build health checker
- `.husky/pre-commit` - Pre-commit validation hooks
- `.github/workflows/ci.yml` - CI validation pipeline
