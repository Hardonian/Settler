# GitHub Secrets Setup Guide

## Quick Setup Checklist

Configure these secrets in your GitHub repository:
**Settings > Secrets and variables > Actions > New repository secret**

## Required Secrets

### 1. SUPABASE_ACCESS_TOKEN
- **Description**: Personal access token for Supabase CLI authentication
- **Where to get**: https://supabase.com/dashboard/account/tokens
- **Format**: `sbp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- **Required for**: All Supabase CLI operations

### 2. SUPABASE_DB_PASSWORD
- **Description**: Database password for your Supabase project
- **Where to get**: Project Settings > Database > Database password
- **Format**: Plain text password
- **Required for**: Database connections

### 3. SUPABASE_PROJECT_ID
- **Description**: Unique project identifier (UUID)
- **Where to get**: Project Settings > General > Reference ID
- **Format**: UUID (e.g., `12345678-1234-1234-1234-123456789abc`)
- **Required for**: Project identification

### 4. SUPABASE_PROJECT_REF
- **Description**: Project reference string (used in URLs)
- **Where to get**: Found in project URL: `https://[ref].supabase.co`
- **Format**: Alphanumeric string (e.g., `abcdefghijklmnop`)
- **Required for**: Project linking and API calls

### 5. DATABASE_URL
- **Description**: Pooled Postgres connection string (port 6543)
- **Where to get**: Project Settings > Database > Connection string > Connection pooling
- **Format**: 
  ```
  postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
  ```
- **Required for**: Prisma migrations (pooled connection)

### 6. DIRECT_URL
- **Description**: Direct Postgres connection string (port 5432)
- **Where to get**: Project Settings > Database > Connection string > Direct connection
- **Format**: 
  ```
  postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
  ```
- **Required for**: Prisma migrations (direct connection for migrations)

### 7. NEXT_PUBLIC_SUPABASE_URL
- **Description**: Public Supabase project URL
- **Where to get**: Project URL from dashboard
- **Format**: `https://[ref].supabase.co`
- **Required for**: Client connections and verification

### 8. SUPABASE_SERVICE_ROLE_KEY
- **Description**: Service role key (bypasses Row Level Security)
- **Where to get**: Project Settings > API > Service role key
- **Format**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Required for**: Admin operations and verification
- **⚠️ Warning**: Keep this secret! Never expose in client-side code.

## Step-by-Step Setup

1. Go to your GitHub repository
2. Navigate to **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret**
4. For each secret above:
   - Name: Use exact name from list (case-sensitive)
   - Secret: Paste the value
   - Click **Add secret**

## Verification

After setting up secrets, verify the workflow:

1. Go to **Actions** tab in GitHub
2. Find **Supabase Migration on Merge** workflow
3. Click **Run workflow** > **Run workflow**
4. Check that all jobs complete successfully

## Troubleshooting

### "Secret not found" error
- Verify secret name matches exactly (case-sensitive)
- Ensure secret is set at repository level (not organization level)

### "Invalid credentials" error
- Verify token/password is correct
- Check if token has expired (regenerate if needed)
- Ensure project ref matches your project

### "Connection refused" error
- Verify DATABASE_URL and DIRECT_URL are correct
- Check if IP allowlist is blocking GitHub Actions IPs
- Ensure connection pooling is enabled for DATABASE_URL

## Security Best Practices

1. ✅ **Never commit secrets** — Always use GitHub Secrets
2. ✅ **Rotate tokens regularly** — Regenerate access tokens periodically
3. ✅ **Use least privilege** — Only grant necessary permissions
4. ✅ **Monitor access** — Review who has access to secrets
5. ✅ **Use environment-specific secrets** — Separate staging/production secrets

## Testing Secrets Locally

You can test secrets locally using environment variables:

```bash
export SUPABASE_ACCESS_TOKEN="your-token"
export SUPABASE_PROJECT_REF="your-ref"
supabase link --project-ref $SUPABASE_PROJECT_REF
supabase migration list
```

## Additional Resources

- [Supabase Dashboard](https://supabase.com/dashboard)
- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Supabase CLI Documentation](https://supabase.com/docs/reference/cli)
