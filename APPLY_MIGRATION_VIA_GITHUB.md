# Apply Migration via GitHub Actions

The database password is stored in GitHub Actions secrets. Use one of these methods to apply the migration:

## Method 1: Manual Workflow Dispatch (Recommended)

1. **Go to GitHub Actions**
   - Navigate to: `https://github.com/your-org/settler/actions`
   - Click on **"Apply Stripe Events Migration"** workflow

2. **Trigger the workflow**
   - Click **"Run workflow"** button
   - Select environment: `production` or `staging`
   - Click **"Run workflow"**

3. **Monitor the run**
   - Watch the workflow execution
   - Check logs for any errors
   - Verify the migration was applied successfully

## Method 2: Push to Main Branch

The workflow will automatically run when you push the migration file to `main`:

```bash
git add supabase/migrations/20250121000000_add_stripe_events_table.sql
git add prisma/migrations/20250121000000_add_stripe_events_table/
git commit -m "Add stripe_events table migration"
git push origin main
```

## Method 3: Use Existing Migration Workflow

The existing `supabase-migrate.yml` workflow will also pick up this migration:

1. Push the migration files
2. The workflow will detect changes in `supabase/migrations/`
3. It will automatically apply the migration

## Required GitHub Secrets

Make sure these secrets are set in your repository:

- `SUPABASE_ACCESS_TOKEN` - Supabase access token
- `SUPABASE_DB_PASSWORD` - Database password
- `SUPABASE_PROJECT_REF` - Supabase project reference
- `DATABASE_URL` - Full database connection string (optional, but recommended)

## Verification

After the workflow runs, verify the migration:

### Check Workflow Logs
- Look for: `✅ stripe_events table exists`
- Look for: `✅ StripeEvent model available in Prisma client`

### Check Database (if you have access)
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'stripe_events';
-- Should return 1 row
```

### Check Prisma Client
The workflow will regenerate Prisma client automatically. Verify in your application that `prisma.stripeEvent` is available.

## Troubleshooting

### Workflow Fails: "Missing SUPABASE_ACCESS_TOKEN"
- Go to repository Settings → Secrets and variables → Actions
- Add missing secrets

### Workflow Fails: "Table already exists"
- This is safe to ignore - migration was already applied
- Check if table exists: `SELECT * FROM stripe_events LIMIT 1;`

### Workflow Fails: "Cannot connect to database"
- Verify `DATABASE_URL` or `SUPABASE_DB_PASSWORD` is correct
- Check Supabase project is active
- Verify network access from GitHub Actions

## Next Steps After Migration

1. ✅ Migration applied
2. ⏳ Configure Stripe webhook (see `STRIPE_WEBHOOK_SETUP_GUIDE.md`)
3. ⏳ Set `STRIPE_WEBHOOK_SECRET` in Vercel environment variables
4. ⏳ Test webhook endpoint

---

**Quick Start**: Go to Actions → "Apply Stripe Events Migration" → Run workflow
