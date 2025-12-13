# Completed Migrations Archive

This directory contains copies of migrations that have been successfully executed.

## Structure

- `prisma/` - Archived Prisma migrations (entire migration directories)
- `supabase/` - Archived Supabase migration SQL files

## Purpose

Migrations are archived here after successful execution to:
1. Keep a historical record of what has been run
2. Allow easy reference to past migrations
3. Keep the main migration directories clean

## Naming Convention

Archived migrations are named with the format:
- Prisma: `[migration-name]_[timestamp]/`
- Supabase: `[migration-name]_[timestamp].sql`

The timestamp format is: `YYYYMMDD_HHMMSS`

## Note

These are copies for reference. The original migrations remain in their source directories (`prisma/migrations/` and `supabase/migrations/`) but are marked as executed in `.migration-execution-log.json`.
