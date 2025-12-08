# Supabase Database Setup Guide

This guide will help you set up and migrate your Supabase database automatically.

## Quick Start

### Option 1: Remote Supabase Project (Recommended for Production)

1. Get your Supabase connection details:
   - Go to your Supabase project dashboard
   - Navigate to Settings → Database
   - Copy the connection string or note your project URL and database password

2. Set environment variables:
   ```bash
   export DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
   # OR
   export SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
   export SUPABASE_DB_PASSWORD="[YOUR-DATABASE-PASSWORD]"
   ```

3. Run migrations:
   ```bash
   npm run db:migrate:auto
   ```

### Option 2: Local Supabase Development

1. Start Supabase locally:
   ```bash
   # If you have Supabase CLI installed
   supabase start
   ```

2. Run migrations:
   ```bash
   npm run db:migrate:auto
   ```

   The script will automatically connect to your local Supabase instance (default: `localhost:54322`)

### Option 3: Custom PostgreSQL Database

Set environment variables:
```bash
export DB_HOST="localhost"
export DB_PORT="5432"
export DB_NAME="settler"
export DB_USER="postgres"
export DB_PASSWORD="postgres"
export DB_SSL="false"
```

Then run:
```bash
npm run db:migrate:auto
```

## What Gets Migrated?

The migration script will:

1. ✅ Run all migrations from `supabase/migrations/` in order:
   - `20251128193735_initial_schema.sql` - Core database schema
   - `20251128193816_functions_and_triggers.sql` - Database functions and triggers
   - `20251128193816_reconciliation_graph_tables.sql` - Graph tables for reconciliation
   - `20251128193816_rls_policies.sql` - Row Level Security policies

2. ✅ Load seed data from `supabase/seeds/seed.sql`:
   - Default tenant
   - Example user
   - Example API key
   - Webhook configurations

## Troubleshooting

### Connection Errors

If you see connection errors:

1. **Check your connection string**: Make sure `DATABASE_URL` or Supabase credentials are correct
2. **Check network access**: Ensure your IP is allowed in Supabase dashboard (Settings → Database → Connection Pooling)
3. **Check SSL**: For remote Supabase, SSL is required. The script handles this automatically.

### Migration Errors

If migrations fail:

1. **"already exists" errors**: These are safe to ignore - the script handles them automatically
2. **Permission errors**: Make sure you're using a database user with sufficient privileges
3. **Extension errors**: Some extensions (like `vector`) may not be available in all Supabase tiers

### Reset Database (Development Only)

⚠️ **WARNING**: This will delete all data!

```bash
# For local Supabase
supabase db reset

# Then run migrations again
npm run db:migrate:auto
```

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Full PostgreSQL connection string | `postgresql://user:pass@host:port/db` |
| `SUPABASE_URL` | Your Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_DB_PASSWORD` | Database password (from Supabase dashboard) | `your-password` |
| `DB_HOST` | Database host | `localhost` or `db.xxx.supabase.co` |
| `DB_PORT` | Database port | `5432` or `54322` (local) |
| `DB_NAME` | Database name | `postgres` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | `your-password` |
| `DB_SSL` | Enable SSL | `true` or `false` |

## Next Steps

After migrations complete successfully:

1. ✅ Your database schema is ready
2. ✅ Seed data is loaded
3. ✅ You can start using the API

Check the migration output for any warnings or errors.
