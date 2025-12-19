# Archived Migrations

This directory contains historical migration files that have been consolidated into the golden migration (`00000000_settler_golden_schema.sql`).

**These files are preserved for forensic reference only and are no longer executed.**

## Migration History

- **Total archived migrations:** (to be updated after consolidation)
- **Golden migration created:** (to be updated)
- **Last migration archived:** (to be updated)

## Why Archive?

The golden migration approach provides:
1. **Single source of truth** - One file defines the entire schema
2. **Idempotency** - Safe to run multiple times
3. **Easier verification** - CI can verify schema parity against one file
4. **Reduced complexity** - No need to understand migration ordering

## Restoring Historical Migrations

If you need to reference historical migrations:
1. Check git history for the original migration files
2. Review the consolidated golden migration
3. Use production schema introspection: `npx tsx scripts/introspect-production-schema.ts`

## Migration Consolidation Process

1. Run production introspection: `npx tsx scripts/introspect-production-schema.ts`
2. Review `supabase/production-schema.json`
3. Consolidate migrations: `npx tsx scripts/consolidate-migrations.ts`
4. Test golden migration on clean database
5. Move old migrations here
6. Update CI to use golden migration
