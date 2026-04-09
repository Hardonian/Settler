# Settler Schema Summary for Supabase AI

## Quick Reference

### New Tables (3)

1. **receipts** - Hash chain receipts with tamper detection
2. **ai_analysis_usage** - Token usage tracking per period
3. **ai_analyses** - AI analysis results storage

### New Functions (1)

1. **set_tenant_context(UUID)** - Sets tenant context for RLS

### Updated Policies (6)

- recon_jobs, recon_results, recon_audits, drift_events, workflow_runs, alerts
- All now use `tenant_users` membership instead of `current_setting`

## Key Relationships

```
tenants (1) ──< (many) receipts
tenants (1) ──< (many) ai_analysis_usage
tenants (1) ──< (many) ai_analyses
tenant_users ──> (many) access to tenant data via RLS
```

## RLS Pattern

All tables use this RLS pattern:

```sql
CREATE POLICY table_tenant_isolation ON table_name
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
  );
```

## Token Management

- Tracked in `ai_analysis_usage`
- Unique per `(tenant_id, period_start)`
- Upserted on conflict
- Periods: day/week/month

## Hash Chain

- Receipts linked via `prev_hash`
- SHA256 hash of canonical JSON
- Verify integrity by checking hash matches JSON

## Indexes Strategy

- Foreign keys: Always indexed
- Time queries: `created_at DESC` indexed
- Composite: `(tenant_id, created_at DESC)` for common patterns
- JSONB: GIN indexes for searches

## Migration Files

1. `20260130000000_settler_receipts_hash_chain.sql`
2. `20260130000001_settler_tenant_context_helper.sql`
3. `20260130000002_settler_rls_hardening.sql`
4. `20260130000003_settler_ai_tokens.sql`

Apply in order!
