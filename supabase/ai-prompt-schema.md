# Supabase AI Schema Documentation

## Overview

This document describes all new schema additions for Settler's core features: meaningful changes, reconciliation, receipts with hash chains, alerts, and AI analysis with token management.

## New Tables

### 1. `receipts` Table
**Purpose**: Tamper-evident receipts with hash chain for audit trail

**Schema**:
```sql
CREATE TABLE receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  source_id VARCHAR(255),
  canonical_json JSONB NOT NULL,
  hash VARCHAR(64) NOT NULL, -- SHA256 hash (64 hex chars)
  prev_hash VARCHAR(64), -- Previous receipt hash for chain
  evidence_refs JSONB DEFAULT '[]'::jsonb,
  summary TEXT NOT NULL,
  why_it_matters TEXT NOT NULL,
  next_steps TEXT,
  created_by UUID NOT NULL, -- References auth.users
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Indexes**:
- `idx_receipts_tenant_id` ON `tenant_id`
- `idx_receipts_source_id` ON `source_id`
- `idx_receipts_hash` ON `hash`
- `idx_receipts_prev_hash` ON `prev_hash`
- `idx_receipts_created_at` ON `created_at DESC`
- `idx_receipts_tenant_created` ON `(tenant_id, created_at DESC)`
- GIN index on `canonical_json`
- GIN index on `evidence_refs`

**RLS Policy**: `receipts_tenant_isolation`
- Users can only see receipts for tenants they belong to
- Uses `tenant_users` table for membership check

**Key Features**:
- Hash chain: `prev_hash` references previous receipt's hash
- Canonical JSON: Stable serialization for consistent hashing
- Evidence references: Safe pointers (no secrets)
- Narrative fields: summary, why_it_matters, next_steps

### 2. `ai_analysis_usage` Table
**Purpose**: Track AI analysis token usage per tenant per period

**Schema**:
```sql
CREATE TABLE ai_analysis_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  tokens_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, period_start)
);
```

**Indexes**:
- `idx_ai_analysis_usage_tenant_id` ON `tenant_id`
- `idx_ai_analysis_usage_period_start` ON `period_start DESC`
- `idx_ai_analysis_usage_tenant_period` ON `(tenant_id, period_start DESC)`

**RLS Policy**: `ai_analysis_usage_tenant_isolation`
- Users can only see usage for their tenant

**Key Features**:
- Unique constraint on `(tenant_id, period_start)` prevents duplicates
- Tracks tokens used per period (day/week/month)
- Updated via upsert on conflict

### 3. `ai_analyses` Table
**Purpose**: Store AI analysis results

**Schema**:
```sql
CREATE TABLE ai_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  analysis_type VARCHAR(50) NOT NULL, -- 'reconciliation', 'change_detection', 'anomaly', 'prediction'
  input_data JSONB,
  result JSONB NOT NULL, -- Contains: summary, insights[], recommendations[], confidence
  tokens_used INTEGER NOT NULL,
  confidence DECIMAL(3, 2),
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Indexes**:
- `idx_ai_analyses_tenant_id` ON `tenant_id`
- `idx_ai_analyses_type` ON `analysis_type`
- `idx_ai_analyses_created_at` ON `created_at DESC`
- `idx_ai_analyses_tenant_created` ON `(tenant_id, created_at DESC)`
- GIN index on `result`

**RLS Policy**: `ai_analyses_tenant_isolation`
- Users can only see analyses for their tenant

**Key Features**:
- Flexible JSONB for analysis results
- Confidence scoring (0-1)
- Token usage tracking per analysis

## New Functions

### `set_tenant_context(tenant_id UUID)`
**Purpose**: Helper function to set tenant context for RLS policies

**Definition**:
```sql
CREATE OR REPLACE FUNCTION set_tenant_context(tenant_id UUID)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', tenant_id::text, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Usage**:
- Called before queries that use `current_setting('app.current_tenant_id')`
- Sets session variable for RLS policies
- SECURITY DEFINER allows setting config

**Grants**: `EXECUTE ON FUNCTION set_tenant_context(UUID) TO authenticated`

## Updated RLS Policies

### Existing Tables (Hardened)
The following tables had RLS policies updated to use `tenant_users` membership instead of `current_setting`:

1. **recon_jobs**
   - Policy: `recon_jobs_tenant_isolation`
   - Uses: `tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())`

2. **recon_results**
   - Policy: `recon_results_tenant_isolation`
   - Uses: `tenant_id IN (SELECT tenant_users WHERE user_id = auth.uid())`

3. **recon_audits**
   - Policy: `recon_audits_tenant_isolation`
   - Uses: `tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())`

4. **drift_events**
   - Policy: `drift_events_tenant_isolation`
   - Uses: `tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())`

5. **workflow_runs**
   - Policy: `workflow_runs_tenant_isolation`
   - Uses: `tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())`

6. **alerts**
   - Policy: `alerts_tenant_isolation`
   - Uses: `tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())`

## Triggers

### `update_receipts_updated_at`
**Purpose**: Automatically update `updated_at` timestamp on receipts

**Definition**:
```sql
CREATE TRIGGER update_receipts_updated_at
  BEFORE UPDATE ON receipts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### `update_ai_analysis_usage_updated_at`
**Purpose**: Automatically update `updated_at` timestamp on ai_analysis_usage

**Definition**:
```sql
CREATE TRIGGER update_ai_analysis_usage_updated_at
  BEFORE UPDATE ON ai_analysis_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Relationships

### Foreign Keys
- `receipts.tenant_id` → `tenants.id` (CASCADE DELETE)
- `receipts.created_by` → `auth.users.id` (no FK constraint, references auth schema)
- `ai_analysis_usage.tenant_id` → `tenants.id` (CASCADE DELETE)
- `ai_analyses.tenant_id` → `tenants.id` (CASCADE DELETE)
- `ai_analyses.created_by` → `auth.users.id` (no FK constraint)

### Tenant Membership
All tables use `tenant_users` table for RLS:
- `tenant_users.tenant_id` → `tenants.id`
- `tenant_users.user_id` → `auth.users.id` (or public.users)

## Token Management Logic

### Token Limits by Tier
- **Free**: 1 analysis per week
- **Pro**: 10 analyses per month + add-ons + overage
- **Enterprise**: Unlimited + base allocation

### Period Calculation
- **Day**: Resets at midnight UTC
- **Week**: Resets on Sunday at midnight UTC
- **Month**: Resets on 1st of month at midnight UTC

### Usage Tracking
- Tokens consumed per analysis (typically 10 tokens)
- Tracked in `ai_analysis_usage` table
- Upserted on `(tenant_id, period_start)` conflict
- Reset date calculated based on period type

## Hash Chain Logic

### Receipt Hash Chain
1. **Canonical JSON**: Stable key-sorted JSON serialization
2. **Hash Calculation**: SHA256 of canonical JSON → 64 hex chars
3. **Previous Hash**: References previous receipt's hash (if exists)
4. **Chain Verification**: 
   - Verify current hash matches canonical JSON
   - Verify previous hash exists in chain (if set)

### Hash Format
- **Algorithm**: SHA256
- **Format**: Hexadecimal string (64 characters)
- **Example**: `a1b2c3d4e5f6...` (64 chars)

## Query Patterns

### Get Receipt Chain
```sql
WITH RECURSIVE receipt_chain AS (
  SELECT id, hash, prev_hash, created_at
  FROM receipts
  WHERE tenant_id = $1 AND id = $2
  
  UNION ALL
  
  SELECT r.id, r.hash, r.prev_hash, r.created_at
  FROM receipts r
  INNER JOIN receipt_chain rc ON r.hash = rc.prev_hash
  WHERE r.tenant_id = $1
)
SELECT * FROM receipt_chain ORDER BY created_at;
```

### Get Token Usage
```sql
SELECT 
  tokens_used,
  period_start,
  CASE 
    WHEN period_start >= date_trunc('month', NOW()) THEN 'month'
    WHEN period_start >= date_trunc('week', NOW()) THEN 'week'
    ELSE 'day'
  END as period_type
FROM ai_analysis_usage
WHERE tenant_id = $1
ORDER BY period_start DESC
LIMIT 1;
```

### Get Meaningful Changes
```sql
-- From recon_results
SELECT 
  id,
  tenant_id,
  total_amount_unmatched as delta,
  currency,
  unmatched_source_count as mismatch_count,
  confidence_avg,
  started_at
FROM recon_results
WHERE tenant_id = $1
ORDER BY started_at DESC;

-- From drift_events
SELECT 
  id,
  tenant_id,
  drift_type,
  severity,
  field_path,
  created_at
FROM drift_events
WHERE tenant_id = $1 AND acknowledged = false
ORDER BY created_at DESC;
```

## Security Considerations

### RLS Enforcement
- All tables have RLS enabled
- Policies use `tenant_users` membership check
- No direct `current_setting` dependencies (more reliable)

### Hash Chain Security
- SHA256 is cryptographically secure
- Canonical JSON prevents hash manipulation
- Previous hash prevents chain tampering
- Evidence references don't contain secrets

### Token Security
- Token limits enforced at application level
- Usage tracked per tenant per period
- No cross-tenant token sharing
- Reset dates prevent token hoarding

## Performance Considerations

### Indexes
- All foreign keys indexed
- Time-based queries indexed (`created_at DESC`)
- Composite indexes for common queries (`tenant_id, created_at`)
- GIN indexes for JSONB queries

### Query Optimization
- Use `tenant_id` in WHERE clauses (indexed)
- Use `created_at DESC` for recent items (indexed)
- Use GIN indexes for JSONB searches
- Limit results with pagination

## Maintenance Queries

### Verify RLS Policies
```sql
SELECT 
  tablename, 
  policyname, 
  cmd, 
  qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('receipts', 'ai_analysis_usage', 'ai_analyses', 'recon_results', 'alerts');
```

### Check Table Existence
```sql
SELECT 
  table_name,
  CASE WHEN EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = t.table_name
  ) THEN 'exists' ELSE 'missing' END as status
FROM (VALUES 
  ('receipts'),
  ('ai_analysis_usage'),
  ('ai_analyses')
) AS t(table_name);
```

### Verify Function Exists
```sql
SELECT 
  proname as function_name,
  CASE WHEN EXISTS (
    SELECT FROM pg_proc WHERE proname = 'set_tenant_context'
  ) THEN 'exists' ELSE 'missing' END as status
FROM pg_proc
WHERE proname = 'set_tenant_context';
```

### Check Indexes
```sql
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('receipts', 'ai_analysis_usage', 'ai_analyses')
ORDER BY tablename, indexname;
```

## Migration Order

Migrations must be applied in this order:

1. `20260130000000_settler_receipts_hash_chain.sql` - Creates receipts table
2. `20260130000001_settler_tenant_context_helper.sql` - Creates helper function
3. `20260130000002_settler_rls_hardening.sql` - Updates RLS policies
4. `20260130000003_settler_ai_tokens.sql` - Creates AI token tables

## Common Operations

### Create Receipt
```sql
INSERT INTO receipts (
  tenant_id,
  canonical_json,
  hash,
  prev_hash,
  evidence_refs,
  summary,
  why_it_matters,
  next_steps,
  created_by
) VALUES (
  $1, -- tenant_id
  $2, -- canonical_json (JSONB)
  $3, -- hash (SHA256)
  $4, -- prev_hash (from previous receipt)
  $5, -- evidence_refs (JSONB array)
  $6, -- summary
  $7, -- why_it_matters
  $8, -- next_steps
  $9  -- created_by (user_id)
);
```

### Record Token Usage
```sql
INSERT INTO ai_analysis_usage (
  tenant_id,
  period_start,
  tokens_used
) VALUES (
  $1, -- tenant_id
  $2, -- period_start (TIMESTAMPTZ)
  $3  -- tokens_used (INTEGER)
)
ON CONFLICT (tenant_id, period_start)
DO UPDATE SET 
  tokens_used = ai_analysis_usage.tokens_used + EXCLUDED.tokens_used,
  updated_at = NOW();
```

### Store AI Analysis
```sql
INSERT INTO ai_analyses (
  tenant_id,
  analysis_type,
  input_data,
  result,
  tokens_used,
  confidence,
  created_by
) VALUES (
  $1, -- tenant_id
  $2, -- analysis_type
  $3, -- input_data (JSONB)
  $4, -- result (JSONB with summary, insights, recommendations, confidence)
  $5, -- tokens_used
  $6, -- confidence (0-1)
  $7  -- created_by
);
```

## AI Assistant Instructions

When helping with Settler's database:

1. **Always enforce tenant isolation** - Use `tenant_users` membership checks
2. **Respect RLS policies** - All queries must work with RLS enabled
3. **Use indexes** - Prefer indexed columns in WHERE clauses
4. **Hash chain integrity** - Verify hash chains when querying receipts
5. **Token limits** - Check token usage before allowing AI analyses
6. **Period calculations** - Use proper date truncation for periods
7. **JSONB queries** - Use GIN indexes for JSONB searches
8. **Error handling** - Never expose tenant data across boundaries

## Schema Version

**Current Version**: 20260130
**Migrations Applied**: 4
- 20260130000000_settler_receipts_hash_chain
- 20260130000001_settler_tenant_context_helper
- 20260130000002_settler_rls_hardening
- 20260130000003_settler_ai_tokens
