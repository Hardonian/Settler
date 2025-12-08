# Supabase Gaps Analysis

**Last Updated:** 2025-01-XX  
**Status:** Comprehensive review of Supabase integration gaps

---

## Executive Summary

This document identifies gaps, inconsistencies, and missing pieces in the Supabase integration. Most core functionality is in place, but several production-critical features are missing or incomplete.

---

## 1. Database & Migrations

### ✅ Strengths
- **Comprehensive schema:** 20+ tables covering core reconciliation, CRM, financial ledger, ecosystem features
- **Proper indexes:** Most tables have appropriate indexes for common queries
- **Foreign keys:** Proper relationships with CASCADE deletes where appropriate
- **Migrations are versioned:** Using timestamp-based migration files

### ⚠️ Issues Found

#### 1.1 Missing RLS Policies on Some Tables
**Status:** Most tables have RLS enabled, but policies may be incomplete

**Tables with RLS enabled but policies need review:**
- `webhook_configs` - No RLS policies found (may be intentional if system-level)
- `revoked_tokens` - RLS enabled but no policies in migration (may use service role only)
- `blocked_ips` - RLS enabled but no policies in migration (may use service role only)
- `security_events` - RLS enabled but no policies in migration (may use service role only)

**Recommendation:** Review these tables - if they're system-level (not tenant-scoped), document that. If tenant-scoped, add appropriate policies.

#### 1.2 Potential N+1 Query Patterns
**Status:** Need code review to confirm

**Suspect areas:**
- Reconciliation graph queries (nodes + edges)
- Webhook delivery processing (webhooks + deliveries)
- Report generation (jobs + executions + matches)

**Recommendation:** Add database views or use Supabase RPC functions to batch queries.

#### 1.3 Missing Indexes
**Status:** Most tables are well-indexed, but check:

**Potential missing indexes:**
```sql
-- Check if these queries are common:
-- 1. Jobs filtered by status + tenant + created_at
CREATE INDEX IF NOT EXISTS idx_jobs_tenant_status_created 
  ON jobs(tenant_id, status, created_at DESC);

-- 2. Executions filtered by status + tenant
CREATE INDEX IF NOT EXISTS idx_executions_tenant_status 
  ON executions(tenant_id, status, created_at DESC);

-- 3. Webhook deliveries pending retry (already exists, but verify)
-- idx_webhook_deliveries_pending_retry exists ✓
```

**Recommendation:** Profile actual query patterns in production before adding indexes.

#### 1.4 Schema Consistency Issues

**Issue:** `users` table has both:
- `tenant_id` (references `tenants.id`)
- But also references `auth.users` via Supabase Auth

**Current pattern:** The `users` table appears to be a custom profile table, not the Supabase Auth users table.

**Recommendation:** Document the relationship:
- Supabase `auth.users` → `users` table (via `id` or `email`)
- `users.tenant_id` → `tenants.id`

**Action:** Ensure sign-up flow creates both:
1. Supabase Auth user (`auth.users`)
2. Profile record (`users` table with `tenant_id`)

---

## 2. Row-Level Security (RLS)

### ✅ Strengths
- **RLS enabled** on all tenant-scoped tables
- **Consistent pattern:** Using `current_tenant_id()` helper function
- **Proper isolation:** Tenant data is properly isolated

### ⚠️ Issues Found

#### 2.1 `current_tenant_id()` Function Dependency
**Status:** Function exists but relies on JWT claims

**Current implementation:**
```sql
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS UUID AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Try JWT claim
  v_tenant_id := (current_setting('request.jwt.claims', true)::jsonb->>'tenant_id')::UUID;
  -- Fallback to session variable
  IF v_tenant_id IS NULL THEN
    v_tenant_id := current_setting('app.current_tenant_id', true)::UUID;
  END IF;
  RETURN v_tenant_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
```

**Issue:** Supabase Auth JWT may not include `tenant_id` by default.

**Recommendation:**
1. **Verify JWT claims:** Check if `tenant_id` is set in JWT during auth
2. **Alternative:** Use `auth.uid()` to look up tenant from `users` table:
   ```sql
   CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS UUID AS $$
   DECLARE
     v_tenant_id UUID;
   BEGIN
     SELECT tenant_id INTO v_tenant_id
     FROM users
     WHERE id = auth.uid()
     LIMIT 1;
     RETURN v_tenant_id;
   END;
   $$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
   ```

#### 2.2 RLS Policies Using `auth.uid()` vs `current_tenant_id()`
**Status:** Mixed patterns found

**Ecosystem schema** (profiles, posts, etc.) uses `auth.uid()`:
```sql
CREATE POLICY profiles_select_own ON profiles
  FOR SELECT USING (auth.uid() = user_id);
```

**Core schema** (jobs, executions, etc.) uses `current_tenant_id()`:
```sql
CREATE POLICY tenant_isolation_jobs ON jobs
  FOR ALL USING (tenant_id = current_tenant_id());
```

**Recommendation:** Standardize on one pattern:
- **Use `current_tenant_id()`** for tenant-scoped tables (jobs, executions, etc.)
- **Use `auth.uid()`** for user-owned tables (profiles, posts, etc.)

#### 2.3 Missing Policies for Service Role Operations
**Status:** Service role bypasses RLS automatically

**Recommendation:** Document that service role operations should:
1. Set `app.current_tenant_id` session variable when needed
2. Or use direct queries with explicit tenant filtering

---

## 3. Edge Functions

### ❌ Status: Not Implemented

**Current state:** `supabase/functions/` directory exists but is empty (only `.gitkeep`)

### Recommended Edge Functions

#### 3.1 Webhook Delivery Retry (`webhook-retry`)
**Purpose:** Retry failed webhook deliveries with exponential backoff

**Trigger:** Cron job (every 5 minutes) or webhook failure event

**Implementation:**
```typescript
// supabase/functions/webhook-retry/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Query pending retries
  const { data: deliveries } = await supabase
    .from('webhook_deliveries')
    .select('*')
    .eq('status', 'failed')
    .lte('next_retry_at', new Date().toISOString())
    .limit(100)

  // Process retries...
  // (See webhook-queue.ts for logic)
})
```

#### 3.2 Data Retention Cleanup (`data-retention`)
**Purpose:** Delete old data based on retention policies

**Trigger:** Cron job (daily at 2 AM UTC)

**Implementation:**
```typescript
// Delete old audit logs, error logs, etc. based on DATA_RETENTION_DAYS
```

#### 3.3 Email Sending (`send-email`)
**Purpose:** Send transactional emails via Resend

**Trigger:** Called from API routes or other edge functions

**Implementation:**
```typescript
// Use Resend API to send emails
// Store email logs in Supabase
```

#### 3.4 Cache Warming (`cache-warm`)
**Purpose:** Pre-warm frequently accessed data

**Trigger:** Cron job (hourly)

**Implementation:**
```typescript
// Query common KPI queries and cache results
```

### Setup Steps
1. Create edge function: `supabase functions new webhook-retry`
2. Deploy: `supabase functions deploy webhook-retry`
3. Configure cron: Add to `supabase/config.toml` or Supabase Dashboard

---

## 4. Storage

### ❌ Status: Not Configured

**Current state:** No storage buckets defined

### Recommended Buckets

#### 4.1 `exports` Bucket
**Purpose:** Store generated report exports (PDFs, CSVs)

**Access:** Private (authenticated users only)

**Policy:**
```sql
-- Users can upload/download their own tenant's exports
CREATE POLICY "Users can access their tenant's exports"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'exports' AND
    (storage.foldername(name))[1] = current_tenant_id()::text
  );
```

#### 4.2 `uploads` Bucket
**Purpose:** User-uploaded files (CSV imports, etc.)

**Access:** Private

**Policy:** Similar to exports bucket

#### 4.3 `public-assets` Bucket
**Purpose:** Public assets (logos, images)

**Access:** Public read, authenticated write

### Setup Steps
1. Create buckets in Supabase Dashboard → Storage
2. Add RLS policies via migration
3. Update code to use `supabase.storage.from('bucket-name')`

---

## 5. Cron Jobs / Scheduled Tasks

### ❌ Status: Not Configured

**Current state:** No cron jobs configured

### Recommended Cron Jobs

#### 5.1 Webhook Retry Processing
**Schedule:** Every 5 minutes
**Function:** `webhook-retry` edge function

#### 5.2 Data Retention Cleanup
**Schedule:** Daily at 2 AM UTC
**Function:** `data-retention` edge function

#### 5.3 Cache Warming
**Schedule:** Hourly
**Function:** `cache-warm` edge function

#### 5.4 Email Digest
**Schedule:** Daily at 9 AM UTC (user's timezone)
**Function:** `send-email-digest` edge function

### Setup Steps
1. Use Supabase Dashboard → Database → Cron Jobs
2. Or configure in `supabase/config.toml`:
   ```toml
   [cron]
   webhook-retry = "*/5 * * * *"
   data-retention = "0 2 * * *"
   ```

---

## 6. Realtime Subscriptions

### ✅ Status: Partially Configured

**Current state:**
- `posts` table has realtime enabled
- `notifications` table has realtime enabled
- Other tables may need realtime for live updates

### Recommendations

**Enable realtime for:**
- `jobs` (status updates)
- `executions` (progress updates)
- `webhook_deliveries` (delivery status)

**Add to migration:**
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE executions;
ALTER PUBLICATION supabase_realtime ADD TABLE webhook_deliveries;
```

---

## 7. Database Functions & RPCs

### ✅ Status: Some Functions Exist

**Existing functions:**
- `current_tenant_id()` - Tenant context helper
- `get_kpi_health_status()` - KPI query function
- `log_error()` - Error logging helper
- `calculate_account_balance()` - Financial ledger helper

### Recommended Additional Functions

#### 7.1 Batch Reconciliation Query
**Purpose:** Avoid N+1 queries when fetching reconciliation data

```sql
CREATE OR REPLACE FUNCTION get_reconciliation_summary(p_job_id UUID)
RETURNS TABLE (
  job_id UUID,
  execution_count BIGINT,
  match_count BIGINT,
  unmatched_count BIGINT,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    j.id,
    COUNT(DISTINCT e.id) as execution_count,
    COUNT(DISTINCT m.id) as match_count,
    COUNT(DISTINCT u.id) as unmatched_count,
    j.status
  FROM jobs j
  LEFT JOIN executions e ON e.job_id = j.id
  LEFT JOIN matches m ON m.job_id = j.id
  LEFT JOIN unmatched u ON u.job_id = j.id
  WHERE j.id = p_job_id
  GROUP BY j.id, j.status;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
```

#### 7.2 Tenant Usage Aggregation
**Purpose:** Efficiently query tenant usage metrics

```sql
CREATE OR REPLACE FUNCTION get_tenant_usage(p_tenant_id UUID, p_start_date TIMESTAMPTZ, p_end_date TIMESTAMPTZ)
RETURNS TABLE (
  job_count BIGINT,
  execution_count BIGINT,
  api_call_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT j.id) as job_count,
    COUNT(DISTINCT e.id) as execution_count,
    COUNT(DISTINCT a.id) as api_call_count
  FROM tenants t
  LEFT JOIN jobs j ON j.tenant_id = t.id AND j.created_at BETWEEN p_start_date AND p_end_date
  LEFT JOIN executions e ON e.tenant_id = t.id AND e.created_at BETWEEN p_start_date AND p_end_date
  LEFT JOIN audit_logs a ON a.tenant_id = t.id AND a.timestamp BETWEEN p_start_date AND p_end_date
  WHERE t.id = p_tenant_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
```

---

## 8. Migration Safety

### ⚠️ Issues Found

#### 8.1 Migration Order
**Status:** Migrations are timestamped but order may matter

**Current migrations:**
1. `20251128193735_initial_schema.sql` - Core tables
2. `20251128193816_functions_and_triggers.sql` - Functions
3. `20251128193816_reconciliation_graph_tables.sql` - Graph tables
4. `20251128193816_rls_policies.sql` - RLS policies
5. `20251129000000_crm_schema.sql` - CRM tables
6. `20251129000001_financial_ledger.sql` - Financial tables
7. `20251129000002_error_logs.sql` - Error logging
8. `20251129000003_lead_scoring.sql` - Lead scoring
9. `20251130000000_ecosystem_schema.sql` - Ecosystem tables
10. `20251130000001_seed_demo_data.sql` - Seed data
11. `20251130000002_kpi_rpc_function.sql` - KPI function

**Recommendation:** Ensure migrations can run independently (no dependencies on previous migrations' data).

#### 8.2 Rollback Strategy
**Status:** `rollback_template.sql` exists but no actual rollback migrations

**Recommendation:** For production, consider:
1. Creating rollback migrations for each forward migration
2. Or document manual rollback steps

---

## 9. Performance Considerations

### Indexes
**Status:** Most tables are well-indexed

**Recommendation:** Monitor slow queries in production and add indexes as needed.

### Connection Pooling
**Status:** Supabase connection pooling is enabled in config

**Recommendation:** Monitor connection pool usage and adjust `default_pool_size` if needed.

### Query Optimization
**Status:** Need production profiling

**Recommendation:**
1. Enable query logging in Supabase Dashboard
2. Use `EXPLAIN ANALYZE` on slow queries
3. Consider materialized views for expensive aggregations

---

## 10. Action Items Summary

### High Priority
1. ✅ **Verify `current_tenant_id()` function** - Ensure it works with Supabase Auth
2. ✅ **Add missing RLS policies** - Review `webhook_configs`, `revoked_tokens`, etc.
3. ✅ **Implement edge functions** - Start with `webhook-retry`
4. ✅ **Configure storage buckets** - At least `exports` bucket

### Medium Priority
1. ✅ **Add cron jobs** - Webhook retry, data retention
2. ✅ **Enable realtime** - For `jobs`, `executions`, `webhook_deliveries`
3. ✅ **Add RPC functions** - Batch queries to avoid N+1

### Low Priority
1. ✅ **Performance tuning** - Add indexes based on production queries
2. ✅ **Migration rollback** - Create rollback migrations

---

## 11. Testing Recommendations

### RLS Testing
- Test that users can only access their tenant's data
- Test that service role bypasses RLS correctly
- Test that `current_tenant_id()` works in all contexts

### Migration Testing
- Test migrations on a copy of production data
- Test rollback procedures
- Test migration order independence

### Edge Function Testing
- Test edge functions locally with `supabase functions serve`
- Test cron job triggers
- Test error handling and retries

---

## References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [Supabase Cron Jobs](https://supabase.com/docs/guides/database/extensions/pg_cron)
