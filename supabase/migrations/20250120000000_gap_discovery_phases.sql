-- ============================================================================
-- GAP DISCOVERY PHASES 1-3 IMPLEMENTATION
-- ============================================================================
-- This migration implements all database structures for:
-- Phase 1: Core Features (Multi-source, Approvals, Notifications, Progress, Audit)
-- Phase 2: Premium Features (Receipt Matching, Currency, Bulk Ops, Advanced Rules)
-- Phase 3: Enterprise Features (SLA, Custom Integrations, Dedicated Infrastructure)
-- ============================================================================

BEGIN;

-- ============================================================================
-- ENUMS
-- ============================================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'approval_status') THEN
    CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'conflict_resolution_strategy') THEN
    CREATE TYPE public.conflict_resolution_strategy AS ENUM ('first_wins', 'last_wins', 'highest_amount', 'lowest_amount', 'manual');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_channel') THEN
    CREATE TYPE public.notification_channel AS ENUM ('email', 'slack', 'webhook', 'in_app');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_event_type') THEN
    CREATE TYPE public.notification_event_type AS ENUM (
      'job_failed', 'job_completed', 'job_progress', 'approval_requested', 
      'approval_approved', 'approval_rejected', 'reconciliation_complete',
      'conflict_detected', 'checkpoint_created', 'bulk_operation_complete'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'checkpoint_status') THEN
    CREATE TYPE public.checkpoint_status AS ENUM ('active', 'resumed', 'expired');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'receipt_match_confidence') THEN
    CREATE TYPE public.receipt_match_confidence AS ENUM ('high', 'medium', 'low', 'manual');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bulk_operation_type') THEN
    CREATE TYPE public.bulk_operation_type AS ENUM ('approve', 'reject', 'export', 'correct', 'link_receipts');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sla_metric_type') THEN
    CREATE TYPE public.sla_metric_type AS ENUM ('uptime', 'latency_p95', 'latency_p99', 'error_rate', 'support_response');
  END IF;
END $$;

-- ============================================================================
-- PHASE 1: MULTI-SOURCE RECONCILIATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.multi_source_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  user_id uuid NOT NULL,
  recon_job_id uuid,
  recon_run_id uuid,
  source_adapters jsonb NOT NULL DEFAULT '[]'::jsonb,
  target_adapter varchar NOT NULL,
  conflict_resolution_strategy public.conflict_resolution_strategy NOT NULL DEFAULT 'manual',
  duplicate_detection_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'multi_source_jobs_tenant_id_fkey' 
    AND conrelid = 'public.multi_source_jobs'::regclass
  ) THEN
    ALTER TABLE public.multi_source_jobs 
    ADD CONSTRAINT multi_source_jobs_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'multi_source_jobs_user_id_fkey' 
    AND conrelid = 'public.multi_source_jobs'::regclass
  ) THEN
    ALTER TABLE public.multi_source_jobs 
    ADD CONSTRAINT multi_source_jobs_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'multi_source_jobs_recon_job_id_fkey' 
    AND conrelid = 'public.multi_source_jobs'::regclass
  ) THEN
    ALTER TABLE public.multi_source_jobs 
    ADD CONSTRAINT multi_source_jobs_recon_job_id_fkey 
    FOREIGN KEY (recon_job_id) REFERENCES recon_jobs(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_multi_source_jobs_tenant_id 
ON public.multi_source_jobs USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_multi_source_jobs_recon_job_id 
ON public.multi_source_jobs USING btree (recon_job_id);

CREATE INDEX IF NOT EXISTS idx_multi_source_jobs_recon_run_id 
ON public.multi_source_jobs USING btree (recon_run_id);

CREATE TABLE IF NOT EXISTS public.source_conflicts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  multi_source_job_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  conflict_type varchar NOT NULL,
  source_adapter_1 varchar NOT NULL,
  source_adapter_2 varchar NOT NULL,
  transaction_id_1 uuid,
  transaction_id_2 uuid,
  conflict_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  resolution_strategy public.conflict_resolution_strategy,
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'source_conflicts_multi_source_job_id_fkey' 
    AND conrelid = 'public.source_conflicts'::regclass
  ) THEN
    ALTER TABLE public.source_conflicts 
    ADD CONSTRAINT source_conflicts_multi_source_job_id_fkey 
    FOREIGN KEY (multi_source_job_id) REFERENCES multi_source_jobs(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_source_conflicts_multi_source_job_id 
ON public.source_conflicts USING btree (multi_source_job_id);

CREATE INDEX IF NOT EXISTS idx_source_conflicts_resolved 
ON public.source_conflicts USING btree (resolved_at) WHERE (resolved_at IS NULL);

-- ============================================================================
-- PHASE 1: APPROVAL WORKFLOWS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.approval_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  requested_by uuid NOT NULL,
  approver_id uuid,
  approver_role varchar,
  reconciliation_run_id uuid,
  recon_job_id uuid,
  recon_result_id uuid,
  status public.approval_status NOT NULL DEFAULT 'pending',
  request_type varchar NOT NULL,
  request_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  comments text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  rejected_at timestamptz,
  cancelled_at timestamptz,
  expires_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'approval_requests_tenant_id_fkey' 
    AND conrelid = 'public.approval_requests'::regclass
  ) THEN
    ALTER TABLE public.approval_requests 
    ADD CONSTRAINT approval_requests_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'approval_requests_requested_by_fkey' 
    AND conrelid = 'public.approval_requests'::regclass
  ) THEN
    ALTER TABLE public.approval_requests 
    ADD CONSTRAINT approval_requests_requested_by_fkey 
    FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'approval_requests_approver_id_fkey' 
    AND conrelid = 'public.approval_requests'::regclass
  ) THEN
    ALTER TABLE public.approval_requests 
    ADD CONSTRAINT approval_requests_approver_id_fkey 
    FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_approval_requests_tenant_id 
ON public.approval_requests USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_approval_requests_status 
ON public.approval_requests USING btree (status);

CREATE INDEX IF NOT EXISTS idx_approval_requests_approver_id 
ON public.approval_requests USING btree (approver_id) WHERE (approver_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_approval_requests_reconciliation_run_id 
ON public.approval_requests USING btree (reconciliation_run_id);

CREATE INDEX IF NOT EXISTS idx_approval_requests_pending 
ON public.approval_requests USING btree (tenant_id, status, requested_at DESC) 
WHERE (status = 'pending');

CREATE TABLE IF NOT EXISTS public.approvers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role varchar NOT NULL,
  approval_threshold numeric,
  can_approve_final boolean NOT NULL DEFAULT false,
  notification_preferences jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE (tenant_id, user_id, role)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'approvers_tenant_id_fkey' 
    AND conrelid = 'public.approvers'::regclass
  ) THEN
    ALTER TABLE public.approvers 
    ADD CONSTRAINT approvers_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'approvers_user_id_fkey' 
    AND conrelid = 'public.approvers'::regclass
  ) THEN
    ALTER TABLE public.approvers 
    ADD CONSTRAINT approvers_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_approvers_tenant_id 
ON public.approvers USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_approvers_user_id 
ON public.approvers USING btree (user_id);

-- ============================================================================
-- PHASE 1: PROGRESS TRACKING
-- ============================================================================

-- Add progress tracking columns to recon_runs if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recon_runs' AND column_name = 'progress_percentage'
  ) THEN
    ALTER TABLE public.recon_runs 
    ADD COLUMN progress_percentage numeric DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recon_runs' AND column_name = 'transactions_processed'
  ) THEN
    ALTER TABLE public.recon_runs 
    ADD COLUMN transactions_processed int4 DEFAULT 0;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recon_runs' AND column_name = 'total_transactions'
  ) THEN
    ALTER TABLE public.recon_runs 
    ADD COLUMN total_transactions int4 DEFAULT 0;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recon_runs' AND column_name = 'estimated_completion_at'
  ) THEN
    ALTER TABLE public.recon_runs 
    ADD COLUMN estimated_completion_at timestamptz;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recon_runs' AND column_name = 'last_progress_update_at'
  ) THEN
    ALTER TABLE public.recon_runs 
    ADD COLUMN last_progress_update_at timestamptz;
  END IF;
END $$;

-- Add progress tracking to recon_results
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recon_results' AND column_name = 'progress_percentage'
  ) THEN
    ALTER TABLE public.recon_results 
    ADD COLUMN progress_percentage numeric DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recon_results' AND column_name = 'transactions_processed'
  ) THEN
    ALTER TABLE public.recon_results 
    ADD COLUMN transactions_processed int4 DEFAULT 0;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recon_results' AND column_name = 'estimated_completion_at'
  ) THEN
    ALTER TABLE public.recon_results 
    ADD COLUMN estimated_completion_at timestamptz;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.checkpoints (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  job_id uuid,
  recon_run_id uuid,
  recon_result_id uuid,
  checkpoint_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  transactions_processed int4 DEFAULT 0,
  status public.checkpoint_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  resumed_at timestamptz,
  expires_at timestamptz,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'checkpoints_tenant_id_fkey' 
    AND conrelid = 'public.checkpoints'::regclass
  ) THEN
    ALTER TABLE public.checkpoints 
    ADD CONSTRAINT checkpoints_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_checkpoints_job_id 
ON public.checkpoints USING btree (job_id);

CREATE INDEX IF NOT EXISTS idx_checkpoints_recon_run_id 
ON public.checkpoints USING btree (recon_run_id);

CREATE INDEX IF NOT EXISTS idx_checkpoints_status 
ON public.checkpoints USING btree (status);

CREATE INDEX IF NOT EXISTS idx_checkpoints_active 
ON public.checkpoints USING btree (tenant_id, status, created_at DESC) 
WHERE (status = 'active');

-- ============================================================================
-- PHASE 1: FAILURE NOTIFICATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  user_id uuid,
  event_type public.notification_event_type NOT NULL,
  channels jsonb NOT NULL DEFAULT '["email"]'::jsonb,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE (tenant_id, user_id, event_type)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'notification_preferences_tenant_id_fkey' 
    AND conrelid = 'public.notification_preferences'::regclass
  ) THEN
    ALTER TABLE public.notification_preferences 
    ADD CONSTRAINT notification_preferences_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'notification_preferences_user_id_fkey' 
    AND conrelid = 'public.notification_preferences'::regclass
  ) THEN
    ALTER TABLE public.notification_preferences 
    ADD CONSTRAINT notification_preferences_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_notification_preferences_tenant_user 
ON public.notification_preferences USING btree (tenant_id, user_id);

CREATE TABLE IF NOT EXISTS public.notification_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  user_id uuid,
  event_type public.notification_event_type NOT NULL,
  channel public.notification_channel NOT NULL,
  recipient varchar NOT NULL,
  subject text,
  body text,
  metadata jsonb DEFAULT '{}'::jsonb,
  sent_at timestamptz NOT NULL DEFAULT now(),
  delivered_at timestamptz,
  failed_at timestamptz,
  error_message text,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'notification_logs_tenant_id_fkey' 
    AND conrelid = 'public.notification_logs'::regclass
  ) THEN
    ALTER TABLE public.notification_logs 
    ADD CONSTRAINT notification_logs_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_notification_logs_tenant_id 
ON public.notification_logs USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at 
ON public.notification_logs USING btree (sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_logs_event_type 
ON public.notification_logs USING btree (event_type);

-- ============================================================================
-- PHASE 1: ADVANCED AUDIT TRAIL
-- ============================================================================

-- Enhance audit_log table if needed
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'audit_log' AND column_name = 'ip_address'
  ) THEN
    ALTER TABLE app_private.audit_log 
    ADD COLUMN ip_address varchar;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'audit_log' AND column_name = 'user_agent'
  ) THEN
    ALTER TABLE app_private.audit_log 
    ADD COLUMN user_agent text;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'audit_log' AND column_name = 'compliance_tags'
  ) THEN
    ALTER TABLE app_private.audit_log 
    ADD COLUMN compliance_tags text[];
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.audit_exports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  exported_by uuid NOT NULL,
  export_format varchar NOT NULL DEFAULT 'csv',
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  file_path text,
  file_size_bytes int8,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'audit_exports_tenant_id_fkey' 
    AND conrelid = 'public.audit_exports'::regclass
  ) THEN
    ALTER TABLE public.audit_exports 
    ADD CONSTRAINT audit_exports_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_audit_exports_tenant_id 
ON public.audit_exports USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_audit_exports_created_at 
ON public.audit_exports USING btree (created_at DESC);

-- ============================================================================
-- PHASE 2: RECEIPT AUTO-MATCHING
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.receipt_transaction_links (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  receipt_id uuid NOT NULL,
  transaction_id uuid NOT NULL,
  reconciliation_run_id uuid,
  match_confidence public.receipt_match_confidence NOT NULL,
  confidence_score numeric CHECK (confidence_score >= 0 AND confidence_score <= 1),
  matched_by uuid,
  matched_at timestamptz NOT NULL DEFAULT now(),
  verified boolean NOT NULL DEFAULT false,
  verified_by uuid,
  verified_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'receipt_transaction_links_tenant_id_fkey' 
    AND conrelid = 'public.receipt_transaction_links'::regclass
  ) THEN
    ALTER TABLE public.receipt_transaction_links 
    ADD CONSTRAINT receipt_transaction_links_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'receipt_transaction_links_receipt_id_fkey' 
    AND conrelid = 'public.receipt_transaction_links'::regclass
  ) THEN
    ALTER TABLE public.receipt_transaction_links 
    ADD CONSTRAINT receipt_transaction_links_receipt_id_fkey 
    FOREIGN KEY (receipt_id) REFERENCES receipts(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_receipt_transaction_links_receipt_id 
ON public.receipt_transaction_links USING btree (receipt_id);

CREATE INDEX IF NOT EXISTS idx_receipt_transaction_links_transaction_id 
ON public.receipt_transaction_links USING btree (transaction_id);

CREATE INDEX IF NOT EXISTS idx_receipt_transaction_links_confidence 
ON public.receipt_transaction_links USING btree (match_confidence, confidence_score DESC);

CREATE INDEX IF NOT EXISTS idx_receipt_transaction_links_unverified 
ON public.receipt_transaction_links USING btree (tenant_id, verified) 
WHERE (verified = false);

-- ============================================================================
-- PHASE 2: CURRENCY CONVERSION
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.currency_rates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  from_currency varchar(3) NOT NULL,
  to_currency varchar(3) NOT NULL,
  rate numeric NOT NULL,
  date date NOT NULL,
  source varchar NOT NULL DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE (from_currency, to_currency, date, source)
);

CREATE INDEX IF NOT EXISTS idx_currency_rates_date 
ON public.currency_rates USING btree (date DESC);

CREATE INDEX IF NOT EXISTS idx_currency_rates_currencies 
ON public.currency_rates USING btree (from_currency, to_currency, date DESC);

CREATE TABLE IF NOT EXISTS public.currency_conversions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  reconciliation_run_id uuid,
  transaction_id uuid,
  from_currency varchar(3) NOT NULL,
  to_currency varchar(3) NOT NULL,
  original_amount numeric NOT NULL,
  converted_amount numeric NOT NULL,
  exchange_rate numeric NOT NULL,
  rate_date date NOT NULL,
  rate_source varchar,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'currency_conversions_tenant_id_fkey' 
    AND conrelid = 'public.currency_conversions'::regclass
  ) THEN
    ALTER TABLE public.currency_conversions 
    ADD CONSTRAINT currency_conversions_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_currency_conversions_reconciliation_run_id 
ON public.currency_conversions USING btree (reconciliation_run_id);

CREATE INDEX IF NOT EXISTS idx_currency_conversions_transaction_id 
ON public.currency_conversions USING btree (transaction_id);

-- ============================================================================
-- PHASE 2: BULK OPERATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.bulk_operations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  user_id uuid NOT NULL,
  operation_type public.bulk_operation_type NOT NULL,
  target_type varchar NOT NULL,
  target_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  operation_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  status varchar NOT NULL DEFAULT 'pending',
  progress_percentage numeric DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  items_processed int4 DEFAULT 0,
  total_items int4 NOT NULL DEFAULT 0,
  succeeded_count int4 DEFAULT 0,
  failed_count int4 DEFAULT 0,
  error_details jsonb DEFAULT '[]'::jsonb,
  result_data jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bulk_operations_tenant_id_fkey' 
    AND conrelid = 'public.bulk_operations'::regclass
  ) THEN
    ALTER TABLE public.bulk_operations 
    ADD CONSTRAINT bulk_operations_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bulk_operations_user_id_fkey' 
    AND conrelid = 'public.bulk_operations'::regclass
  ) THEN
    ALTER TABLE public.bulk_operations 
    ADD CONSTRAINT bulk_operations_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_bulk_operations_tenant_id 
ON public.bulk_operations USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_bulk_operations_status 
ON public.bulk_operations USING btree (status);

CREATE INDEX IF NOT EXISTS idx_bulk_operations_created_at 
ON public.bulk_operations USING btree (created_at DESC);

-- ============================================================================
-- PHASE 2: ADVANCED MATCHING RULES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.custom_matching_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  user_id uuid NOT NULL,
  name varchar NOT NULL,
  description text,
  rule_type varchar NOT NULL,
  rule_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  custom_fields jsonb DEFAULT '[]'::jsonb,
  is_template boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  performance_metrics jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'custom_matching_rules_tenant_id_fkey' 
    AND conrelid = 'public.custom_matching_rules'::regclass
  ) THEN
    ALTER TABLE public.custom_matching_rules 
    ADD CONSTRAINT custom_matching_rules_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_custom_matching_rules_tenant_id 
ON public.custom_matching_rules USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_custom_matching_rules_is_template 
ON public.custom_matching_rules USING btree (is_template) WHERE (is_template = true);

CREATE INDEX IF NOT EXISTS idx_custom_matching_rules_active 
ON public.custom_matching_rules USING btree (tenant_id, is_active) WHERE (is_active = true);

-- ============================================================================
-- PHASE 3: SLA GUARANTEES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.sla_agreements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  sla_type varchar NOT NULL,
  target_value numeric NOT NULL,
  measurement_period varchar NOT NULL DEFAULT 'monthly',
  start_date date NOT NULL,
  end_date date,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE (tenant_id, sla_type, start_date)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sla_agreements_tenant_id_fkey' 
    AND conrelid = 'public.sla_agreements'::regclass
  ) THEN
    ALTER TABLE public.sla_agreements 
    ADD CONSTRAINT sla_agreements_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sla_agreements_tenant_id 
ON public.sla_agreements USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_sla_agreements_active 
ON public.sla_agreements USING btree (tenant_id, is_active) WHERE (is_active = true);

CREATE TABLE IF NOT EXISTS public.sla_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  sla_agreement_id uuid NOT NULL,
  metric_type public.sla_metric_type NOT NULL,
  measured_value numeric NOT NULL,
  target_value numeric NOT NULL,
  measurement_date date NOT NULL,
  measurement_period varchar NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sla_metrics_tenant_id_fkey' 
    AND conrelid = 'public.sla_metrics'::regclass
  ) THEN
    ALTER TABLE public.sla_metrics 
    ADD CONSTRAINT sla_metrics_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sla_metrics_sla_agreement_id_fkey' 
    AND conrelid = 'public.sla_metrics'::regclass
  ) THEN
    ALTER TABLE public.sla_metrics 
    ADD CONSTRAINT sla_metrics_sla_agreement_id_fkey 
    FOREIGN KEY (sla_agreement_id) REFERENCES sla_agreements(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sla_metrics_tenant_id 
ON public.sla_metrics USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_sla_metrics_measurement_date 
ON public.sla_metrics USING btree (measurement_date DESC);

CREATE INDEX IF NOT EXISTS idx_sla_metrics_sla_agreement_id 
ON public.sla_metrics USING btree (sla_agreement_id);

CREATE TABLE IF NOT EXISTS public.sla_violations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  sla_agreement_id uuid NOT NULL,
  metric_type public.sla_metric_type NOT NULL,
  measured_value numeric NOT NULL,
  target_value numeric NOT NULL,
  violation_date date NOT NULL,
  violation_period varchar NOT NULL,
  severity varchar NOT NULL DEFAULT 'warning',
  acknowledged boolean NOT NULL DEFAULT false,
  acknowledged_by uuid,
  acknowledged_at timestamptz,
  resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sla_violations_tenant_id_fkey' 
    AND conrelid = 'public.sla_violations'::regclass
  ) THEN
    ALTER TABLE public.sla_violations 
    ADD CONSTRAINT sla_violations_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sla_violations_sla_agreement_id_fkey' 
    AND conrelid = 'public.sla_violations'::regclass
  ) THEN
    ALTER TABLE public.sla_violations 
    ADD CONSTRAINT sla_violations_sla_agreement_id_fkey 
    FOREIGN KEY (sla_agreement_id) REFERENCES sla_agreements(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sla_violations_tenant_id 
ON public.sla_violations USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_sla_violations_unresolved 
ON public.sla_violations USING btree (tenant_id, resolved, violation_date DESC) 
WHERE (resolved = false);

-- ============================================================================
-- PHASE 3: CUSTOM INTEGRATIONS & DEDICATED INFRASTRUCTURE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.custom_integrations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  integration_name varchar NOT NULL,
  integration_type varchar NOT NULL,
  adapter_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  white_label_config jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE (tenant_id, integration_name)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'custom_integrations_tenant_id_fkey' 
    AND conrelid = 'public.custom_integrations'::regclass
  ) THEN
    ALTER TABLE public.custom_integrations 
    ADD CONSTRAINT custom_integrations_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_custom_integrations_tenant_id 
ON public.custom_integrations USING btree (tenant_id);

CREATE TABLE IF NOT EXISTS public.dedicated_infrastructure (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  infrastructure_type varchar NOT NULL,
  resource_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  isolation_level varchar NOT NULL DEFAULT 'standard',
  data_retention_days int4,
  security_config jsonb DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  provisioned_at timestamptz,
  deprovisioned_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE (tenant_id, infrastructure_type)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'dedicated_infrastructure_tenant_id_fkey' 
    AND conrelid = 'public.dedicated_infrastructure'::regclass
  ) THEN
    ALTER TABLE public.dedicated_infrastructure 
    ADD CONSTRAINT dedicated_infrastructure_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_dedicated_infrastructure_tenant_id 
ON public.dedicated_infrastructure USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_dedicated_infrastructure_active 
ON public.dedicated_infrastructure USING btree (tenant_id, is_active) WHERE (is_active = true);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE public.multi_source_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approvers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipt_transaction_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.currency_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.currency_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_matching_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sla_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sla_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sla_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dedicated_infrastructure ENABLE ROW LEVEL SECURITY;

-- Create RLS policies using the helper function
DO $$
BEGIN
  -- Multi-source jobs
  PERFORM create_policy_if_not_exists(
    'multi_source_jobs_tenant_isolation',
    'multi_source_jobs',
    'USING (tenant_id = current_tenant_id())'
  );

  -- Source conflicts
  PERFORM create_policy_if_not_exists(
    'source_conflicts_tenant_isolation',
    'source_conflicts',
    'USING (tenant_id = current_tenant_id())'
  );

  -- Approval requests
  PERFORM create_policy_if_not_exists(
    'approval_requests_tenant_isolation',
    'approval_requests',
    'USING (tenant_id = current_tenant_id())'
  );

  -- Approvers
  PERFORM create_policy_if_not_exists(
    'approvers_tenant_isolation',
    'approvers',
    'USING (tenant_id = current_tenant_id())'
  );

  -- Checkpoints
  PERFORM create_policy_if_not_exists(
    'checkpoints_tenant_isolation',
    'checkpoints',
    'USING (tenant_id = current_tenant_id())'
  );

  -- Notification preferences
  PERFORM create_policy_if_not_exists(
    'notification_preferences_tenant_isolation',
    'notification_preferences',
    'USING (tenant_id = current_tenant_id())'
  );

  -- Notification logs
  PERFORM create_policy_if_not_exists(
    'notification_logs_tenant_isolation',
    'notification_logs',
    'USING (tenant_id = current_tenant_id())'
  );

  -- Audit exports
  PERFORM create_policy_if_not_exists(
    'audit_exports_tenant_isolation',
    'audit_exports',
    'USING (tenant_id = current_tenant_id())'
  );

  -- Receipt transaction links
  PERFORM create_policy_if_not_exists(
    'receipt_transaction_links_tenant_isolation',
    'receipt_transaction_links',
    'USING (tenant_id = current_tenant_id())'
  );

  -- Currency rates (public read, tenant write)
  PERFORM create_policy_if_not_exists(
    'currency_rates_read',
    'currency_rates',
    'FOR SELECT USING (true)'
  );

  -- Currency conversions
  PERFORM create_policy_if_not_exists(
    'currency_conversions_tenant_isolation',
    'currency_conversions',
    'USING (tenant_id = current_tenant_id())'
  );

  -- Bulk operations
  PERFORM create_policy_if_not_exists(
    'bulk_operations_tenant_isolation',
    'bulk_operations',
    'USING (tenant_id = current_tenant_id())'
  );

  -- Custom matching rules
  PERFORM create_policy_if_not_exists(
    'custom_matching_rules_tenant_isolation',
    'custom_matching_rules',
    'USING (tenant_id = current_tenant_id())'
  );

  -- SLA agreements
  PERFORM create_policy_if_not_exists(
    'sla_agreements_tenant_isolation',
    'sla_agreements',
    'USING (tenant_id = current_tenant_id())'
  );

  -- SLA metrics
  PERFORM create_policy_if_not_exists(
    'sla_metrics_tenant_isolation',
    'sla_metrics',
    'USING (tenant_id = current_tenant_id())'
  );

  -- SLA violations
  PERFORM create_policy_if_not_exists(
    'sla_violations_tenant_isolation',
    'sla_violations',
    'USING (tenant_id = current_tenant_id())'
  );

  -- Custom integrations
  PERFORM create_policy_if_not_exists(
    'custom_integrations_tenant_isolation',
    'custom_integrations',
    'USING (tenant_id = current_tenant_id())'
  );

  -- Dedicated infrastructure
  PERFORM create_policy_if_not_exists(
    'dedicated_infrastructure_tenant_isolation',
    'dedicated_infrastructure',
    'USING (tenant_id = current_tenant_id())'
  );
END $$;

COMMIT;
