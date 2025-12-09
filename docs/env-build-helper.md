# Environment Variable Build Helper

This helper system ensures that environment variable validation works correctly during both build-time and runtime, preventing build failures from missing runtime-only variables.

## Problem

Some environment variables (like `DB_PASSWORD`, `ENCRYPTION_KEY`, `JWT_SECRET`) are required at runtime but not during build. However, validation code was checking for these variables during build, causing build failures.

## Solution

The environment variable build helper:
- **During build**: Only validates build-time required variables (e.g., `SUPABASE_URL`, `SUPABASE_ANON_KEY`)
- **At runtime**: Validates all required variables
- **Runtime-only variables**: Are optional during build but will be validated when the app runs

## Usage

### In Code

```typescript
import { getEnv, getEnvSafe } from '@/lib/env-build-helper';

// Safe access during build (returns empty string if runtime-only var is missing)
const dbPassword = getEnvSafe('DB_PASSWORD', {
  required: true,
  defaultValue: '',
  buildTimeRequired: false, // This is runtime-only
});

// Or use the standard getEnv (automatically handles build vs runtime)
const jwtSecret = getEnv('JWT_SECRET', true);
```

### Validation Scripts

```bash
# Validate for build context (non-blocking for runtime vars)
npm run validate:env:build

# Validate for runtime context (strict - all vars required)
npm run validate:env:runtime
```

## Environment Variable Categories

### Build-Time Required
These variables are needed during the build process:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

### Runtime-Only
These variables are NOT required during build but will be needed at runtime:
- `DB_PASSWORD`
- `ENCRYPTION_KEY`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`

## How It Works

1. **Build Detection**: The helper detects build context using:
   - `NEXT_PHASE === 'phase-production-build'`
   - `VERCEL` environment variable
   - `CI === 'true'`
   - `SKIP_ENV_VALIDATION === 'true'`

2. **Conditional Validation**: 
   - During build: Only validates build-time required variables
   - At runtime: Validates all required variables

3. **Safe Access**: The `getEnvSafe()` function returns empty strings for missing runtime-only variables during build, preventing build failures.

## Vercel/GitHub Secrets

Runtime-only environment variables should be set in:
- **Vercel**: Project Settings → Environment Variables
- **GitHub Actions**: Repository Settings → Secrets

These will be available at runtime but won't cause build failures if missing during build.

## Files

- `scripts/validate-env-build.ts` - CLI script for validation
- `packages/web/src/lib/env-build-helper.ts` - Helper functions for code
- `packages/web/src/lib/env.ts` - Updated to use build-time detection

## Example

```typescript
// ✅ Safe during build
const encryptionKey = getEnvSafe('ENCRYPTION_KEY', {
  required: true,
  buildTimeRequired: false,
});

// ✅ Will fail if missing during build (build-time required)
const supabaseUrl = getEnvSafe('SUPABASE_URL', {
  required: true,
  buildTimeRequired: true,
});
```
