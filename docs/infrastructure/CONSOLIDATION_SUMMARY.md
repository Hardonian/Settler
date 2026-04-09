# Migration Consolidation Summary

## Overview

This directory contains consolidated migration files that combine the 62 original migration files into a more manageable structure.

## Original Migration Count

- **62 migration files** in `supabase/migrations/`
- **136 tables** total
- **110 functions** total
- **50+ tables** with RLS policies

## Consolidated Structure

The migrations are consolidated into domain-specific files:

1. **01-core-schema.sql** - Core infrastructure (tenants, users, jobs, etc.)
2. **02-billing-schema.sql** - Billing & subscriptions
3. **03-recon-core-schema.sql** - Reconciliation engine
4. **04-console-schema.sql** - Receipts & Feature Flags APIs
5. **05-tenant-builder-schema.sql** - Multi-tenant site builder
6. **06-functions.sql** - All database functions
7. **07-rls-policies.sql** - All RLS policies

## Status

⚠️ **Consolidated files are not yet created** - This is a placeholder structure.

To create consolidated files:

1. Follow the guide in `docs/internal/migration-consolidation-guide.md`
2. Use the Supabase AI prompt in `SUPABASE_AI_SCHEMA_PROMPT.md` if starting fresh
3. Test thoroughly before deploying

## Verification

After creating consolidated files, verify:

- [ ] All 37 Prisma models have tables
- [ ] All foreign keys are correct
- [ ] All indexes are present
- [ ] RLS policies cover all tables
- [ ] Functions work correctly
- [ ] No duplicate definitions

## Usage

### For New Deployments

Run consolidated files in order (01 through 07).

### For Existing Databases

Keep original migrations. Use consolidated files only for:

- New environments
- Documentation purposes
- Schema reference

## Related Documents

- `docs/internal/supabase-schema-audit-report.md` - Full audit report
- `docs/internal/migration-consolidation-guide.md` - Detailed consolidation guide
- `SUPABASE_AI_SCHEMA_PROMPT.md` - AI prompt for schema generation
