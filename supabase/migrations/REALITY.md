# Supabase Backend Reality Validation Report

## Overview

This document provides a comprehensive validation system for ensuring your Supabase backend matches the intended schema defined in your migrations.

## Files in This Validation System

1. **INTROSPECTION.sql** - Captures actual database state
2. **GAPS_REPORT.sql** - Compares intended vs actual state and identifies gaps
3. **PATCH.sql** - Idempotent SQL patch to fix identified gaps
4. **VERIFY.sql** - Verification queries to prove patch worked
5. **ROLLBACK.sql** - Safe rollback procedures (if needed)

## Quick Start

### Step 1: Capture Current State

```bash
# Connect to your Supabase database
psql $DATABASE_URL -f supabase/migrations/INTROSPECTION.sql
```

This creates temporary tables in `introspection_temp` schema with all current database objects.

### Step 2: Generate Gaps Report

```bash
psql $DATABASE_URL -f supabase/migrations/GAPS_REPORT.sql
```

This will show you what's missing or incorrect.

### Step 3: Apply Patch

```bash
psql $DATABASE_URL -f supabase/migrations/PATCH.sql
```

This idempotent patch will:

- Add missing extensions
- Create missing critical tables
- Enable RLS where needed
- Create missing RLS policies
- Add missing indexes
- Configure grants properly
- Set up realtime publication

### Step 4: Verify

```bash
psql $DATABASE_URL -f supabase/migrations/VERIFY.sql
```

This runs comprehensive verification queries to ensure everything is correct.

## What Gets Validated

### Critical Objects (Blocking Launch)

1. **Core Tables**
   - `tenants` - Multi-tenant isolation
   - `billing_accounts` - User billing data

2. **Security**
   - RLS enabled on all tenant/user data tables
   - RLS policies exist and enforce tenant isolation
   - No public grants on sensitive tables
   - Helper functions exist (`get_user_tenant_ids`, `current_tenant_id`)

3. **Indexes**
   - Performance indexes on foreign keys
   - Indexes on tenant_id columns
   - Indexes on lookup columns (slug, stripe_customer_id, etc.)

### Standard Objects (Non-Blocking)

1. **Additional Tables**
   - Subscriptions, usage tracking, reconciliation tables
   - Receipts, feature flags, webhooks
   - Ingestion pipeline tables

2. **Functions**
   - CRUD helper functions
   - Utility functions

3. **Realtime**
   - Publication configuration
   - Table membership in realtime publication

## Safety Guarantees

### PATCH.sql Safety

- ✅ **Idempotent** - Safe to run multiple times
- ✅ **Non-destructive** - Never drops tables or data
- ✅ **Additive only** - Only adds missing objects
- ✅ **Validated** - Includes validation checks before commit

### What PATCH.sql Does NOT Do

- ❌ Drop tables or columns
- ❌ Rename objects
- ❌ Modify existing data
- ❌ Change column types (would require manual intervention)
- ❌ Drop existing policies (only creates new ones)

## Expected Schema (From Migrations)

### Core Tables

Based on migration analysis, the following tables are expected:

**Billing & Subscriptions:**

- `billing_accounts` - User billing accounts
- `subscriptions` - Active subscriptions
- `add_ons` - Available add-ons
- `add_on_purchases` - Purchased add-ons
- `usage_events` - Usage tracking events
- `usage_aggregate_daily` - Daily usage aggregates
- `usage_counters` - Usage counters

**Multi-Tenant:**

- `tenants` - Tenant/organization records
- `tenant_users` - User-tenant relationships
- `tenant_branding` - Tenant branding config
- `tenant_pages` - Tenant page builder content

**Reconciliation:**

- `recon_jobs` - Reconciliation job definitions
- `recon_results` - Reconciliation execution results
- `recon_templates` - Job templates
- `recon_audits` - Audit trail

**Ingestion:**

- `ingestion_sources` - Data source configurations
- `ingestions` - Ingestion runs
- `raw_records` - Raw ingested data
- `normalized_transactions` - Normalized transaction data
- `reconciliation_runs` - Reconciliation execution runs
- `reconciliation_matches` - Match results

**Receipts API:**

- `receipt_uploads` - Uploaded receipt files
- `receipts` - Parsed receipt data
- `receipt_items` - Receipt line items

**Feature Flags:**

- `feature_flags` - Feature flag definitions
- `feature_flag_environments` - Environment-specific values
- `feature_flag_overrides` - User/tenant overrides

**Webhooks:**

- `webhooks` - Webhook configurations
- `webhook_deliveries` - Delivery attempts

**API:**

- `api_keys` - API key management
- `idempotency_keys` - Request idempotency
- `api_call_logs` - API call logging

## RLS Policy Patterns

### Tenant Isolation Pattern

```sql
-- Standard tenant isolation policy
CREATE POLICY "tenant_isolation" ON table_name
  FOR ALL
  TO authenticated
  USING (tenant_id IN (SELECT * FROM public.get_user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT * FROM public.get_user_tenant_ids()));
```

### User Ownership Pattern

```sql
-- User-owned resources
CREATE POLICY "user_ownership" ON table_name
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

### Service Role Pattern

```sql
-- Service role bypass
CREATE POLICY "service_role_access" ON table_name
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

## Troubleshooting

### "Function does not exist" errors

If you see errors about missing functions, ensure:

1. Extensions are installed (`uuid-ossp`, `pgcrypto`)
2. Helper functions are created (`get_user_tenant_ids`, `current_tenant_id`)

### RLS blocking queries

If RLS is blocking legitimate queries:

1. Check that user has proper tenant membership
2. Verify `get_user_tenant_ids()` returns expected tenant IDs
3. Check JWT claims include `tenant_id` if using JWT-based tenant context

### Missing tables

If tables are missing:

1. Check migration order - ensure base migrations ran first
2. Run `PATCH.sql` to create missing critical tables
3. For non-critical tables, run the specific migration file

## Manual Intervention Required

Some changes cannot be safely automated:

1. **Column Type Changes** - Requires data migration
2. **Dropping Columns** - Requires data backup
3. **Renaming Objects** - Requires application code updates
4. **Changing Constraints** - May require data cleanup

For these cases, create a separate migration file with proper guards.

## Next Steps

After running the validation:

1. ✅ Review gaps report
2. ✅ Apply patch
3. ✅ Verify results
4. ✅ Test application functionality
5. ✅ Monitor for any issues

## Support

If you encounter issues:

1. Check the gaps report output
2. Review PATCH.sql for what it's trying to create
3. Check database logs for detailed error messages
4. Verify connection has proper permissions (superuser or owner)

---

**Generated:** $(date)
**Schema Version:** Based on migrations up to 20250122000000_rls_enforcement_critical.sql
