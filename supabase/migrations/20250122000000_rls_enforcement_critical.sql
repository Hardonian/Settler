-- ============================================================================
-- CRITICAL RLS ENFORCEMENT MIGRATION
-- ============================================================================
-- This migration enables RLS on ALL critical tables and creates tenant isolation policies
-- BLOCKING LAUNCH until this is complete
-- ============================================================================

BEGIN;

-- ============================================================================
-- Helper function to ensure tenant isolation
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_tenant_ids()
RETURNS SETOF uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
BEGIN
  -- Get tenant IDs from billing_accounts
  RETURN QUERY
  SELECT DISTINCT COALESCE(ba.tenant_id, ba.id::uuid)
  FROM billing_accounts ba
  WHERE ba.user_id = auth.uid()
    AND ba.status = 'active'
    AND ba.deleted_at IS NULL;
  
  -- Also check tenant_users if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tenant_users') THEN
    RETURN QUERY
    SELECT DISTINCT tu.tenant_id
    FROM tenant_users tu
    WHERE tu.user_id = auth.uid();
  END IF;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_user_tenant_ids() TO authenticated;

-- ============================================================================
-- CRITICAL TABLES: Billing & Subscriptions
-- ============================================================================

-- billing_accounts
ALTER TABLE billing_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own billing accounts" ON billing_accounts;
CREATE POLICY "Users can view their own billing accounts"
  ON billing_accounts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own billing accounts" ON billing_accounts;
CREATE POLICY "Users can update their own billing accounts"
  ON billing_accounts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view subscriptions for their billing accounts" ON subscriptions;
CREATE POLICY "Users can view subscriptions for their billing accounts"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (
    billing_account_id IN (
      SELECT id FROM billing_accounts WHERE user_id = auth.uid()
    )
  );

-- usage_events
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view usage for their billing accounts" ON usage_events;
CREATE POLICY "Users can view usage for their billing accounts"
  ON usage_events FOR SELECT
  TO authenticated
  USING (
    billing_account_id IN (
      SELECT id FROM billing_accounts WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role can insert usage events" ON usage_events;
CREATE POLICY "Service role can insert usage events"
  ON usage_events FOR INSERT
  TO service_role
  WITH CHECK (true);

-- usage_aggregate_daily
ALTER TABLE usage_aggregate_daily ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view usage aggregates for their billing accounts" ON usage_aggregate_daily;
CREATE POLICY "Users can view usage aggregates for their billing accounts"
  ON usage_aggregate_daily FOR SELECT
  TO authenticated
  USING (
    billing_account_id IN (
      SELECT id FROM billing_accounts WHERE user_id = auth.uid()
    )
  );

-- usage_counters
ALTER TABLE usage_counters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view usage counters for their billing accounts" ON usage_counters;
CREATE POLICY "Users can view usage counters for their billing accounts"
  ON usage_counters FOR SELECT
  TO authenticated
  USING (
    billing_account_id IN (
      SELECT id FROM billing_accounts WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- CRITICAL TABLES: Reconciliation Core
-- ============================================================================

-- recon_jobs
ALTER TABLE recon_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view recon jobs for their tenants" ON recon_jobs;
CREATE POLICY "Users can view recon jobs for their tenants"
  ON recon_jobs FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (SELECT * FROM public.get_user_tenant_ids())
    OR tenant_id IN (
      SELECT COALESCE(tenant_id, id::uuid) FROM billing_accounts WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create recon jobs for their tenants" ON recon_jobs;
CREATE POLICY "Users can create recon jobs for their tenants"
  ON recon_jobs FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT * FROM public.get_user_tenant_ids())
    OR tenant_id IN (
      SELECT COALESCE(tenant_id, id::uuid) FROM billing_accounts WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update recon jobs for their tenants" ON recon_jobs;
CREATE POLICY "Users can update recon jobs for their tenants"
  ON recon_jobs FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (SELECT * FROM public.get_user_tenant_ids())
    OR tenant_id IN (
      SELECT COALESCE(tenant_id, id::uuid) FROM billing_accounts WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    tenant_id IN (SELECT * FROM public.get_user_tenant_ids())
    OR tenant_id IN (
      SELECT COALESCE(tenant_id, id::uuid) FROM billing_accounts WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete recon jobs for their tenants" ON recon_jobs;
CREATE POLICY "Users can delete recon jobs for their tenants"
  ON recon_jobs FOR DELETE
  TO authenticated
  USING (
    tenant_id IN (SELECT * FROM public.get_user_tenant_ids())
    OR tenant_id IN (
      SELECT COALESCE(tenant_id, id::uuid) FROM billing_accounts WHERE user_id = auth.uid()
    )
  );

-- recon_results
ALTER TABLE recon_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view recon results for their tenants" ON recon_results;
CREATE POLICY "Users can view recon results for their tenants"
  ON recon_results FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (SELECT * FROM public.get_user_tenant_ids())
    OR tenant_id IN (
      SELECT COALESCE(tenant_id, id::uuid) FROM billing_accounts WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role can insert recon results" ON recon_results;
CREATE POLICY "Service role can insert recon results"
  ON recon_results FOR INSERT
  TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can update recon results" ON recon_results;
CREATE POLICY "Service role can update recon results"
  ON recon_results FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- recon_audits
ALTER TABLE recon_audits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view recon audits for their tenants" ON recon_audits;
CREATE POLICY "Users can view recon audits for their tenants"
  ON recon_audits FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (SELECT * FROM public.get_user_tenant_ids())
    OR tenant_id IN (
      SELECT COALESCE(tenant_id, id::uuid) FROM billing_accounts WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- CRITICAL TABLES: Ingestion & Transactions
-- ============================================================================

-- ingestion_sources
ALTER TABLE ingestion_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view ingestion sources for their tenants" ON ingestion_sources;
CREATE POLICY "Users can view ingestion sources for their tenants"
  ON ingestion_sources FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (SELECT * FROM public.get_user_tenant_ids())
    OR tenant_id IN (
      SELECT COALESCE(tenant_id, id::uuid) FROM billing_accounts WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create ingestion sources for their tenants" ON ingestion_sources;
CREATE POLICY "Users can create ingestion sources for their tenants"
  ON ingestion_sources FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT * FROM public.get_user_tenant_ids())
    OR tenant_id IN (
      SELECT COALESCE(tenant_id, id::uuid) FROM billing_accounts WHERE user_id = auth.uid()
    )
  );

-- normalized_transactions
ALTER TABLE normalized_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view transactions for their tenants" ON normalized_transactions;
CREATE POLICY "Users can view transactions for their tenants"
  ON normalized_transactions FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (SELECT * FROM public.get_user_tenant_ids())
    OR tenant_id IN (
      SELECT COALESCE(tenant_id, id::uuid) FROM billing_accounts WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role can insert transactions" ON normalized_transactions;
CREATE POLICY "Service role can insert transactions"
  ON normalized_transactions FOR INSERT
  TO service_role
  WITH CHECK (true);

-- reconciliation_runs
ALTER TABLE reconciliation_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view reconciliation runs for their tenants" ON reconciliation_runs;
CREATE POLICY "Users can view reconciliation runs for their tenants"
  ON reconciliation_runs FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (SELECT * FROM public.get_user_tenant_ids())
    OR tenant_id IN (
      SELECT COALESCE(tenant_id, id::uuid) FROM billing_accounts WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role can insert reconciliation runs" ON reconciliation_runs;
CREATE POLICY "Service role can insert reconciliation runs"
  ON reconciliation_runs FOR INSERT
  TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can update reconciliation runs" ON reconciliation_runs;
CREATE POLICY "Service role can update reconciliation runs"
  ON reconciliation_runs FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- reconciliation_matches
ALTER TABLE reconciliation_matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view matches for their tenants" ON reconciliation_matches;
CREATE POLICY "Users can view matches for their tenants"
  ON reconciliation_matches FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (SELECT * FROM public.get_user_tenant_ids())
    OR tenant_id IN (
      SELECT COALESCE(tenant_id, id::uuid) FROM billing_accounts WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role can insert matches" ON reconciliation_matches;
CREATE POLICY "Service role can insert matches"
  ON reconciliation_matches FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ============================================================================
-- CRITICAL TABLES: Receipts & Feature Flags (if keeping)
-- ============================================================================

-- receipt_uploads
ALTER TABLE receipt_uploads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view receipt uploads for their billing accounts" ON receipt_uploads;
CREATE POLICY "Users can view receipt uploads for their billing accounts"
  ON receipt_uploads FOR SELECT
  TO authenticated
  USING (
    billing_account_id IN (
      SELECT id FROM billing_accounts WHERE user_id = auth.uid()
    )
    OR billing_account_id IS NULL -- Allow unauthenticated for playground
  );

DROP POLICY IF EXISTS "Users can create receipt uploads" ON receipt_uploads;
CREATE POLICY "Users can create receipt uploads"
  ON receipt_uploads FOR INSERT
  TO authenticated
  WITH CHECK (
    billing_account_id IN (
      SELECT id FROM billing_accounts WHERE user_id = auth.uid()
    )
    OR billing_account_id IS NULL
  );

-- receipts
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view receipts for their uploads" ON receipts;
CREATE POLICY "Users can view receipts for their uploads"
  ON receipts FOR SELECT
  TO authenticated
  USING (
    upload_id IN (
      SELECT id FROM receipt_uploads
      WHERE billing_account_id IN (
        SELECT id FROM billing_accounts WHERE user_id = auth.uid()
      )
      OR billing_account_id IS NULL
    )
  );

-- feature_flags
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view feature flags for their billing accounts" ON feature_flags;
CREATE POLICY "Users can view feature flags for their billing accounts"
  ON feature_flags FOR SELECT
  TO authenticated
  USING (
    billing_account_id IN (
      SELECT id FROM billing_accounts WHERE user_id = auth.uid()
    )
    OR billing_account_id IS NULL
  );

DROP POLICY IF EXISTS "Users can create feature flags for their billing accounts" ON feature_flags;
CREATE POLICY "Users can create feature flags for their billing accounts"
  ON feature_flags FOR INSERT
  TO authenticated
  WITH CHECK (
    billing_account_id IN (
      SELECT id FROM billing_accounts WHERE user_id = auth.uid()
    )
    OR billing_account_id IS NULL
  );

-- ============================================================================
-- CRITICAL TABLES: Tenants
-- ============================================================================

-- tenants
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their tenants" ON tenants;
CREATE POLICY "Users can view their tenants"
  ON tenants FOR SELECT
  TO authenticated
  USING (
    id IN (SELECT * FROM public.get_user_tenant_ids())
    OR billing_account_id IN (
      SELECT id FROM billing_accounts WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- Add indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_billing_accounts_user_id ON billing_accounts(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_recon_jobs_tenant_id ON recon_jobs(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_normalized_transactions_tenant_id ON normalized_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_runs_tenant_id ON reconciliation_runs(tenant_id);

COMMIT;
