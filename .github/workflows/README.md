# GitHub Actions Workflows

## Database Migrations

### Automated Migration Workflows

Migrations are automatically applied via GitHub Actions - **no local setup required**.

#### Setup

1. **Add GitHub Secret**:
   - Go to: Settings > Secrets and variables > Actions
   - Add secret: `DATABASE_URL`
   - Value: Your Supabase pooler connection string

2. **Workflows Auto-Run**:
   - On push to main (with migration files)
   - On PR merge to main (with migration files)
   - Manual trigger available

#### Workflows

- **`apply-migrations.yml`** - Main migration workflow
- **`migrations-on-merge.yml`** - Auto-apply on PR merge
- **`migrations-on-push.yml`** - Auto-apply on push to main

See [CI/CD Migrations Guide](../../docs/CI_CD_MIGRATIONS.md) for complete documentation.
