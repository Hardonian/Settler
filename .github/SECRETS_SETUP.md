# GitHub Secrets Setup for Receipt Console

This document describes the required GitHub repository secrets for Receipt Console CI/CD workflows.

## Required Secrets

### Database Connection
- **`DATABASE_URL`** (Required)
  - PostgreSQL connection string with password
  - Format: `postgresql://user:password@host:port/database?schema=public`
  - Example: `postgresql://postgres:your-password@db.xxxxx.supabase.co:5432/postgres`
  - **Auto-injected on commit** - Used by all workflows for database operations

### Supabase Credentials
- **`SUPABASE_URL`** (Required)
  - Your Supabase project URL
  - Format: `https://xxxxx.supabase.co`
  - Example: `https://abcdefghijklmnop.supabase.co`

- **`SUPABASE_ANON_KEY`** (Required)
  - Supabase anonymous/public key
  - Found in Supabase Dashboard > Settings > API

- **`SUPABASE_SERVICE_ROLE_KEY`** (Required)
  - Supabase service role key (bypasses RLS)
  - Found in Supabase Dashboard > Settings > API
  - **Keep this secret** - Never expose to client

- **`SUPABASE_ACCESS_TOKEN`** (Optional, for migrations)
  - Supabase access token for CLI operations
  - Generate at: https://supabase.com/dashboard/account/tokens

- **`SUPABASE_PROJECT_REF`** (Optional, for migrations)
  - Your Supabase project reference ID
  - Found in project URL or dashboard

### E2E Testing (Optional)
- **`E2E_BASE_URL`** (Optional)
  - Base URL for E2E tests
  - Default: `http://localhost:3000`

- **`E2E_TEST_USER_EMAIL`** (Optional)
  - Test user email for E2E tests
  - Example: `test@example.com`

- **`E2E_TEST_USER_PASSWORD`** (Optional)
  - Test user password for E2E tests

- **`E2E_TEST_API_KEY`** (Optional)
  - Test API key for E2E tests
  - Format: `rk_xxxxx`

### Vercel Deployment (Optional)
- **`VERCEL_TOKEN`** (Optional)
  - Vercel API token
  - Generate at: https://vercel.com/account/tokens

- **`VERCEL_ORG_ID`** (Optional)
  - Vercel organization ID

- **`VERCEL_PROJECT_ID`** (Optional)
  - Vercel project ID

## How to Add Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret**
4. Enter the secret name and value
5. Click **Add secret**

## Security Best Practices

1. **Never commit secrets to code** - Always use GitHub Secrets
2. **Rotate secrets regularly** - Update database passwords and API keys periodically
3. **Use environment-specific secrets** - Use GitHub Environments for staging/production
4. **Limit secret access** - Only grant access to workflows that need them
5. **Audit secret usage** - Regularly review which workflows use which secrets

## Database Password Auto-Injection

The workflows automatically inject `DATABASE_URL` from GitHub secrets on every commit. The password is included in the connection string and is never exposed in logs or build outputs.

### Example Usage in Workflow

```yaml
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}

steps:
  - name: Run migration
    run: npm run db:migrate
    env:
      DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

## Verification

After adding secrets, verify they work by:

1. Running the CI workflow manually
2. Checking workflow logs (secrets are masked in logs)
3. Verifying database connection succeeds

## Troubleshooting

### "Secret not found" error
- Ensure secret name matches exactly (case-sensitive)
- Check that secret is added to the correct repository
- Verify workflow has access to the secret

### "Database connection failed" error
- Verify `DATABASE_URL` format is correct
- Check that database password is correct
- Ensure database allows connections from GitHub Actions IPs
- Check firewall/network settings

### "Permission denied" error
- Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
- Check that service role key has necessary permissions
- Ensure RLS policies allow service role access

## Migration from Local to GitHub Secrets

If you're migrating from local `.env` files:

1. Export your local secrets:
   ```bash
   # Don't commit this file!
   cat > .env.local << EOF
   DATABASE_URL=your-database-url
   SUPABASE_URL=your-supabase-url
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   EOF
   ```

2. Add each secret to GitHub:
   - Copy value from `.env.local`
   - Add as GitHub secret
   - Remove from `.env.local` (or add to `.gitignore`)

3. Update workflows to use secrets:
   ```yaml
   env:
     DATABASE_URL: ${{ secrets.DATABASE_URL }}
   ```

4. Test the workflow:
   - Push a commit
   - Verify workflow runs successfully
   - Check logs for any errors
