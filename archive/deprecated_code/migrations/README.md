# Archived Migration Files

This directory contains archived Supabase migration files.

## Migration Status

All migrations in this archive have been:
- ✅ Applied to the production database
- ✅ Tracked in `supabase_migrations.schema_migrations` table
- ✅ Archived for historical reference

## Original Location

These files were originally located in:
- `supabase/migrations/`

## Important Notes

⚠️ **Do not delete these files** - They serve as historical reference and may be needed for:
- Database rollback procedures
- Understanding schema evolution
- Audit purposes

## Active Migrations

New migrations should be created in:
- `supabase/migrations/` (for Supabase CLI tracking)

## Applying Migrations

Migrations are now automated via:
1. **GitHub Actions**: Comment `migrate` on any issue/PR
2. **Workflow Dispatch**: Manual trigger from Actions tab
3. **Supabase CLI**: `supabase db push` (local development)

See `/docs/github-secrets-migration.md` for setup instructions.
