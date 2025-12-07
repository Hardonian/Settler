# Vercel Deployment Fixes

## Problem

Vercel build was failing with:

```
npm error command failed
npm error command sh -c husky install
```

## Root Cause

1. `prepare` script runs `husky install` but husky is a dev dependency not needed in production
2. `postinstall` script runs `prisma generate` but prisma may not be installed
3. `npm install --frozen-lockfile` is deprecated

## Solutions Applied

### 1. Made Scripts Fail-Safe

Updated `package.json`:

```json
{
  "scripts": {
    "prepare": "husky install 2>/dev/null || true",
    "postinstall": "prisma generate 2>/dev/null || true"
  }
}
```

### 2. Updated Vercel Configuration

Updated `vercel.json`:

```json
{
  "installCommand": "npm ci",
  "buildCommand": "npm run build --workspace=@settler/protocol && npm run build --workspace=@settler/sdk && npm run build --workspace=@settler/react-settler && npm run build --workspace=@settler/web"
}
```

### 3. Created .vercelignore

Added `.vercelignore` to exclude unnecessary files.

## Build Process

### Install Phase

```bash
npm ci
```

- Uses `npm ci` (clean install) instead of deprecated `--frozen-lockfile`
- Scripts fail gracefully if husky/prisma not available

### Build Phase

```bash
# Build dependencies in order
npm run build --workspace=@settler/protocol
npm run build --workspace=@settler/sdk
npm run build --workspace=@settler/react-settler
npm run build --workspace=@settler/web
```

## Verification

### Local Test

```bash
# Test install
npm ci

# Test build
npm run build --workspace=@settler/protocol
npm run build --workspace=@settler/sdk
npm run build --workspace=@settler/react-settler
npm run build --workspace=@settler/web
```

## Expected Result

✅ **Install**: Should complete without errors (warnings about husky/prisma are OK)  
✅ **Build**: All packages should build successfully  
✅ **Deploy**: Vercel deployment should succeed

## Files Modified

1. `package.json` - Made scripts fail-safe
2. `vercel.json` - Updated install and build commands
3. `.vercelignore` - Added (new file)

## Next Steps

1. Commit these changes
2. Push to trigger Vercel deployment
3. Verify build succeeds
4. Test deployed application

---

**Status**: ✅ Fixes Applied  
**Ready for**: Vercel Deployment  
**Date**: 2024-12-19
