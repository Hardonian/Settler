# DOM Reality Environment Variables - Verification Guide

## Quick Check

Run this command to verify environment variables are loaded:

```bash
npx tsx scripts/load-env-for-tests.ts
```

## Expected Output

### ✅ Success (Local with .env.local)

```
✅ Loaded environment variables from:
   - /workspace/.env.local
   - /workspace/packages/web/.env.local

📋 Environment variables status:
   ✅ DATABASE_URL: postgresql...
   ✅ SUPABASE_URL: https://...
   ✅ NEXT_PUBLIC_SUPABASE_URL: https://...
   ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY: eyJh...
```

### ⚠️ Warning (No .env files, using system/env)

```
⚠️  No .env files found. Using system environment variables only.
   Expected locations:
   - /workspace/.env.local
   - /workspace/.env.development
   - /workspace/.env
   - /workspace/packages/web/.env.local
   - /workspace/packages/web/.env.development
   - /workspace/packages/web/.env

📋 Environment variables status:
   ❌ DATABASE_URL: Not set
   ❌ SUPABASE_URL: Not set
   ...
```

## Verification Steps

### 1. Check .env Files Exist

```bash
# Check root .env files
ls -la .env* 2>/dev/null || echo "No .env files in root"

# Check packages/web .env files
ls -la packages/web/.env* 2>/dev/null || echo "No .env files in packages/web"
```

### 2. Verify Environment Variables

```bash
# Check if variables are loaded
node -e "
  require('./scripts/load-env-for-tests.ts');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
  console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set' : 'Not set');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set');
"
```

### 3. Test Playwright Config Loading

```bash
# Verify Playwright can load env vars
node -e "
  require('./playwright.config.ts');
  console.log('Env vars loaded:', !!process.env.DATABASE_URL);
"
```

## CI/CD Verification

In GitHub Actions, environment variables come from secrets. Check:

1. **Repository Settings → Secrets and variables → Actions**
2. Verify these secrets exist:
   - `DATABASE_URL`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

3. **Check workflow file** (`.github/workflows/dom-reality.yml`):
   - Should have `env:` section with secrets
   - Should pass to `webServer` and test steps

## Troubleshooting

### Issue: Variables Not Loading

**Solution:**
1. Ensure `.env.local` exists (copy from `.env.example`)
2. Check file permissions: `chmod 644 .env.local`
3. Verify no syntax errors in `.env.local`
4. Restart test process

### Issue: Wrong Values

**Solution:**
1. Check priority order (`.env.local` overrides others)
2. Verify no conflicting variables in system env
3. Check for typos in variable names

### Issue: CI/CD Not Loading

**Solution:**
1. Verify GitHub secrets are set
2. Check workflow file has `env:` section
3. Ensure secrets are not empty
4. Check workflow logs for errors

## Best Practices

1. ✅ Use `.env.local` for local development (gitignored)
2. ✅ Use `.env.example` to document required variables
3. ✅ Set GitHub secrets for CI/CD
4. ✅ Verify loading before running tests
5. ✅ Never commit `.env.local` with real secrets

## Related Documentation

- [Environment Setup Guide](DOM_REALITY_ENV_SETUP.md)
- [Quick Start Guide](DOM_REALITY_QUICK_START.md)
- [Integration Guide](DOM_REALITY_INTEGRATION_GUIDE.md)
