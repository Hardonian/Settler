-- ============================================================================
-- SECURITY, BILLING, AND DATA INTEGRITY ENFORCEMENT
-- ============================================================================
-- This migration enforces Settler's business rules at the database level:
-- 1. Strict tenant isolation via RLS policies
-- 2. Billing account and subscription requirements
-- 3. Add-on purchase verification
-- 4. Paid feature access controls
-- ============================================================================

BEGIN;

-- ============================================================================
-- HELPER FUNCTIONS FOR BILLING ENFORCEMENT
-- ============================================================================

-- Function to check if user has active subscription
CREATE OR REPLACE FUNCTION public.has_active_subscription(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'auth'
AS $$
DECLARE
  v_billing_account_id UUID;
  v_subscription_count INTEGER;
BEGIN
  -- Get billing account for user
  SELECT id INTO v_billing_account_id
  FROM public.billing_accounts
  WHERE user_id = p_user_id
    AND status = 'active'
    AND deleted_at IS NULL
  LIMIT 1;

  IF v_billing_account_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check for active subscription
  SELECT COUNT(*) INTO v_subscription_count
  FROM public.subscriptions
  WHERE billing_account_id = v_billing_account_id
    AND status IN ('active', 'trialing')
    AND (trial_end IS NULL OR trial_end > NOW())
    AND (cancel_at_period_end = FALSE OR cancelled_at IS NULL);

  RETURN v_subscription_count > 0;
END;
$$;

-- Function to check if user has specific plan or higher
CREATE OR REPLACE FUNCTION public.has_plan_or_higher(p_user_id UUID, p_required_plan TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'auth'
AS $$
DECLARE
  v_billing_account_id UUID;
  v_user_plan TEXT;
  v_plan_hierarchy JSONB := '{"free": 0, "starter": 1, "growth": 2, "scale": 3, "enterprise": 4, "base": 1, "pro": 2}'::JSONB;
  v_user_level INTEGER;
  v_required_level INTEGER;
BEGIN
  -- Get billing account
  SELECT id INTO v_billing_account_id
  FROM public.billing_accounts
  WHERE user_id = p_user_id
    AND status = 'active'
    AND deleted_at IS NULL
  LIMIT 1;

  IF v_billing_account_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Get user's plan
  SELECT plan_id INTO v_user_plan
  FROM public.subscriptions
  WHERE billing_account_id = v_billing_account_id
    AND status IN ('active', 'trialing')
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_user_plan IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check plan hierarchy
  v_user_level := COALESCE((v_plan_hierarchy->>v_user_plan)::INTEGER, 0);
  v_required_level := COALESCE((v_plan_hierarchy->>p_required_plan)::INTEGER, 0);

  RETURN v_user_level >= v_required_level;
END;
$$;

-- Function to check if billing account has add-on purchase
CREATE OR REPLACE FUNCTION public.has_add_on_purchase(p_billing_account_id UUID, p_add_on_integration_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'auth'
AS $$
DECLARE
  v_purchase_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_purchase_count
  FROM public.add_on_purchases aop
  INNER JOIN public.add_ons ao ON ao.id = aop.add_on_id
  WHERE aop.billing_account_id = p_billing_account_id
    AND ao.integration_id = p_add_on_integration_id
    AND aop.status = 'active'
    AND ao.is_active = TRUE;

  RETURN v_purchase_count > 0;
END;
$$;

-- Function to get billing account ID for user
CREATE OR REPLACE FUNCTION public.get_user_billing_account_id(p_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'auth'
AS $$
DECLARE
  v_billing_account_id UUID;
BEGIN
  SELECT id INTO v_billing_account_id
  FROM public.billing_accounts
  WHERE user_id = p_user_id
    AND status = 'active'
    AND deleted_at IS NULL
  ORDER BY created_at DESC
  LIMIT 1;

  RETURN v_billing_account_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.has_active_subscription(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_plan_or_higher(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_add_on_purchase(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_billing_account_id(UUID) TO authenticated;

-- ============================================================================
-- ENFORCE RLS ON ALL TENANT-SCOPED TABLES
-- ============================================================================

-- Ensure RLS is enabled on critical tables
DO $$
DECLARE
  r RECORD;
  tables_to_check TEXT[] := ARRAY[
    'recon_jobs', 'recon_results', 'recon_templates', 'recon_audits',
    'receipt_uploads', 'receipts', 'receipt_items',
    'feature_flags', 'feature_flag_environments', 'feature_flag_overrides',
    'ingestion_sources', 'ingestions', 'raw_records', 'normalized_transactions',
    'reconciliation_runs', 'reconciliation_matches', 'exports',
    'webhooks', 'webhook_deliveries',
    'usage_events', 'usage_aggregate_daily', 'usage_counters',
    'add_on_purchases', 'subscriptions'
  ];
BEGIN
  FOR r IN SELECT unnest(tables_to_check) AS table_name
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.table_name);
    RAISE NOTICE 'Enabled RLS on table: %', r.table_name;
  END LOOP;
END $$;

-- ============================================================================
-- ENHANCED RLS POLICIES FOR TENANT ISOLATION
-- ============================================================================

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "tenant_isolation_select" ON public.recon_jobs;
DROP POLICY IF EXISTS "tenant_isolation_insert" ON public.recon_jobs;
DROP POLICY IF EXISTS "tenant_isolation_update" ON public.recon_jobs;
DROP POLICY IF EXISTS "tenant_isolation_delete" ON public.recon_jobs;

-- Recon Jobs: Strict tenant isolation
CREATE POLICY "tenant_isolation_select" ON public.recon_jobs
  FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.billing_accounts
      WHERE user_id = auth.uid() AND status = 'active' AND deleted_at IS NULL
    )
  );

CREATE POLICY "tenant_isolation_insert" ON public.recon_jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.billing_accounts
      WHERE user_id = auth.uid() AND status = 'active' AND deleted_at IS NULL
    )
    AND public.has_active_subscription(auth.uid())
  );

CREATE POLICY "tenant_isolation_update" ON public.recon_jobs
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.billing_accounts
      WHERE user_id = auth.uid() AND status = 'active' AND deleted_at IS NULL
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.billing_accounts
      WHERE user_id = auth.uid() AND status = 'active' AND deleted_at IS NULL
    )
  );

CREATE POLICY "tenant_isolation_delete" ON public.recon_jobs
  FOR DELETE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.billing_accounts
      WHERE user_id = auth.uid() AND status = 'active' AND deleted_at IS NULL
    )
  );

-- Receipts: Tenant isolation + billing account requirement
-- Check if billing_account_id column exists before creating policies
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'receipt_uploads' 
    AND column_name = 'billing_account_id'
  ) THEN
    DROP POLICY IF EXISTS "tenant_isolation_select" ON public.receipt_uploads;
    DROP POLICY IF EXISTS "tenant_isolation_insert" ON public.receipt_uploads;
    DROP POLICY IF EXISTS "tenant_isolation_update" ON public.receipt_uploads;

    EXECUTE '
      CREATE POLICY "tenant_isolation_select" ON public.receipt_uploads
        FOR SELECT
        TO authenticated
        USING (
          billing_account_id IN (
            SELECT id FROM public.billing_accounts
            WHERE user_id = auth.uid() AND status = ''active'' AND deleted_at IS NULL
          )
        );

      CREATE POLICY "tenant_isolation_insert" ON public.receipt_uploads
        FOR INSERT
        TO authenticated
        WITH CHECK (
          billing_account_id IN (
            SELECT id FROM public.billing_accounts
            WHERE user_id = auth.uid() AND status = ''active'' AND deleted_at IS NULL
          )
          AND public.has_active_subscription(auth.uid())
        );

      CREATE POLICY "tenant_isolation_update" ON public.receipt_uploads
        FOR UPDATE
        TO authenticated
        USING (
          billing_account_id IN (
            SELECT id FROM public.billing_accounts
            WHERE user_id = auth.uid() AND status = ''active'' AND deleted_at IS NULL
          )
        )
        WITH CHECK (
          billing_account_id IN (
            SELECT id FROM public.billing_accounts
            WHERE user_id = auth.uid() AND status = ''active'' AND deleted_at IS NULL
          )
        );
    ';
  END IF;
END $$;

-- Feature Flags: Tenant isolation + billing account requirement
-- Check if billing_account_id column exists before creating policies
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'feature_flags' 
    AND column_name = 'billing_account_id'
  ) THEN
    DROP POLICY IF EXISTS "tenant_isolation_select" ON public.feature_flags;
    DROP POLICY IF EXISTS "tenant_isolation_insert" ON public.feature_flags;
    DROP POLICY IF EXISTS "tenant_isolation_update" ON public.feature_flags;
    DROP POLICY IF EXISTS "tenant_isolation_delete" ON public.feature_flags;

    EXECUTE '
      CREATE POLICY "tenant_isolation_select" ON public.feature_flags
        FOR SELECT
        TO authenticated
        USING (
          billing_account_id IN (
            SELECT id FROM public.billing_accounts
            WHERE user_id = auth.uid() AND status = ''active'' AND deleted_at IS NULL
          )
        );

      CREATE POLICY "tenant_isolation_insert" ON public.feature_flags
        FOR INSERT
        TO authenticated
        WITH CHECK (
          billing_account_id IN (
            SELECT id FROM public.billing_accounts
            WHERE user_id = auth.uid() AND status = ''active'' AND deleted_at IS NULL
          )
          AND public.has_active_subscription(auth.uid())
        );

      CREATE POLICY "tenant_isolation_update" ON public.feature_flags
        FOR UPDATE
        TO authenticated
        USING (
          billing_account_id IN (
            SELECT id FROM public.billing_accounts
            WHERE user_id = auth.uid() AND status = ''active'' AND deleted_at IS NULL
          )
        )
        WITH CHECK (
          billing_account_id IN (
            SELECT id FROM public.billing_accounts
            WHERE user_id = auth.uid() AND status = ''active'' AND deleted_at IS NULL
          )
        );

      CREATE POLICY "tenant_isolation_delete" ON public.feature_flags
        FOR DELETE
        TO authenticated
        USING (
          billing_account_id IN (
            SELECT id FROM public.billing_accounts
            WHERE user_id = auth.uid() AND status = ''active'' AND deleted_at IS NULL
          )
        );
    ';
  END IF;
END $$;

-- Usage Events: Tenant isolation + billing account requirement
-- Check if billing_account_id column exists before creating policies
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'usage_events' 
    AND column_name = 'billing_account_id'
  ) THEN
    DROP POLICY IF EXISTS "tenant_isolation_select" ON public.usage_events;
    DROP POLICY IF EXISTS "tenant_isolation_insert" ON public.usage_events;

    EXECUTE '
      CREATE POLICY "tenant_isolation_select" ON public.usage_events
        FOR SELECT
        TO authenticated
        USING (
          billing_account_id IN (
            SELECT id FROM public.billing_accounts
            WHERE user_id = auth.uid() AND status = ''active'' AND deleted_at IS NULL
          )
        );

      CREATE POLICY "tenant_isolation_insert" ON public.usage_events
        FOR INSERT
        TO authenticated
        WITH CHECK (
          billing_account_id IN (
            SELECT id FROM public.billing_accounts
            WHERE user_id = auth.uid() AND status = ''active'' AND deleted_at IS NULL
          )
        );
    ';
  END IF;
END $$;

-- ============================================================================
-- DATABASE CONSTRAINTS FOR BILLING ENFORCEMENT
-- ============================================================================

-- Ensure subscriptions reference valid billing accounts
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subscriptions' 
    AND column_name = 'billing_account_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'subscriptions_billing_account_id_fkey'
  ) THEN
    ALTER TABLE public.subscriptions
    ADD CONSTRAINT subscriptions_billing_account_id_fkey
    FOREIGN KEY (billing_account_id)
    REFERENCES public.billing_accounts(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- Ensure add-on purchases reference valid billing accounts
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'add_on_purchases' 
    AND column_name = 'billing_account_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'add_on_purchases_billing_account_id_fkey'
  ) THEN
    ALTER TABLE public.add_on_purchases
    ADD CONSTRAINT add_on_purchases_billing_account_id_fkey
    FOREIGN KEY (billing_account_id)
    REFERENCES public.billing_accounts(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- Ensure usage events reference valid billing accounts
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'usage_events' 
    AND column_name = 'billing_account_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'usage_events_billing_account_id_fkey'
  ) THEN
    ALTER TABLE public.usage_events
    ADD CONSTRAINT usage_events_billing_account_id_fkey
    FOREIGN KEY (billing_account_id)
    REFERENCES public.billing_accounts(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================================
-- CHECK CONSTRAINTS FOR DATA INTEGRITY
-- ============================================================================

-- Ensure subscription status is valid
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'subscriptions_status_check'
  ) THEN
    ALTER TABLE public.subscriptions
    ADD CONSTRAINT subscriptions_status_check
    CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing', 'incomplete', 'incomplete_expired'));
  END IF;
END $$;

-- Ensure billing account status is valid
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'billing_accounts_status_check'
  ) THEN
    ALTER TABLE public.billing_accounts
    ADD CONSTRAINT billing_accounts_status_check
    CHECK (status IN ('active', 'suspended', 'cancelled'));
  END IF;
END $$;

-- Ensure add-on purchase status is valid
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'add_on_purchases_status_check'
  ) THEN
    ALTER TABLE public.add_on_purchases
    ADD CONSTRAINT add_on_purchases_status_check
    CHECK (status IN ('active', 'cancelled', 'expired'));
  END IF;
END $$;

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC ENFORCEMENT
-- ============================================================================

-- Function to prevent creating recon jobs without active subscription
CREATE OR REPLACE FUNCTION public.enforce_subscription_for_recon_jobs()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'auth'
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get user_id from billing account
  SELECT user_id INTO v_user_id
  FROM public.billing_accounts
  WHERE id IN (
    SELECT billing_account_id FROM public.billing_accounts
    WHERE tenant_id = NEW.tenant_id
    LIMIT 1
  )
  LIMIT 1;

  -- If we can't find user, try to get from auth context
  IF v_user_id IS NULL THEN
    v_user_id := auth.uid();
  END IF;

  -- Check subscription
  IF v_user_id IS NOT NULL AND NOT public.has_active_subscription(v_user_id) THEN
    RAISE EXCEPTION 'Active subscription required to create reconciliation jobs';
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger (only if it doesn't exist)
DROP TRIGGER IF EXISTS enforce_subscription_recon_jobs ON public.recon_jobs;
CREATE TRIGGER enforce_subscription_recon_jobs
  BEFORE INSERT ON public.recon_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_subscription_for_recon_jobs();

-- Function to prevent creating receipts without active subscription
CREATE OR REPLACE FUNCTION public.enforce_subscription_for_receipts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'auth'
AS $$
BEGIN
  IF NEW.billing_account_id IS NOT NULL THEN
    IF NOT public.has_active_subscription(
      (SELECT user_id FROM public.billing_accounts WHERE id = NEW.billing_account_id LIMIT 1)
    ) THEN
      RAISE EXCEPTION 'Active subscription required to create receipts';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS enforce_subscription_receipts ON public.receipt_uploads;
CREATE TRIGGER enforce_subscription_receipts
  BEFORE INSERT ON public.receipt_uploads
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_subscription_for_receipts();

-- Function to prevent creating feature flags without active subscription
CREATE OR REPLACE FUNCTION public.enforce_subscription_for_feature_flags()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'auth'
AS $$
BEGIN
  IF NEW.billing_account_id IS NOT NULL THEN
    IF NOT public.has_active_subscription(
      (SELECT user_id FROM public.billing_accounts WHERE id = NEW.billing_account_id LIMIT 1)
    ) THEN
      RAISE EXCEPTION 'Active subscription required to create feature flags';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS enforce_subscription_feature_flags ON public.feature_flags;
CREATE TRIGGER enforce_subscription_feature_flags
  BEFORE INSERT ON public.feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_subscription_for_feature_flags();

COMMIT;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION public.has_active_subscription(UUID) IS 
  'Checks if user has an active subscription (active or trialing status)';

COMMENT ON FUNCTION public.has_plan_or_higher(UUID, TEXT) IS 
  'Checks if user has required plan or higher tier';

COMMENT ON FUNCTION public.has_add_on_purchase(UUID, TEXT) IS 
  'Checks if billing account has active add-on purchase for integration';

COMMENT ON FUNCTION public.get_user_billing_account_id(UUID) IS 
  'Gets the active billing account ID for a user';

COMMENT ON TRIGGER enforce_subscription_recon_jobs ON public.recon_jobs IS 
  'Enforces active subscription requirement before creating reconciliation jobs';

COMMENT ON TRIGGER enforce_subscription_receipts ON public.receipt_uploads IS 
  'Enforces active subscription requirement before creating receipts';

COMMENT ON TRIGGER enforce_subscription_feature_flags ON public.feature_flags IS 
  'Enforces active subscription requirement before creating feature flags';
