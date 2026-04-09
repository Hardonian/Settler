# Complete Supabase AI Prompt for Settler Schema

Copy this entire document and paste it into Supabase AI Assistant for comprehensive schema assistance.

---

## Settler Database Schema - Complete Reference

You are helping with Settler's PostgreSQL database schema in Supabase. Here's everything you need to know:

### Core Principle: Tenant Isolation

**ALL tables enforce tenant isolation via RLS using `tenant_users` membership.**

- Pattern: `tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())`
- Never expose data across tenants
- Always include `tenant_id` in WHERE clauses

---

## NEW TABLES ADDED (Apply these migrations)

### 1. `receipts` - Tamper-Evident Receipts with Hash Chain

**Purpose**: Store receipts with SHA256 hash chain for audit trail integrity

**Schema**:

```sql
CREATE TABLE receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  source_id VARCHAR(255),
  canonical_json JSONB NOT NULL,           -- Stable key-sorted JSON
  hash VARCHAR(64) NOT NULL,               -- SHA256 hash of canonical_json
  prev_hash VARCHAR(64),                   -- Previous receipt hash (chain link)
  evidence_refs JSONB DEFAULT '[]'::jsonb, -- Safe evidence pointers (no secrets)
  summary TEXT NOT NULL,                    -- Narrative: what happened
  why_it_matters TEXT NOT NULL,            -- Narrative: business context
  next_steps TEXT,                         -- Narrative: suggested action
  created_by UUID NOT NULL,                -- auth.users.id
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Indexes**:

- `idx_receipts_tenant_id` ON `tenant_id`
- `idx_receipts_source_id` ON `source_id`
- `idx_receipts_hash` ON `hash` (for chain verification)
- `idx_receipts_prev_hash` ON `prev_hash` (for chain traversal)
- `idx_receipts_created_at` ON `created_at DESC` (for recent queries)
- `idx_receipts_tenant_created` ON `(tenant_id, created_at DESC)` (composite)
- GIN index on `canonical_json` (for JSONB queries)
- GIN index on `evidence_refs` (for evidence searches)

**RLS Policy**: `receipts_tenant_isolation`

```sql
CREATE POLICY receipts_tenant_isolation ON receipts
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
  );
```

**Hash Chain Logic**:

- `canonical_json`: Stable JSON serialization (keys sorted recursively)
- `hash`: SHA256(canonical_json) → 64 hex characters
- `prev_hash`: References `hash` of previous receipt for this tenant/source
- Verification: Check hash matches canonical JSON, verify prev_hash exists

**Common Queries**:

```sql
-- Get receipts for tenant
SELECT * FROM receipts
WHERE tenant_id = $1
ORDER BY created_at DESC;

-- Get previous receipt hash
SELECT hash FROM receipts
WHERE tenant_id = $1
ORDER BY created_at DESC
LIMIT 1;

-- Verify receipt chain
SELECT hash, prev_hash FROM receipts
WHERE tenant_id = $1 AND hash = $2;
```

---

### 2. `ai_analysis_usage` - AI Token Usage Tracking

**Purpose**: Track AI analysis token consumption per tenant per period

**Schema**:

```sql
CREATE TABLE ai_analysis_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,      -- Start of period (day/week/month)
  tokens_used INTEGER NOT NULL DEFAULT 0,  -- Cumulative tokens used
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, period_start)           -- One record per tenant per period
);
```

**Indexes**:

- `idx_ai_analysis_usage_tenant_id` ON `tenant_id`
- `idx_ai_analysis_usage_period_start` ON `period_start DESC`
- `idx_ai_analysis_usage_tenant_period` ON `(tenant_id, period_start DESC)`

**RLS Policy**: `ai_analysis_usage_tenant_isolation`

```sql
CREATE POLICY ai_analysis_usage_tenant_isolation ON ai_analysis_usage
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
  );
```

**Token Limits by Tier**:

- **Free**: 1 analysis per week (limit = 1, period = 'week')
- **Pro**: 10 analyses per month (limit = 10, period = 'month') + add-ons + overage
- **Enterprise**: Unlimited (limit = -1)

**Period Calculation**:

- **Day**: `date_trunc('day', NOW())`
- **Week**: `date_trunc('week', NOW())` (starts Sunday)
- **Month**: `date_trunc('month', NOW())` (starts 1st)

**Common Queries**:

```sql
-- Get current period usage
SELECT tokens_used, period_start
FROM ai_analysis_usage
WHERE tenant_id = $1
  AND period_start >= date_trunc('month', NOW())
ORDER BY period_start DESC
LIMIT 1;

-- Upsert token usage (increment)
INSERT INTO ai_analysis_usage (tenant_id, period_start, tokens_used)
VALUES ($1, date_trunc('month', NOW()), 10)
ON CONFLICT (tenant_id, period_start)
DO UPDATE SET
  tokens_used = ai_analysis_usage.tokens_used + EXCLUDED.tokens_used,
  updated_at = NOW();
```

---

### 3. `ai_analyses` - AI Analysis Results Storage

**Purpose**: Store AI analysis results with metadata

**Schema**:

```sql
CREATE TABLE ai_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  analysis_type VARCHAR(50) NOT NULL,      -- 'reconciliation', 'change_detection', 'anomaly', 'prediction'
  input_data JSONB,                        -- Optional input data
  result JSONB NOT NULL,                   -- {summary, insights[], recommendations[], confidence}
  tokens_used INTEGER NOT NULL,            -- Tokens consumed for this analysis
  confidence DECIMAL(3, 2),                -- Confidence score (0.00 to 1.00)
  created_by UUID NOT NULL,                -- auth.users.id
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Indexes**:

- `idx_ai_analyses_tenant_id` ON `tenant_id`
- `idx_ai_analyses_type` ON `analysis_type`
- `idx_ai_analyses_created_at` ON `created_at DESC`
- `idx_ai_analyses_tenant_created` ON `(tenant_id, created_at DESC)`
- GIN index on `result` (for JSONB queries)

**RLS Policy**: `ai_analyses_tenant_isolation`

```sql
CREATE POLICY ai_analyses_tenant_isolation ON ai_analyses
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
  );
```

**Result JSONB Structure**:

```json
{
  "summary": "Analysis summary text",
  "insights": ["insight1", "insight2"],
  "recommendations": ["rec1", "rec2"],
  "confidence": 0.85
}
```

**Common Queries**:

```sql
-- Get recent analyses
SELECT * FROM ai_analyses
WHERE tenant_id = $1
ORDER BY created_at DESC
LIMIT 10;

-- Get analyses by type
SELECT * FROM ai_analyses
WHERE tenant_id = $1 AND analysis_type = 'reconciliation'
ORDER BY created_at DESC;
```

---

## NEW FUNCTIONS

### `set_tenant_context(tenant_id UUID)`

**Purpose**: Set session variable for RLS policies that use `current_setting`

**Definition**:

```sql
CREATE OR REPLACE FUNCTION set_tenant_context(tenant_id UUID)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', tenant_id::text, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Grants**: `GRANT EXECUTE ON FUNCTION set_tenant_context(UUID) TO authenticated;`

**Usage**: Call before queries if using `current_setting('app.current_tenant_id')` in RLS

---

## UPDATED RLS POLICIES

These existing tables had RLS policies updated to use `tenant_users` membership:

### Tables Updated:

1. `recon_jobs`
2. `recon_results`
3. `recon_audits`
4. `drift_events`
5. `workflow_runs`
6. `alerts`

### New Policy Pattern:

```sql
CREATE POLICY table_tenant_isolation ON table_name
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
  );
```

**Why**: More reliable than `current_setting('app.current_tenant_id')` which requires session setup

---

## TRIGGERS

### `update_receipts_updated_at`

```sql
CREATE TRIGGER update_receipts_updated_at
  BEFORE UPDATE ON receipts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### `update_ai_analysis_usage_updated_at`

```sql
CREATE TRIGGER update_ai_analysis_usage_updated_at
  BEFORE UPDATE ON ai_analysis_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## MIGRATION FILES (Apply in Order)

1. **20260130000000_settler_receipts_hash_chain.sql**
   - Creates `receipts` table
   - Creates indexes
   - Creates RLS policy
   - Creates trigger

2. **20260130000001_settler_tenant_context_helper.sql**
   - Creates `set_tenant_context()` function
   - Grants execute permission

3. **20260130000002_settler_rls_hardening.sql**
   - Updates RLS policies for existing tables
   - Uses `tenant_users` membership

4. **20260130000003_settler_ai_tokens.sql**
   - Creates `ai_analysis_usage` table
   - Creates `ai_analyses` table
   - Creates indexes
   - Creates RLS policies
   - Creates trigger

---

## VERIFICATION QUERIES

### Check Tables Exist

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('receipts', 'ai_analysis_usage', 'ai_analyses');
```

### Check RLS Enabled

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('receipts', 'ai_analysis_usage', 'ai_analyses');
```

### Check Policies Exist

```sql
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('receipts', 'ai_analysis_usage', 'ai_analyses');
```

### Check Function Exists

```sql
SELECT proname, prosrc
FROM pg_proc
WHERE proname = 'set_tenant_context';
```

### Check Indexes

```sql
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('receipts', 'ai_analysis_usage', 'ai_analyses')
ORDER BY tablename, indexname;
```

---

## COMMON OPERATIONS

### Create Receipt with Hash Chain

```sql
-- 1. Get previous hash
SELECT hash FROM receipts
WHERE tenant_id = $1
ORDER BY created_at DESC
LIMIT 1;

-- 2. Calculate hash (in application: SHA256(canonical_json))
-- 3. Insert receipt
INSERT INTO receipts (
  tenant_id, canonical_json, hash, prev_hash,
  evidence_refs, summary, why_it_matters, next_steps, created_by
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8, $9
);
```

### Record Token Usage

```sql
INSERT INTO ai_analysis_usage (tenant_id, period_start, tokens_used)
VALUES ($1, date_trunc('month', NOW()), 10)
ON CONFLICT (tenant_id, period_start)
DO UPDATE SET
  tokens_used = ai_analysis_usage.tokens_used + EXCLUDED.tokens_used,
  updated_at = NOW();
```

### Store AI Analysis

```sql
INSERT INTO ai_analyses (
  tenant_id, analysis_type, input_data, result, tokens_used, confidence, created_by
) VALUES (
  $1, 'reconciliation', $2, $3, 10, 0.85, $4
);
```

### Get Token Usage Status

```sql
SELECT
  tokens_used,
  CASE
    WHEN period_start >= date_trunc('month', NOW()) THEN 'current_month'
    WHEN period_start >= date_trunc('week', NOW()) THEN 'current_week'
    ELSE 'past'
  END as period_status
FROM ai_analysis_usage
WHERE tenant_id = $1
ORDER BY period_start DESC
LIMIT 1;
```

---

## SECURITY RULES

1. **Always enforce tenant isolation** - Use `tenant_users` membership
2. **Never expose cross-tenant data** - Always filter by `tenant_id`
3. **Verify RLS is enabled** - Check `rowsecurity = true`
4. **Hash chain integrity** - Verify hash matches canonical JSON
5. **Token limits** - Check usage before allowing analyses
6. **Period calculations** - Use `date_trunc()` for consistency

---

## PERFORMANCE TIPS

1. **Use indexes**: Always include `tenant_id` in WHERE clauses
2. **Time queries**: Use `created_at DESC` for recent items
3. **JSONB searches**: Use GIN indexes with `@>` or `?` operators
4. **Composite indexes**: Use `(tenant_id, created_at DESC)` for common patterns
5. **Pagination**: Always LIMIT results

---

## WHEN HELPING WITH QUERIES

- ✅ Always include `tenant_id` filter
- ✅ Use indexed columns (`tenant_id`, `created_at`)
- ✅ Respect RLS policies
- ✅ Verify hash chains for receipts
- ✅ Check token limits before AI operations
- ✅ Use proper period calculations
- ❌ Never expose data across tenants
- ❌ Never bypass RLS
- ❌ Never store secrets in evidence_refs

---

## MIGRATION ORDER IS CRITICAL

Apply migrations in this exact order:

1. receipts table (foundation)
2. tenant context function (helper)
3. RLS hardening (security)
4. AI tokens (features)

---

End of Schema Reference
