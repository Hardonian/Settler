# Supabase Schema Validation Summary

**Generated:** 2025-12-20  
**Purpose:** Identify missing tables, functions, and schema elements in Supabase backend ranked by importance

## Executive Summary

After comprehensive validation of the Supabase backend schema against:
- Prisma schema definitions (99 tables expected)
- Migration files (490 table references found)
- Codebase references (420 table references found)

**Key Findings:**
- **218 tables** currently exist in the golden schema migration
- **Critical missing tables** identified and ranked by importance
- **0 critical missing functions** (all referenced functions exist)

## Critical Missing Tables (Ranked by Importance)

### 🔴 CRITICAL PRIORITY (Importance: 20-23)

These tables are defined in Prisma schema and referenced in codebase, indicating they are essential for core functionality.

#### 1. `ingestion_sources` (Importance: 23)
- **Status:** Missing from migrations
- **Source:** Prisma schema + Codebase references
- **Why Critical:** Core ingestion pipeline table - required for data source management
- **Impact:** Ingestion pipeline will fail without this table
- **Action Required:** Create migration immediately

#### 2. `normalized_transactions` (Importance: 23)
- **Status:** Missing from migrations  
- **Source:** Prisma schema + Codebase references
- **Why Critical:** Core reconciliation table - stores normalized transaction data
- **Impact:** Reconciliation features will not work
- **Action Required:** Create migration immediately

#### 3. `kpi_new_users_week` (Importance: 20)
- **Status:** Missing from migrations and Prisma
- **Source:** Codebase references only
- **Why Critical:** Analytics/KPI tracking table referenced in code
- **Impact:** Analytics dashboards may fail
- **Action Required:** Verify if this is a view or table, create if needed

### 🟡 HIGH PRIORITY (Importance: 18)

These tables are defined in Prisma but may have naming mismatches (singular vs plural).

#### 4. `tenant_onboarding_progress` (Importance: 18)
- **Status:** Defined in Prisma, referenced in codebase
- **Note:** May exist as `tenant_onboarding_progress` - verify exact name
- **Action Required:** Verify existence, create if missing

#### 5. `onboarding_events` (Importance: 18)
- **Status:** Defined in Prisma, referenced in codebase
- **Action Required:** Verify existence, create if missing

#### 6. `ingestions` (Importance: 18)
- **Status:** Defined in Prisma, referenced in codebase
- **Note:** Related to `ingestion_sources` - part of ingestion pipeline
- **Action Required:** Create migration if missing

#### 7. `raw_records` (Importance: 18)
- **Status:** Defined in Prisma, referenced in codebase
- **Note:** Part of ingestion pipeline
- **Action Required:** Create migration if missing

#### 8. `reconciliation_runs` (Importance: 18)
- **Status:** Defined in Prisma, referenced in codebase
- **Note:** May exist as `reconciliation_runs` - verify
- **Action Required:** Verify existence, create if missing

#### 9. `reconciliation_matches` (Importance: 18)
- **Status:** Defined in Prisma, referenced in codebase
- **Note:** Related to reconciliation functionality
- **Action Required:** Verify existence, create if missing

#### 10. `exports` (Importance: 18)
- **Status:** Defined in Prisma, referenced in codebase
- **Note:** May exist as `data_exports` (found in golden schema)
- **Action Required:** Verify if `data_exports` is the same table or if `exports` is separate

### 🟢 MEDIUM PRIORITY (Importance: 15)

These tables are referenced in codebase but not defined in Prisma. May be views, temporary tables, or legacy references.

#### Potential Views/Computed Tables:
- `reconciliation_summary` - Likely a view
- `tenant_usage_view` - Likely a view  
- `error_hotspots_view` - Likely a view

#### Integration Tables (May be connector-specific):
- `QuickBooks`, `GA4`, `NetSuite`, `Square`, `TikTok`, `WhatsApp`, `Wix`, `WooCommerce`, `Xero`, `Shopify`
- **Note:** These may be connector configuration tables or may not need separate tables

#### Operational Tables:
- `kill_switches` - Operational control table
- `alert_history` - Alerting system table
- `fx_conversions` - Currency conversion table
- `saga_state` - Transaction/saga pattern state table
- `feature_flag_changes` - Feature flag audit table

## Missing Functions

**Status:** ✅ No critical missing functions found

All functions referenced in the codebase exist in migration files.

## Recommendations

### Immediate Actions (This Week)

1. **Create migrations for critical tables:**
   ```sql
   -- Priority 1: ingestion_sources
   -- Priority 2: normalized_transactions  
   -- Priority 3: Verify and create kpi_new_users_week
   ```

2. **Verify naming mismatches:**
   - Check if `subscriptions` exists (Prisma expects `subscription`)
   - Check if `tenants` exists (Prisma expects `tenant`)
   - Check if `experiments` exists (Prisma expects `experiment`)
   - Check if `webhooks` exists (Prisma expects `webhook`)

3. **Create ingestion pipeline tables:**
   - `ingestion_sources`
   - `ingestions`
   - `raw_records`
   - `normalized_transactions`

### Short-term Actions (This Month)

1. **Create reconciliation tables:**
   - `reconciliation_runs`
   - `reconciliation_matches`

2. **Create onboarding tables:**
   - `tenant_onboarding_progress`
   - `onboarding_events`

3. **Create export table:**
   - Verify `exports` vs `data_exports` relationship

### Long-term Actions (Next Quarter)

1. **Review and create operational tables:**
   - `kill_switches`
   - `alert_history`
   - `fx_conversions`

2. **Create analytics views:**
   - `reconciliation_summary`
   - `tenant_usage_view`
   - `error_hotspots_view`

3. **Review integration connector tables:**
   - Determine if separate tables needed for each connector
   - Or if connector config is stored in `ingestion_sources`

## Validation Methodology

1. **Prisma Schema Analysis:** Extracted 99 table definitions from `schema.prisma` and `schema-additions.prisma`
2. **Migration Analysis:** Scanned all SQL migration files for CREATE TABLE statements
3. **Codebase Analysis:** Searched TypeScript/JavaScript files for table/function references
4. **Importance Scoring:** 
   - +10 points: Defined in Prisma
   - +8 points: Referenced in codebase
   - +5 points: Critical business table
   - +7 points: Used in code but missing from Prisma

## Next Steps

1. Run validation script: `npx tsx scripts/validate-supabase-schema-refined.ts`
2. Review this summary with engineering team
3. Prioritize missing tables based on current sprint goals
4. Create migration files for high-priority tables
5. Update Prisma schema if tables exist with different names
6. Re-run validation after migrations are applied

## Files Generated

- `/workspace/supabase-validation-report.json` - Full JSON report with all findings
- `/workspace/docs/supabase-schema-validation-summary.md` - This document

---

**Note:** Some tables may exist with slightly different names (singular vs plural). Verify against the golden schema migration file before creating new tables.
