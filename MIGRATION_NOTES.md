# Database Migration Notes

## Migrations Added

### 1. `20260130000000_settler_receipts_hash_chain.sql`

**Purpose**: Create receipts table with hash chain for tamper-evident audit trail

**Changes**:
- Creates `receipts` table with:
  - `canonical_json` (JSONB) - Normalized receipt data
  - `hash` (VARCHAR(64)) - SHA256 hash of canonical JSON
  - `prev_hash` (VARCHAR(64)) - Previous receipt hash for chain
  - `evidence_refs` (JSONB) - Evidence references (not raw secrets)
  - `summary`, `why_it_matters`, `next_steps` - Narrative fields
- RLS policy for tenant isolation
- Indexes for performance

**Rollback**: 
```sql
DROP TABLE IF EXISTS receipts CASCADE;
```

### 2. `20260130000001_settler_tenant_context_helper.sql`

**Purpose**: Helper function for setting tenant context in RLS policies

**Changes**:
- Creates `set_tenant_context(tenant_id UUID)` function
- Sets session variable `app.current_tenant_id`
- Grants execute to authenticated users

**Rollback**:
```sql
DROP FUNCTION IF EXISTS set_tenant_context(UUID);
```

### 3. `20260130000002_settler_rls_hardening.sql`

**Purpose**: Harden RLS policies to use tenant_users membership

**Changes**:
- Updates RLS policies for:
  - `recon_jobs`
  - `recon_results`
  - `recon_audits`
  - `drift_events`
  - `workflow_runs`
  - `alerts`
- Policies now use `tenant_users` membership instead of `current_setting`
- More reliable tenant isolation

**Rollback**: 
- Policies would need to be recreated manually
- Original policies used `current_setting('app.current_tenant_id')`

## Migration Order

1. Apply `20260130000000_settler_receipts_hash_chain.sql` first
2. Apply `20260130000001_settler_tenant_context_helper.sql` second
3. Apply `20260130000002_settler_rls_hardening.sql` last

## Verification Queries

### Check receipts table exists
```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'receipts'
);
```

### Check RLS is enabled
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('receipts', 'recon_results', 'alerts');
```

### Check policies exist
```sql
SELECT tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('receipts', 'recon_results', 'alerts');
```

### Test tenant isolation
```sql
-- As user in tenant A
SET ROLE authenticated;
SELECT set_tenant_context('tenant-a-uuid');
SELECT COUNT(*) FROM receipts; -- Should only see tenant A's receipts

-- As user in tenant B
SELECT set_tenant_context('tenant-b-uuid');
SELECT COUNT(*) FROM receipts; -- Should only see tenant B's receipts
```

## Known Issues

1. **Prisma bypasses RLS**: Receipts service manually verifies `billingAccountId` ownership
2. **Tenant resolution**: Uses `getPrimaryTenant()` which may need adjustment
3. **Receipts table**: May conflict with existing Prisma schema (needs alignment)

## Production Deployment

1. **Backup database** before applying migrations
2. **Test migrations** in staging first
3. **Verify RLS policies** work correctly
4. **Monitor** for any errors after deployment
5. **Rollback plan** ready if issues occur
