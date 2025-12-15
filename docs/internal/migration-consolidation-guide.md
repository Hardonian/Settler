# Migration Consolidation Guide

## Overview

The Settler database has 62 migration files that can be consolidated into a smaller set of domain-organized files. This guide explains the consolidation strategy.

## Current State

- **62 migration files** across multiple domains
- **136 tables** total
- **110 functions** total
- **50+ tables** with RLS policies

## Consolidation Strategy

### Recommended Structure

Consolidate into **8 main files** organized by domain:

1. **01-core-schema.sql** - Core infrastructure
2. **02-billing-schema.sql** - Billing & subscriptions
3. **03-recon-core-schema.sql** - Reconciliation engine
4. **04-console-schema.sql** - Receipts & Feature Flags APIs
5. **05-tenant-builder-schema.sql** - Multi-tenant site builder
6. **06-functions.sql** - All database functions
7. **07-rls-policies.sql** - All RLS policies
8. **08-indexes-optimization.sql** - Performance indexes (optional)

### File Contents

#### 01-core-schema.sql
**From migrations:**
- `20251128193735_initial_schema.sql` (core tables)
- `20250121000000_tenant_system.sql` (tenant updates)
- `20250120000004_integration_credentials_schema.sql`
- `20250120000005_audit_logging_enhancements.sql`

**Tables:**
- tenants
- users
- api_keys
- jobs
- executions
- matches
- unmatched
- reports
- webhooks
- webhook_payloads
- webhook_deliveries
- webhook_configs
- audit_logs
- idempotency_keys
- revoked_tokens
- blocked_ips
- security_events
- tenant_usage
- tenant_quota_usage
- integration_credentials

#### 02-billing-schema.sql
**From migrations:**
- `20250120000000_billing_schema.sql`
- `20250120000001_billing_functions.sql`
- `20250120000002_billing_rls_policies.sql`
- `20250120000003_billing_security_enhancements.sql`
- `20250121000000_add_stripe_events_table.sql`
- `20250101000000_trial_subscription_fields.sql`
- `20260125000002_usage_counters.sql`
- `20260115000003_usage_tracking.sql`
- `20260120000011_billing_disputes.sql`

**Tables:**
- billing_accounts
- subscriptions
- add_ons
- add_on_purchases
- usage_events
- usage_aggregate_daily
- usage_counters
- stripe_events
- stripe_event_log
- billing_disputes

#### 03-recon-core-schema.sql
**From migrations:**
- `20250120000008_recon_core_foundation.sql`
- `20251128193816_reconciliation_graph_tables.sql`
- `20260128000006_90_day_survival_drift_detection.sql`

**Tables:**
- recon_jobs
- recon_results
- recon_templates
- recon_audits
- mapping_templates
- validation_rules
- transform_recipes
- contract_versions
- drift_events
- workflow_runs
- reconciliation_graph_nodes
- reconciliation_graph_edges
- reconciliation_candidates

#### 04-console-schema.sql
**From migrations:**
- `20260126000000_console_complete_setup.sql` (receipts & feature flags)
- `20260115000000_onboarding_progress.sql`
- `20260125000001_console_activity_logging.sql`
- `20260125000003_onboarding_audit.sql`

**Tables:**
- receipt_uploads
- receipts
- receipt_items
- feature_flags
- feature_flag_environments
- feature_flag_overrides
- onboarding_progress
- console_activities

#### 05-tenant-builder-schema.sql
**From migrations:**
- `20250121000000_tenant_system.sql` (partial - tenant builder parts)
- Related tenant page migrations

**Tables:**
- tenant_branding
- tenant_navigation
- tenant_pages
- tenant_page_revisions
- tenant_page_blocks
- experiments
- experiment_variants
- experiment_metric_events
- tenant_drafts
- tenant_versions

#### 06-functions.sql
**From migrations:**
- `20251128193816_functions_and_triggers.sql`
- `20250120000001_billing_functions.sql`
- All function definitions from other migrations

**Functions:**
- Helper functions (current_user_id, current_tenant_id)
- Tenant ID propagation functions
- Usage aggregation functions
- Billing calculation functions
- Audit logging functions
- All other utility functions

#### 07-rls-policies.sql
**From migrations:**
- `20251128193816_rls_policies.sql`
- `20250120000002_billing_rls_policies.sql`
- `20260125000000_console_rls_fixes.sql`
- `20260127000002_missing_rls_policies.sql`
- All RLS policy definitions

**Policies:**
- Tenant isolation policies
- User access policies
- Public read policies (where applicable)
- Service role policies

#### 08-indexes-optimization.sql (Optional)
**From migrations:**
- `20260127000004_critical_indexes.sql`
- Index definitions from all migrations

**Note:** Indexes can be kept with their respective tables in domain files, or consolidated here for optimization review.

## Consolidation Process

### Step 1: Extract Tables
For each domain file:
1. Read all relevant migration files
2. Extract `CREATE TABLE` statements
3. Remove duplicates (keep most complete version)
4. Ensure proper ordering (dependencies first)

### Step 2: Extract Functions
1. Collect all `CREATE FUNCTION` statements
2. Remove duplicates (keep latest version)
3. Group by category (helpers, triggers, business logic)

### Step 3: Extract Policies
1. Collect all `CREATE POLICY` statements
2. Group by table
3. Ensure no conflicts

### Step 4: Extract Indexes
1. Collect all `CREATE INDEX` statements
2. Remove duplicates
3. Verify all foreign keys have indexes

### Step 5: Verify Dependencies
1. Check foreign key order
2. Ensure functions are created before triggers
3. Ensure tables exist before policies

## Example Consolidation Script

```bash
#!/bin/bash
# Consolidate migrations by domain

DOMAINS=(
  "core:20251128193735_initial_schema.sql,20250121000000_tenant_system.sql"
  "billing:20250120000000_billing_schema.sql,20250120000001_billing_functions.sql"
  "recon:20250120000008_recon_core_foundation.sql"
)

for domain_info in "${DOMAINS[@]}"; do
  domain=$(echo $domain_info | cut -d: -f1)
  files=$(echo $domain_info | cut -d: -f2 | tr ',' ' ')
  
  echo "-- Consolidated: $domain" > "supabase/migrations-consolidated/01-${domain}-schema.sql"
  echo "-- Generated from: $files" >> "supabase/migrations-consolidated/01-${domain}-schema.sql"
  echo "" >> "supabase/migrations-consolidated/01-${domain}-schema.sql"
  
  for file in $files; do
    cat "supabase/migrations/$file" >> "supabase/migrations-consolidated/01-${domain}-schema.sql"
    echo "" >> "supabase/migrations-consolidated/01-${domain}-schema.sql"
  done
done
```

## Verification Checklist

After consolidation:

- [ ] All tables from original migrations are present
- [ ] All functions are included
- [ ] All RLS policies are included
- [ ] Foreign key dependencies are correct
- [ ] No duplicate table/function/policy definitions
- [ ] File order respects dependencies
- [ ] Comments indicate source migrations

## Migration Strategy

### Option 1: Fresh Start
1. Backup current database
2. Drop all tables (or use new database)
3. Run consolidated migrations in order
4. Verify schema matches

### Option 2: Incremental
1. Keep existing migrations
2. Create new consolidated files
3. Mark old migrations as deprecated
4. Gradually migrate to consolidated structure

### Option 3: Hybrid
1. Keep existing migrations for historical reference
2. Create consolidated files for new deployments
3. Use consolidated files for new environments

## Benefits

1. **Easier to understand** - Related tables grouped together
2. **Faster deployment** - Fewer files to process
3. **Better organization** - Clear domain boundaries
4. **Easier maintenance** - Find related changes quickly
5. **Reduced conflicts** - Less chance of migration order issues

## Risks

1. **Loss of history** - Migration timestamps lost
2. **Deployment complexity** - Need to handle existing vs new databases
3. **Rollback difficulty** - Harder to rollback specific changes
4. **Team coordination** - Need agreement on consolidation approach

## Recommendations

1. **Keep original migrations** in archive folder
2. **Document consolidation** in migration comments
3. **Test thoroughly** before deploying to production
4. **Use version control** to track consolidation changes
5. **Create rollback scripts** for each consolidated file

## Next Steps

1. Review this guide with team
2. Choose consolidation approach (fresh/incremental/hybrid)
3. Create consolidated files following structure above
4. Test on development database
5. Deploy to staging, then production
