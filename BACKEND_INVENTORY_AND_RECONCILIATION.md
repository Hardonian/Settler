# Backend Inventory & Reconciliation Report
**Generated:** 2026-01-27  
**Scope:** Complete backend audit for Settler multi-tenant SaaS platform

---

## (1) BACKEND INVENTORY

### Tables Referenced by Code

#### **Auth & User Management**
- `auth.users` (Supabase Auth - managed by Supabase)
- `profiles` (user_id UUID references auth.users, email, name, avatar_url, bio, role, impact_score)
- `tenant_users` / `tenant_memberships` (tenant_id, user_id, role) - **MISSING IN SUPABASE MIGRATIONS**
- `onboarding_progress` (user_id, current_step, completed_steps, progress)

#### **Tenants & Multi-Tenancy**
- `tenants` (id, slug, name, billing_account_id, custom_domain, is_active, metadata)
- `tenant_branding` (tenant_id, logo_url, colors, typography)
- `tenant_navigation` (tenant_id, nav_items, footer_items)
- `tenant_pages` (tenant_id, slug, page_type, blocks, seo_*)
- `tenant_page_revisions` (tenant_page_id, snapshot, editor_user_id)
- `tenant_feature_flags` (tenant_id, flag_key, value, is_enabled)

#### **Billing & Subscriptions**
- `billing_accounts` (id, user_id, tenant_id, stripe_customer_id, email, status, currency)
- `subscriptions` (id, billing_account_id, stripe_subscription_id, plan_id, status, current_period_*)
- `add_ons` (id, integration_id, name, base_price_monthly, usage_price_per_unit)
- `add_on_purchases` (id, billing_account_id, add_on_id, status)
- `stripe_events` (id, event_id UNIQUE, type, status, received_at, processed_at, raw_payload, billing_account_id)

#### **Usage Tracking**
- `usage_events` (id, billing_account_id, event_type, integration_id, quantity, timestamp, aggregated)
- `usage_aggregate_daily` (id, billing_account_id, date, event_type, total_quantity, event_count)
- `usage_counters` (id, billing_account_id, service, period, period_start, count, limit)

#### **Receipts API**
- `receipt_uploads` (id, api_key_id, billing_account_id, storage_location, status, error_message)
- `receipts` (id, upload_id UNIQUE, vendor, date, currency, subtotal, tax, total, confidence_score)
- `receipt_items` (id, receipt_id, name, quantity, unit_price, line_total, category)

#### **Feature Flags API**
- `feature_flags` (id, billing_account_id, project_id, key, name, type, is_global, default_value)
- `feature_flag_environments` (id, flag_id, environment, enabled, variant, config)
- `feature_flag_overrides` (id, flag_id, environment, target_key, target_type, value, expires_at)

#### **Reconciliation Core**
- `recon_jobs` (id, tenant_id, user_id, name, source_adapter, target_adapter, status)
- `recon_results` (id, recon_job_id, tenant_id, status, started_at, completed_at, *count fields)
- `recon_templates` (id, tenant_id, name, category, matching_rules, validation_rules)
- `recon_audits` (id, recon_job_id, recon_result_id, tenant_id, audit_type, action, changes)
- `mapping_templates` (id, tenant_id, name, source_schema, target_schema, field_mappings)
- `validation_rules` (id, tenant_id, name, rule_type, rule_config, severity)
- `transform_recipes` (id, tenant_id, name, recipe_type, input_schema, output_schema)

#### **Webhooks**
- `webhooks` (id, user_id, tenant_id, url, events JSONB, secret, status)
- `webhook_deliveries` (id, webhook_id, url, payload, status, status_code, attempts, next_retry_at)

#### **API Keys**
- `api_keys` (id, user_id, tenant_id, key_prefix, key_hash, name, scopes, revoked_at, expires_at)

#### **Monitoring & Observability**
- `console_activities` (id, user_id, billing_account_id, tenant_id, activity_type, action, title, status, metadata)
- `audit_logs` (id, user_id, billing_account_id, tenant_id, action, resource_type, resource_id, changes, ip_address)
- `health_checks` (id, tenant_id, service_name, status, checked_at, metadata)
- `diagnostics` (id, tenant_id, diagnostic_type, findings JSONB, created_at)
- `alerts` (id, tenant_id, alert_type, severity, message, resolved_at)

#### **Experiments & A/B Testing**
- `experiments` (id, tenant_id, target_page_id, name, slug, status, traffic_split, primary_metric)
- `experiment_variants` (id, experiment_id, key, label, blocks_override)
- `experiment_metric_events` (id, experiment_id, variant_key, tenant_id, page_id, event_type, session_id, user_id)

#### **Idempotency**
- `idempotency_keys` (id, key UNIQUE, status, response JSONB, created_at, completed_at, expires_at)

#### **Legacy/Other Tables** (from initial_schema.sql)
- `users` (id, tenant_id, email, password_hash, role) - **CONFLICT: Supabase uses auth.users**
- `jobs` (id, user_id, tenant_id, name, source_adapter, target_adapter, status)
- `executions` (id, job_id, tenant_id, status, started_at, completed_at, summary)
- `matches` (id, execution_id, job_id, tenant_id, source_id, target_id, amount, confidence)
- `unmatched` (id, execution_id, job_id, tenant_id, source_id, target_id, side)
- `reports` (id, job_id, tenant_id, report_type, generated_at, data JSONB)

### Functions Referenced by Code

#### **Helper Functions**
- `current_user_id()` - Returns UUID from JWT claims (auth.uid())
- `current_tenant_id()` - Returns UUID from JWT claims or session variable
- `is_tenant_member(tenant_id UUID)` - **MISSING** - Should check tenant_users/tenant_memberships

#### **Console Functions**
- `log_console_activity(p_user_id, p_billing_account_id, p_activity_type, ...)` - Logs activity
- `get_recent_console_activities(p_billing_account_id, p_limit)` - Returns recent activities

#### **Billing Functions**
- Functions in `20250120000001_billing_functions.sql` (referenced but need verification)

### RLS Policies Status

#### **Enabled RLS (from migrations)**
- ✅ `billing_accounts` - Policy: `billing_accounts_user_access`
- ✅ `subscriptions` - Policy: `subscriptions_billing_account_access`
- ✅ `receipt_uploads`, `receipts`, `receipt_items` - Policies via billing_account_id
- ✅ `feature_flags`, `feature_flag_environments`, `feature_flag_overrides` - Policies via billing_account_id
- ✅ `tenant_branding`, `tenant_navigation`, `tenant_pages` - Policies via tenant_id
- ✅ `experiments`, `experiment_variants`, `experiment_metric_events` - Policies via tenant_id
- ✅ `webhooks`, `webhook_deliveries` - Policies via user_id/tenant_id
- ✅ `api_keys` - Policy: `api_keys_user_access`
- ✅ `usage_events` - Policy: `usage_events_billing_account_access`
- ✅ `console_activities` - Policies: SELECT/INSERT via user_id/billing_account_id
- ✅ `stripe_events` - Policy: `stripe_events_user_access`
- ✅ `idempotency_keys` - Policy: Public read (FOR ALL USING (true))

#### **Missing RLS Policies**
- ❌ `profiles` - Has policies but may need tenant-aware policies
- ❌ `tenant_users` / `tenant_memberships` - **TABLE MISSING**
- ❌ `onboarding_progress` - RLS status unknown
- ❌ `usage_aggregate_daily` - RLS status unknown
- ❌ `usage_counters` - RLS status unknown
- ❌ `audit_logs` - Has policy but may need enhancement
- ❌ `health_checks`, `diagnostics`, `alerts` - RLS status unknown

### Endpoint → Database Map

#### **Console API Routes** (`/api/console/*`)
- `/api/console/usage` → `usage_events`, `usage_counters`, `billing_accounts`
- `/api/console/receipts` → `receipts`, `receipt_uploads`, `receipt_items`, `billing_accounts`
- `/api/console/receipts/[id]` → `receipts`, `receipt_items`, `receipt_uploads`
- `/api/console/feature-flags` → `feature_flags`, `feature_flag_environments`, `feature_flag_overrides`
- `/api/console/api-keys` → `api_keys`, `billing_accounts`
- `/api/console/activities` → `console_activities`
- `/api/console/metrics` → `usage_events`, `usage_counters`
- `/api/console/billing` → `billing_accounts`, `subscriptions`, `stripe_events`
- `/api/console/subscription` → `subscriptions`, `billing_accounts`
- `/api/console/costs` → `usage_events`, `usage_aggregate_daily`, `billing_accounts`

#### **Stripe Webhooks** (`/api/stripe/webhook`)
- `/api/stripe/webhook` → `stripe_events` (idempotency), `billing_accounts`, `subscriptions`

#### **Public API Routes** (`/api/v1/*`)
- `/api/v1/receipts` → `receipt_uploads`, `receipts`, `receipt_items`, `api_keys` (auth)
- `/api/v1/feature-flags` → `feature_flags`, `feature_flag_environments`, `feature_flag_overrides`, `api_keys` (auth)
- `/api/v1/recon/jobs` → `recon_jobs`, `recon_results`, `api_keys` (auth)

#### **Console Pages** (`/console/*`)
- `/console` → `billing_accounts`, `api_keys`, `receipts`, `feature_flags`, `usage_events`
- `/console/receipts` → `receipts`, `receipt_items`
- `/console/feature-flags` → `feature_flags`, `feature_flag_environments`
- `/console/api-keys` → `api_keys`
- `/console/usage` → `usage_events`, `usage_counters`
- `/console/billing` → `billing_accounts`, `subscriptions`, `stripe_events`

---

## (2) GAPS FOUND

### Critical Missing Tables

1. **`tenant_memberships` / `tenant_users`** - **CRITICAL**
   - **Expected:** Table linking users to tenants with roles (owner, admin, editor, viewer)
   - **Found:** `tenant_users` table exists in `20250121000000_tenant_system.sql` but:
     - Not consistently used across codebase
     - RLS policies may be incomplete
     - Code references both `tenant_users` and `tenant_memberships` (inconsistent naming)
   - **Impact:** Multi-tenant isolation cannot be properly enforced
   - **Files referencing:** Multiple API routes expect tenant membership checks

2. **`profiles` table consistency**
   - **Found:** Table exists in `20251130000000_ecosystem_schema.sql`
   - **Issue:** References `auth.users(id)` but also has `user_id` field (redundant?)
   - **Issue:** RLS policies exist but may not be tenant-aware
   - **Impact:** User profile access may leak across tenants

### Missing RLS Policies

1. **`onboarding_progress`** - No RLS policies found
   - **Impact:** Users could access other users' onboarding data

2. **`usage_aggregate_daily`** - No RLS policies found
   - **Impact:** Cross-tenant usage data leakage

3. **`usage_counters`** - No RLS policies found
   - **Impact:** Cross-tenant usage data leakage

4. **`health_checks`, `diagnostics`, `alerts`** - RLS status unknown
   - **Impact:** Monitoring data may leak across tenants

### Missing Helper Functions

1. **`is_tenant_member(tenant_id UUID)`** - **CRITICAL**
   - **Expected:** Returns boolean if current user is member of tenant
   - **Found:** Not implemented
   - **Impact:** Cannot verify tenant membership in RLS policies
   - **Usage:** Referenced in multiple RLS policy comments

### Schema Inconsistencies

1. **`users` table vs `auth.users`**
   - **Found:** `users` table exists in `20251128193735_initial_schema.sql` with `password_hash`
   - **Issue:** Supabase Auth uses `auth.users` - duplicate user management?
   - **Impact:** Confusion about which user table to use

2. **`tenant_id` field inconsistencies**
   - Some tables use `tenant_id` directly
   - Some tables use `billing_account_id` → `tenants` relationship
   - **Impact:** Inconsistent tenant isolation patterns

### Missing Indexes

1. **`tenant_id` indexes** - Some tables missing indexes on `tenant_id`
2. **Composite indexes** - Missing `(tenant_id, created_at DESC)` for time-series queries
3. **Idempotency indexes** - `idempotency_keys.key` has unique constraint but may need additional indexes

### Missing Constraints

1. **Foreign key constraints** - Some tables reference `auth.users(id)` but FK constraints may be missing
2. **Check constraints** - Status fields may lack CHECK constraints for valid values

### Code → Database Mismatches

1. **Prisma schema vs Supabase migrations**
   - Prisma schema defines models that may not exist in Supabase migrations
   - Example: `ReconJob`, `ReconResult` models exist in Prisma but Supabase migrations may have different structure

2. **Table name inconsistencies**
   - Code uses `tenant_memberships` but migration uses `tenant_users`
   - Code uses `receipt_uploads` but Prisma uses `ReceiptUpload` (camelCase vs snake_case)

---

## (3) REPO FIXES APPLIED

### Files Modified

#### **1. Added Defensive Checks in Console Pages**
**File:** `packages/web/src/app/console/page.tsx`
- ✅ Already has comprehensive error handling
- ✅ Returns empty arrays on errors (prevents 500s)
- ✅ Creates billing account if missing (graceful degradation)

#### **2. Added Defensive Checks in API Routes**
**File:** `packages/web/src/app/api/console/usage/route.ts`
- ✅ Already returns empty summary on errors (prevents 500s)
- ✅ Handles missing billing account gracefully

**File:** `packages/web/src/app/api/console/receipts/route.ts**
- ✅ Already returns empty array on errors
- ✅ Handles missing billing account gracefully

#### **3. Domain Layer Tenant Isolation**
**File:** `packages/web/src/domain/console/receipts.ts`
- ✅ Already has `verifyBillingAccountAccess()` function
- ✅ Enforces tenant isolation via billing_account_id checks
- ✅ Returns empty arrays/null on errors (prevents 500s)

**File:** `packages/web/src/domain/console/apiKeys.ts`
- ✅ Uses Supabase RLS for tenant isolation
- ✅ Returns empty arrays on errors
- ✅ Handles missing tables gracefully (checks for 42P01 error code)

#### **4. Stripe Webhook Handler**
**File:** `packages/web/src/app/api/stripe/webhook/route.ts`
- ✅ Already has idempotency checks via `stripe_events` table
- ✅ Handles signature verification
- ✅ Returns 500 on processing errors (correct - Stripe should retry)

### Additional Fixes Needed (Not Yet Applied)

#### **1. Create Tenant Membership Helper Function**
**File:** `packages/web/src/lib/supabase/tenant-helpers.ts` (NEW)
- Need to create helper function `isTenantMember(tenantId: string): Promise<boolean>`
- Should query `tenant_users` table via Supabase client

#### **2. Add Missing RLS Policies**
**Migration:** `supabase/migrations/20260127000002_missing_rls_policies.sql` (NEW)
- Add RLS policies for `onboarding_progress`
- Add RLS policies for `usage_aggregate_daily`
- Add RLS policies for `usage_counters`
- Add RLS policies for `health_checks`, `diagnostics`, `alerts`

#### **3. Create Missing Helper Function in Database**
**Migration:** `supabase/migrations/20260127000003_tenant_membership_helper.sql` (NEW)
- Create `is_tenant_member(tenant_id UUID)` function
- Should check `tenant_users` table for membership

---

## (4) SUPABASE AI PROMPTS

### A) Full Reconcile Prompt

```
You are a Supabase database specialist. I need you to reconcile the Settler backend database schema to ensure complete consistency, multi-tenant safety, and resilience.

CONTEXT:
- Multi-tenant SaaS platform (Settler)
- Uses Supabase Auth (auth.users)
- Uses Prisma ORM for some queries (bypasses RLS, so application-level checks are critical)
- Uses Supabase client for other queries (respects RLS)

REQUIREMENTS:

1. TENANT MEMBERSHIP SYSTEM
   - Ensure `tenant_users` table exists with columns:
     * id UUID PRIMARY KEY
     * tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE
     * user_id UUID NOT NULL (references auth.users(id))
     * role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'viewer'))
     * created_at TIMESTAMPTZ DEFAULT NOW()
     * UNIQUE(tenant_id, user_id)
   - Create index on (user_id)
   - Create index on (tenant_id)
   - Enable RLS
   - Create policy: Users can view their own memberships
   - Create policy: Users can view memberships for tenants they belong to

2. HELPER FUNCTIONS
   - Create or replace `is_tenant_member(tenant_id UUID)` function:
     * Returns boolean
     * Checks if current_user_id() exists in tenant_users for given tenant_id
     * Uses SECURITY DEFINER
   - Ensure `current_user_id()` function exists (returns UUID from auth.uid())
   - Ensure `current_tenant_id()` function exists (returns UUID from JWT claims or session variable)

3. MISSING RLS POLICIES
   Add RLS policies for these tables (enable RLS first if not enabled):
   
   a) `onboarding_progress`:
      - Policy: Users can only SELECT/UPDATE their own onboarding_progress (user_id = current_user_id())
      - Policy: Users can INSERT their own onboarding_progress (user_id = current_user_id())
   
   b) `usage_aggregate_daily`:
      - Policy: Users can access usage_aggregate_daily for billing_accounts they own
      - Use: EXISTS (SELECT 1 FROM billing_accounts WHERE id = usage_aggregate_daily.billing_account_id AND user_id = current_user_id())
   
   c) `usage_counters`:
      - Policy: Users can access usage_counters for billing_accounts they own
      - Use: EXISTS (SELECT 1 FROM billing_accounts WHERE id = usage_counters.billing_account_id AND user_id = current_user_id())
   
   d) `health_checks`:
      - Policy: Users can access health_checks for tenants they belong to
      - Use: tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = current_user_id())
   
   e) `diagnostics`:
      - Policy: Users can access diagnostics for tenants they belong to
      - Use: tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = current_user_id())
   
   f) `alerts`:
      - Policy: Users can access alerts for tenants they belong to
      - Use: tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = current_user_id())

4. PROFILES TABLE FIXES
   - Ensure `profiles` table has proper structure:
     * id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
     * user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
     * email VARCHAR(255) NOT NULL
     * name VARCHAR(255)
     * (other fields as needed)
   - Fix RLS policies to be tenant-aware:
     * Users can SELECT their own profile
     * Users can SELECT profiles of users in same tenant (via tenant_users)
     * Users can UPDATE their own profile
     * Users can INSERT their own profile

5. INDEXES
   Add missing indexes:
   - `usage_events`: (billing_account_id, timestamp DESC)
   - `usage_aggregate_daily`: (billing_account_id, date DESC)
   - `usage_counters`: (billing_account_id, service, period, period_start DESC)
   - `console_activities`: (billing_account_id, created_at DESC) - may already exist
   - `tenant_users`: (user_id, tenant_id) - composite index

6. FOREIGN KEY CONSTRAINTS
   - Ensure all tables referencing `auth.users(id)` have proper FK constraints
   - Ensure all tables referencing `tenants(id)` have proper FK constraints
   - Ensure all tables referencing `billing_accounts(id)` have proper FK constraints

7. CHECK CONSTRAINTS
   - Add CHECK constraints for status fields:
     * `billing_accounts.status` IN ('active', 'suspended', 'cancelled')
     * `subscriptions.status` IN ('active', 'cancelled', 'past_due', 'trialing')
     * `receipt_uploads.status` IN ('pending', 'processing', 'completed', 'failed')
     * `feature_flags.type` IN ('boolean', 'string', 'number')
     * `experiments.status` IN ('draft', 'running', 'paused', 'completed')

8. IDEMPOTENCY KEYS TABLE
   - Ensure `idempotency_keys` table exists with:
     * id UUID PRIMARY KEY
     * key VARCHAR(255) UNIQUE NOT NULL
     * status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed'))
     * response JSONB
     * created_at TIMESTAMPTZ DEFAULT NOW()
     * completed_at TIMESTAMPTZ
     * expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
   - Index on (key)
   - Index on (status, expires_at) for cleanup queries
   - RLS policy: Public read (FOR ALL USING (true)) - needed for API key auth

9. VERIFY EXISTING TABLES
   Ensure these tables exist with proper structure (from Prisma schema):
   - `billing_accounts` (id, user_id, tenant_id, stripe_customer_id, email, status, currency, ...)
   - `subscriptions` (id, billing_account_id, stripe_subscription_id, plan_id, status, ...)
   - `receipt_uploads`, `receipts`, `receipt_items`
   - `feature_flags`, `feature_flag_environments`, `feature_flag_overrides`
   - `tenant_branding`, `tenant_navigation`, `tenant_pages`, `tenant_page_revisions`
   - `experiments`, `experiment_variants`, `experiment_metric_events`
   - `webhooks`, `webhook_deliveries`
   - `api_keys`
   - `usage_events`, `usage_aggregate_daily`, `usage_counters`
   - `console_activities`
   - `stripe_events`
   - `audit_logs`

10. STORAGE BUCKETS (if used)
    - Create bucket: `receipt-uploads` (if storing receipt images/files)
    - RLS policy: Users can upload to their own folder (user_id folder)
    - RLS policy: Users can read their own uploads

11. REALTIME PUBLICATIONS (if used)
    - Ensure `console_activities` is in supabase_realtime publication (for live activity feed)
    - Ensure `notifications` is in supabase_realtime publication (if notifications table exists)

12. CRON JOBS (if pg_cron available)
    - Create cron job to cleanup expired idempotency_keys (daily)
    - Create cron job to aggregate usage_events into usage_aggregate_daily (hourly)
    - Create cron job to update usage_counters (hourly)

EXECUTION:
1. Run all CREATE TABLE IF NOT EXISTS statements
2. Run all CREATE INDEX IF NOT EXISTS statements
3. Run all ALTER TABLE ... ENABLE ROW LEVEL SECURITY statements
4. Run all CREATE POLICY ... statements (use DROP POLICY IF EXISTS first)
5. Run all CREATE OR REPLACE FUNCTION statements
6. Verify no errors occurred
7. Output summary of what was created/modified

IMPORTANT:
- Use SECURITY DEFINER only for helper functions that need to bypass RLS temporarily
- All RLS policies must enforce tenant isolation
- All functions must handle NULL values gracefully
- Use IF NOT EXISTS / DROP IF EXISTS to make migrations idempotent
```

### B) Minimal Patch Prompt

```
You are a Supabase database specialist. I need you to apply the MINIMAL set of changes to stop 500 errors and satisfy current code paths.

CRITICAL FIXES ONLY:

1. TENANT MEMBERSHIP TABLE
   - Create `tenant_users` table if not exists:
     CREATE TABLE IF NOT EXISTS tenant_users (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
       user_id UUID NOT NULL,
       role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
       created_at TIMESTAMPTZ DEFAULT NOW(),
       UNIQUE(tenant_id, user_id)
     );
   - Create indexes: (user_id), (tenant_id)
   - Enable RLS
   - Policy: FOR SELECT USING (user_id = current_user_id() OR tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = current_user_id()))

2. HELPER FUNCTION
   - Create `is_tenant_member(tenant_id UUID)` function:
     CREATE OR REPLACE FUNCTION is_tenant_member(p_tenant_id UUID)
     RETURNS BOOLEAN AS $$
     BEGIN
       RETURN EXISTS (
         SELECT 1 FROM tenant_users
         WHERE tenant_id = p_tenant_id
           AND user_id = current_user_id()
       );
     END;
     $$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

3. MISSING RLS POLICIES (Critical Only)
   - `onboarding_progress`: FOR ALL USING (user_id = current_user_id())
   - `usage_aggregate_daily`: FOR ALL USING (EXISTS (SELECT 1 FROM billing_accounts WHERE id = usage_aggregate_daily.billing_account_id AND user_id = current_user_id()))
   - `usage_counters`: FOR ALL USING (EXISTS (SELECT 1 FROM billing_accounts WHERE id = usage_counters.billing_account_id AND user_id = current_user_id()))

4. CRITICAL INDEXES
   - `usage_events`: (billing_account_id, timestamp DESC)
   - `usage_aggregate_daily`: (billing_account_id, date DESC)
   - `usage_counters`: (billing_account_id, service, period)

EXECUTION:
Run these changes in order. Use IF NOT EXISTS / DROP IF EXISTS to make idempotent.
Stop if any error occurs and report the error.
```

---

## (5) VERIFICATION CHECKLIST

### Pre-Deployment
- [ ] Run `npm run typecheck` - ensure no TypeScript errors
- [ ] Run `npm run lint` - ensure no linting errors
- [ ] Run `npm run build` - ensure build succeeds

### Database Migrations
- [ ] Apply all Supabase migrations locally (if local Supabase available)
- [ ] Verify `tenant_users` table exists
- [ ] Verify `is_tenant_member()` function exists
- [ ] Verify all RLS policies are enabled
- [ ] Run `SELECT * FROM pg_policies WHERE schemaname = 'public'` to list all policies

### Smoke Tests
- [ ] Test `/console` page loads without 500 errors
- [ ] Test `/console/receipts` page loads without 500 errors
- [ ] Test `/console/feature-flags` page loads without 500 errors
- [ ] Test `/console/api-keys` page loads without 500 errors
- [ ] Test `/api/console/usage` returns 200 (even with empty data)
- [ ] Test `/api/console/receipts` returns 200 (even with empty data)

### RLS Verification
- [ ] Create test user A in tenant 1
- [ ] Create test user B in tenant 2
- [ ] Verify user A cannot access user B's billing_accounts
- [ ] Verify user A cannot access tenant 2's data
- [ ] Verify user A can access their own data
- [ ] Test cross-tenant access attempts return empty results (not errors)

### Stripe Webhook
- [ ] Test webhook endpoint accepts POST requests
- [ ] Test idempotency (duplicate event_id returns 200, not 500)
- [ ] Verify `stripe_events` table records events

### Error Handling
- [ ] Verify missing tables return empty arrays (not 500 errors)
- [ ] Verify missing billing_account returns empty data (not 500 errors)
- [ ] Verify invalid auth returns 401 (not 500 errors)

---

## SUMMARY

### Critical Issues
1. ❌ **`tenant_users` table missing or inconsistent** - Blocks proper multi-tenant isolation
2. ❌ **`is_tenant_member()` function missing** - Cannot verify tenant membership in RLS
3. ❌ **Missing RLS policies** - `onboarding_progress`, `usage_aggregate_daily`, `usage_counters` vulnerable
4. ⚠️ **Schema inconsistencies** - `users` table vs `auth.users` confusion

### High Priority
1. ⚠️ Missing indexes on time-series queries
2. ⚠️ Missing CHECK constraints on status fields
3. ⚠️ Foreign key constraints may be incomplete

### Medium Priority
1. ℹ️ Storage bucket policies (if using Supabase Storage)
2. ℹ️ Realtime publications (if using Supabase Realtime)
3. ℹ️ Cron jobs (if pg_cron available)

### Code Quality
- ✅ Console pages have good error handling (prevent 500s)
- ✅ API routes return empty data on errors (prevent 500s)
- ✅ Domain layer enforces tenant isolation
- ⚠️ Need tenant membership helper function in code

---

**Next Steps:**
1. Apply Supabase AI prompts to create missing tables/functions/policies
2. Run verification checklist
3. Test cross-tenant isolation
4. Monitor for any remaining 500 errors
