# DOM Reality Tests - Environment Variables Setup

## Overview

DOM reality tests need access to environment variables to properly test routes that require database/Supabase connections. This document explains how environment variables are loaded for tests.

## Environment Variable Loading

### Priority Order (Same as Next.js)

1. **`.env.local`** (highest priority - gitignored)
2. **`.env.development`**
3. **`.env`**
4. **`packages/web/.env.local`**
5. **`packages/web/.env.development`**
6. **`packages/web/.env`**

### How It Works

The Playwright configuration (`playwright.config.ts`) automatically loads `.env` files using the same priority order as Next.js. This ensures:

- ✅ Tests have access to the same environment variables as the app
- ✅ Local development uses `.env.local` (gitignored)
- ✅ CI/CD uses GitHub secrets (passed as environment variables)
- ✅ Preview/production environments work the same way

## Required Environment Variables

### For Full Test Execution

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Setup Instructions

### Local Development

1. **Copy example file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Fill in your values:**
   ```bash
   # Edit .env.local with your actual values
   nano .env.local
   ```

3. **Run tests:**
   ```bash
   npm run qa:dom-reality
   ```

The tests will automatically load variables from `.env.local`.

### CI/CD (GitHub Actions)

Environment variables are automatically passed from GitHub secrets:

```yaml
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
  SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
  SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
  NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
  NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
```

**No additional setup needed** - the workflow already includes these.

### Preview/Production

Environment variables are automatically available from:
- Vercel environment variables (preview/production)
- GitHub Actions secrets (CI/CD)
- System environment variables

## Verification

### Check if Environment Variables are Loaded

```bash
# Run the env loader script
npx tsx scripts/load-env-for-tests.ts
```

This will show:
- Which `.env` files were loaded
- Status of key environment variables
- Masked values for security

### Test Environment Variable Loading

```bash
# Run a simple test to verify env vars are available
npm run qa:dom-reality
```

If tests fail with "Missing environment variables", check:
1. `.env.local` exists and has correct values
2. GitHub secrets are configured (for CI)
3. Environment variables are properly named

## Troubleshooting

### Tests Fail: "Missing environment variables"

**Local:**
1. Ensure `.env.local` exists in project root
2. Check that required variables are set
3. Verify file is not corrupted

**CI/CD:**
1. Check GitHub repository secrets are configured
2. Verify secret names match workflow file
3. Ensure secrets are not empty

### Variables Not Loading

1. **Check file location:**
   ```bash
   ls -la .env.local
   ls -la packages/web/.env.local
   ```

2. **Verify file format:**
   ```bash
   # Should be KEY=value format
   cat .env.local
   ```

3. **Check for syntax errors:**
   ```bash
   # No spaces around =
   # Correct: KEY=value
   # Wrong: KEY = value
   ```

### Different Values Than Expected

Remember priority order:
- `.env.local` overrides `.env.development`
- `.env.development` overrides `.env`
- Process environment variables override all

## Best Practices

1. **Never commit `.env.local`** - It's in `.gitignore`
2. **Use `.env.example`** - Document required variables
3. **Set CI secrets** - Configure GitHub secrets for CI/CD
4. **Verify loading** - Use `load-env-for-tests.ts` to verify
5. **Mask sensitive values** - Never log full secrets

## Related Files

- `playwright.config.ts` - Loads env vars for tests
- `scripts/load-env-for-tests.ts` - Utility for loading env vars
- `.env.example` - Template for required variables
- `.github/workflows/dom-reality.yml` - CI/CD workflow with env vars

## Summary

✅ Environment variables are automatically loaded from `.env` files
✅ Same priority order as Next.js (preview/production)
✅ CI/CD uses GitHub secrets (no `.env` files needed)
✅ Local development uses `.env.local` (gitignored)

**No manual configuration needed** - just ensure `.env.local` exists locally and GitHub secrets are configured for CI/CD.
