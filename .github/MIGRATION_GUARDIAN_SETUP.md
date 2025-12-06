# Migration Guardian - GitHub Actions Setup

## Required GitHub Secrets

The Migration Guardian workflow uses GitHub repository secrets to access your Supabase database and Upstash Redis. Set these up in your repository:

### Required Secrets

1. **`DATABASE_URL`** (Required)
   - Your Supabase PostgreSQL connection string
   - Format: `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require`
   - Get from: Supabase Dashboard → Settings → Database → Connection string → URI

2. **`SUPABASE_DB_URL`** (Optional - alternative to DATABASE_URL)
   - Alternative database URL if you prefer a different variable name

### Optional Secrets

3. **`SUPABASE_URL`** (Optional)
   - Your Supabase project URL
   - Format: `https://[PROJECT-REF].supabase.co`
   - Used if DATABASE_URL is not set (will construct URL from this + password)

4. **`SUPABASE_DB_PASSWORD`** (Optional)
   - Database password (only needed if using SUPABASE_URL instead of DATABASE_URL)

5. **`UPSTASH_REDIS_REST_URL`** (Optional)
   - Upstash Redis REST API URL
   - Get from: Upstash Dashboard → Your Database → REST API

6. **`UPSTASH_REDIS_REST_TOKEN`** (Optional)
   - Upstash Redis REST API token
   - Get from: Upstash Dashboard → Your Database → REST API

## How to Set Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret with the exact name and value

## Workflow Behavior

The Migration Guardian workflow:

- **Runs automatically**: Every hour (via cron schedule)
- **Runs on push**: When Prisma migrations or schema files change
- **Can be triggered manually**: Via "Run workflow" button in Actions tab

## Priority Order

The script checks for database URLs in this order:

1. **GitHub Actions secrets** (process.env) - **HIGHEST PRIORITY**
   - `DATABASE_URL`
   - `SUPABASE_DB_URL`
   - `SUPABASE_URL` + `SUPABASE_DB_PASSWORD` (constructs URL)

2. **Local .env files** (for local development)
   - `.env.local`
   - `.env.development`
   - `.env`
   - `.env.production`
   - `.env.connection`

## Verification

After setting up secrets, the workflow will:

1. ✅ Test database connectivity
2. ✅ Check Prisma migration status
3. ✅ Apply pending migrations if any
4. ✅ Verify schema matches Prisma expectations
5. ✅ Check Redis connectivity (if configured)
6. ✅ Log everything to `MIGRATION_LOG.md`

## Troubleshooting

### "No DATABASE_URL found"
- Ensure `DATABASE_URL` secret is set in GitHub repository secrets
- Check the secret name matches exactly (case-sensitive)

### "Database connection failed"
- Verify the connection string is correct
- Check Supabase IP allowlist (should allow GitHub Actions IPs or use connection pooling)
- Ensure password doesn't contain special characters that need URL encoding

### "Prisma is not installed"
- The workflow installs dependencies automatically
- If this fails, check the `npm ci` step in the workflow

### Viewing Results

- Check the **Actions** tab for workflow runs
- Download the `migration-log` artifact to view `MIGRATION_LOG.md`
- Review workflow logs for detailed output
