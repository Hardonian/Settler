# GitHub Secrets for Automated Migrations

This document lists all required GitHub Secrets for automated Supabase migrations.

## Required Secrets

### Supabase Credentials

| Secret Name                 | Description                            | Where to Find                                                                                 |
| --------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------- |
| `SUPABASE_ACCESS_TOKEN`     | Personal access token for Supabase CLI | [Supabase Dashboard → Account → Access Tokens](https://supabase.com/dashboard/account/tokens) |
| `SUPABASE_PROJECT_REF`      | Project reference ID                   | Found in project URL: `https://[PROJECT_REF].supabase.co`                                     |
| `SUPABASE_DB_PASSWORD`      | Database password                      | Project Settings → Database → Database Password                                               |
| `SUPABASE_URL`              | Full Supabase project URL              | `https://[PROJECT_REF].supabase.co`                                                           |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (bypasses RLS)        | Project Settings → API → Service Role Key                                                     |
| `SUPABASE_ANON_KEY`         | Anonymous/public key                   | Project Settings → API → Anon/Public Key                                                      |

### Database Connection (Alternative)

| Secret Name    | Description                          | Where to Find                                                                 |
| -------------- | ------------------------------------ | ----------------------------------------------------------------------------- |
| `DATABASE_URL` | Full PostgreSQL connection string    | `postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres` |
| `DIRECT_URL`   | Direct database URL (for migrations) | Same as DATABASE_URL for Supabase                                             |

## How to Set GitHub Secrets

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret name and value from the table above

## Using the Migration Workflow

### Option 1: Comment Trigger

Comment `migrate` on any issue or pull request to trigger migrations:

```
migrate
```

The workflow will:

1. Check for pending migrations
2. Apply them automatically
3. Comment back with the result

### Option 2: Manual Trigger

1. Go to **Actions** → **Migrate on Comment**
2. Click **Run workflow**
3. Select branch and click **Run workflow**

### Option 3: Workflow Dispatch API

```bash
gh workflow run migrate-on-comment.yml
```

## Migration Files Location

All migration files have been archived to:

- `archive/deprecated_code/migrations/`

Active migrations are managed through:

- Supabase CLI (`supabase db push`)
- GitHub Actions workflows
- Direct database connections (when CLI unavailable)

## Troubleshooting

### Migration fails with "authentication failed"

- Check `SUPABASE_ACCESS_TOKEN` is valid and not expired
- Verify `SUPABASE_PROJECT_REF` matches your project

### Migration fails with "connection refused"

- Verify `SUPABASE_DB_PASSWORD` is correct
- Check IP allowlist in Supabase dashboard
- Ensure `DATABASE_URL` format is correct

### "No migrations to apply"

- All migrations are already applied
- Check migration status: `supabase migration list`

## Security Notes

- Never commit secrets to the repository
- Rotate `SUPABASE_ACCESS_TOKEN` periodically
- Use environment-specific secrets for staging/production
- Review workflow logs for any exposed values
