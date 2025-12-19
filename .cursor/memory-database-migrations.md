# Database Migration Setup - Memory

## GitHub Secrets Configuration

**DATABASE_URL** is stored in GitHub repository secrets and used for automated migrations.

### Setup Status
- ✅ DATABASE_URL secret is configured in GitHub
- ✅ Migrations run automatically via GitHub Actions
- ✅ No local migration setup required

### Workflow Triggers
- Push to main branch (with migration files)
- PR merge to main (with migration files)
- Manual workflow_dispatch trigger

### Migration Script
- Location: `scripts/apply-migrations-direct-pooler.ts`
- Command: `npm run db:migrate:pooler`
- Uses: GitHub secret `DATABASE_URL` (Supabase pooler connection)

### Important Notes
- Never run migrations locally - always use GitHub Actions
- DATABASE_URL is stored as encrypted secret, never exposed
- Migrations are idempotent and safe to run multiple times
- Workflows automatically apply migrations on push/merge

## How to Trigger Migrations

### Automatic (Recommended)
1. Push migration files to main branch
2. Workflows automatically detect and apply

### Manual Trigger
1. Go to GitHub Actions tab
2. Select "Apply Database Migrations" workflow
3. Click "Run workflow"
4. Select branch and run

### Via API
```bash
gh workflow run apply-migrations.yml
```

## Verification

Check if migrations were applied:
- View GitHub Actions logs
- Check Supabase dashboard
- Query: `SELECT * FROM supabase_migrations.schema_migrations`
