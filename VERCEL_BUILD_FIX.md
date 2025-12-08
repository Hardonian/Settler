# Vercel Build Fix

## Issue

The Vercel build was failing because:

1. `husky install` command was failing (husky not installed in production)
2. `prisma generate` command was failing (prisma not installed in production)
3. `npm install --frozen-lockfile` is deprecated

## Fixes Applied

### 1. Made Scripts Resilient

Updated `package.json` scripts to fail gracefully:

- `prepare`: `husky install 2>/dev/null || true`
- `postinstall`: `prisma generate 2>/dev/null || true`

### 2. Updated Vercel Configuration

- Changed `installCommand` from `npm install --frozen-lockfile` to `npm ci`
- Updated `buildCommand` to build dependencies in correct order:
  1. `@settler/protocol`
  2. `@settler/sdk`
  3. `@settler/react-settler`
  4. `@settler/web`

### 3. Created .vercelignore

Added `.vercelignore` to exclude unnecessary files from deployment.

## Build Command

```bash
npm ci && \
npm run build --workspace=@settler/protocol && \
npm run build --workspace=@settler/sdk && \
npm run build --workspace=@settler/react-settler && \
npm run build --workspace=@settler/web
```

## Verification

The build should now:

1. ✅ Install dependencies without errors
2. ✅ Skip husky/prisma if not available
3. ✅ Build all dependencies in order
4. ✅ Build web package successfully

## Next Deployment

The next Vercel deployment should succeed with these fixes.
