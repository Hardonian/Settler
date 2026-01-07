# Verification & Rollback Runbook

## 1. Verification Steps

### A. Pre-Deployment Check
Run these commands locally or in a staging environment to ensure the migration is valid.

```bash
# 1. Apply the migration
supabase db reset # WARNING: Resets local DB
# OR just push the new migration
supabase db push

# 2. Verify RLS Policies exist for new tables
psql $DATABASE_URL -c "
  SELECT tablename, policyname, cmd, roles 
  FROM pg_policies 
  WHERE tablename IN ('tenant_pages', 'webhooks', 'experiments') 
  ORDER BY tablename, policyname;
"
# EXPECTED OUTPUT: Rows showing "Users can view..." policies for authenticated users.

# 3. Verify Tenant Isolation Function
psql $DATABASE_URL -c "SELECT count(*) FROM pg_proc WHERE proname = 'get_user_tenant_ids';"
# EXPECTED OUTPUT: 1
```

### B. CI/CD Checkpoints
The new GitHub Actions will perform these checks automatically:
1.  **Migration Guard**: Will fail if any public table is missing RLS.
2.  **Quality Gate**: Will fail if secrets are detected or build fails.

### C. Post-Deployment Smoke Test
After deploying to production:

```bash
# Check if the critical isolation function works
curl -X POST "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/rpc/get_user_tenant_ids" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer <VALID_USER_JWT>"
# EXPECTED: Returns list of UUIDs (tenant IDs) or empty list []. 
# SHOULD NOT ERROR (500).
```

## 2. Rollback Plan

### A. Database Rollback
If the `remainder_consolidation` migration causes issues (e.g., locking or performance regression):

1.  **Immediate Revert (SQL):**
    Run the following SQL to drop the new policies (the table structure itself wasn't changed, only policies added).

    ```sql
    BEGIN;
    -- Drop policies for Site Builder
    DROP POLICY IF EXISTS "Users can view pages for their tenants" ON tenant_pages;
    DROP POLICY IF EXISTS "Users can manage pages for their tenants" ON tenant_pages;
    -- Drop policies for Webhooks
    DROP POLICY IF EXISTS "Users can manage their webhooks" ON webhooks;
    -- ... repeat for other tables if necessary
    COMMIT;
    ```

2.  **Migration File Revert:**
    ```bash
    git rm supabase/migrations/20260107120000_remainder_consolidation.sql
    git commit -m "revert: remove remainder consolidation migration"
    git push origin main
    ```
    *Note: Supabase might try to re-apply if file is missing but migration history exists. Use `supabase db repair` if needed.*

### B. Runtime Rollback
If the new CI workflows block valid deploys:
1.  Disable the workflow in GitHub Actions UI.
2.  Revert the `.github/workflows/` changes in a new PR.
