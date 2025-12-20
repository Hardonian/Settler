-- ============================================================================
-- MISSING INGESTION & RECONCILIATION TABLES MIGRATION
-- ============================================================================
-- Created: 2025-12-20
-- Description: Creates missing ingestion pipeline and reconciliation tables
--              with proper RLS policies. Safe to run multiple times (idempotent).
-- 
-- This migration can be run directly in Supabase SQL Editor.
-- ============================================================================

BEGIN;

-- ============================================================================
-- HELPER FUNCTION FOR IDEMPOTENT POLICY CREATION
-- ============================================================================

CREATE OR REPLACE FUNCTION create_policy_if_not_exists(
    p_policy_name TEXT,
    p_table_name TEXT,
    p_policy_definition TEXT
) RETURNS VOID AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = p_table_name 
        AND policyname = p_policy_name
    ) THEN
        EXECUTE format('CREATE POLICY %I ON %I %s', p_policy_name, p_table_name, p_policy_definition);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INGESTION PIPELINE TABLES
-- ============================================================================

-- ingestion_sources: Configuration for data sources (Stripe, Shopify, CSV, etc.)
CREATE TABLE IF NOT EXISTS public.ingestion_sources (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    type text NOT NULL, -- "csv", "stripe", "shopify", "manual", etc.
    connector_type text, -- "stripe", "shopify", etc. (null for CSV/manual)
    config_encrypted text, -- Encrypted connector config (API keys, OAuth tokens)
    config_metadata jsonb DEFAULT '{}'::jsonb, -- Non-sensitive metadata
    status text NOT NULL DEFAULT 'active', -- active, paused, error
    last_sync_at timestamptz,
    last_sync_status text, -- success, failed, partial
    last_sync_error text,
    sync_schedule text, -- Cron expression for scheduled syncs
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    PRIMARY KEY (id)
);

-- Foreign keys
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'ingestion_sources_tenant_id_fkey' 
        AND conrelid = 'public.ingestion_sources'::regclass
    ) THEN
        ALTER TABLE public.ingestion_sources 
        ADD CONSTRAINT ingestion_sources_tenant_id_fkey 
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'ingestion_sources_user_id_fkey' 
        AND conrelid = 'public.ingestion_sources'::regclass
    ) THEN
        ALTER TABLE public.ingestion_sources 
        ADD CONSTRAINT ingestion_sources_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ingestion_sources_tenant_id ON public.ingestion_sources USING btree (tenant_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_sources_user_id ON public.ingestion_sources USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_sources_type ON public.ingestion_sources USING btree (type);
CREATE INDEX IF NOT EXISTS idx_ingestion_sources_connector_type ON public.ingestion_sources USING btree (connector_type);
CREATE INDEX IF NOT EXISTS idx_ingestion_sources_status ON public.ingestion_sources USING btree (status);
CREATE INDEX IF NOT EXISTS idx_ingestion_sources_deleted_at ON public.ingestion_sources USING btree (deleted_at);

-- Enable RLS
ALTER TABLE public.ingestion_sources ENABLE ROW LEVEL SECURITY;

-- RLS Policy
DROP POLICY IF EXISTS ingestion_sources_tenant_isolation ON public.ingestion_sources;
CREATE POLICY ingestion_sources_tenant_isolation ON public.ingestion_sources
    FOR ALL
    USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
        )
    );

-- ingestions: Individual ingestion runs
CREATE TABLE IF NOT EXISTS public.ingestions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    source_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    idempotency_key text UNIQUE, -- For idempotent retries
    status text NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
    started_at timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz,
    error_message text,
    error_stack text,
    trace_id text, -- For observability
    raw_record_count int NOT NULL DEFAULT 0,
    normalized_count int NOT NULL DEFAULT 0,
    failed_count int NOT NULL DEFAULT 0,
    retry_count int NOT NULL DEFAULT 0,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);

-- Foreign keys
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'ingestions_source_id_fkey' 
        AND conrelid = 'public.ingestions'::regclass
    ) THEN
        ALTER TABLE public.ingestions 
        ADD CONSTRAINT ingestions_source_id_fkey 
        FOREIGN KEY (source_id) REFERENCES public.ingestion_sources(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'ingestions_tenant_id_fkey' 
        AND conrelid = 'public.ingestions'::regclass
    ) THEN
        ALTER TABLE public.ingestions 
        ADD CONSTRAINT ingestions_tenant_id_fkey 
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'ingestions_user_id_fkey' 
        AND conrelid = 'public.ingestions'::regclass
    ) THEN
        ALTER TABLE public.ingestions 
        ADD CONSTRAINT ingestions_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ingestions_source_id ON public.ingestions USING btree (source_id);
CREATE INDEX IF NOT EXISTS idx_ingestions_tenant_id ON public.ingestions USING btree (tenant_id);
CREATE INDEX IF NOT EXISTS idx_ingestions_user_id ON public.ingestions USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_ingestions_status ON public.ingestions USING btree (status);
CREATE INDEX IF NOT EXISTS idx_ingestions_idempotency_key ON public.ingestions USING btree (idempotency_key);
CREATE INDEX IF NOT EXISTS idx_ingestions_started_at_desc ON public.ingestions USING btree (started_at DESC);

-- Enable RLS
ALTER TABLE public.ingestions ENABLE ROW LEVEL SECURITY;

-- RLS Policy
DROP POLICY IF EXISTS ingestions_tenant_isolation ON public.ingestions;
CREATE POLICY ingestions_tenant_isolation ON public.ingestions
    FOR ALL
    USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
        )
    );

-- raw_records: Raw data from ingestion sources before normalization
CREATE TABLE IF NOT EXISTS public.raw_records (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    ingestion_id uuid NOT NULL,
    source_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    raw_data jsonb NOT NULL, -- Original raw data from source
    row_number int, -- For CSV imports
    external_id text, -- External ID from source system
    status text NOT NULL DEFAULT 'pending', -- pending, normalized, failed
    error_message text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);

-- Foreign keys
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'raw_records_ingestion_id_fkey' 
        AND conrelid = 'public.raw_records'::regclass
    ) THEN
        ALTER TABLE public.raw_records 
        ADD CONSTRAINT raw_records_ingestion_id_fkey 
        FOREIGN KEY (ingestion_id) REFERENCES public.ingestions(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'raw_records_source_id_fkey' 
        AND conrelid = 'public.raw_records'::regclass
    ) THEN
        ALTER TABLE public.raw_records 
        ADD CONSTRAINT raw_records_source_id_fkey 
        FOREIGN KEY (source_id) REFERENCES public.ingestion_sources(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'raw_records_tenant_id_fkey' 
        AND conrelid = 'public.raw_records'::regclass
    ) THEN
        ALTER TABLE public.raw_records 
        ADD CONSTRAINT raw_records_tenant_id_fkey 
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_raw_records_ingestion_id ON public.raw_records USING btree (ingestion_id);
CREATE INDEX IF NOT EXISTS idx_raw_records_source_id ON public.raw_records USING btree (source_id);
CREATE INDEX IF NOT EXISTS idx_raw_records_tenant_id ON public.raw_records USING btree (tenant_id);
CREATE INDEX IF NOT EXISTS idx_raw_records_external_id ON public.raw_records USING btree (external_id);
CREATE INDEX IF NOT EXISTS idx_raw_records_status ON public.raw_records USING btree (status);

-- Enable RLS
ALTER TABLE public.raw_records ENABLE ROW LEVEL SECURITY;

-- RLS Policy
DROP POLICY IF EXISTS raw_records_tenant_isolation ON public.raw_records;
CREATE POLICY raw_records_tenant_isolation ON public.raw_records
    FOR ALL
    USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
        )
    );

-- normalized_transactions: Normalized transaction data ready for reconciliation
CREATE TABLE IF NOT EXISTS public.normalized_transactions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    ingestion_id uuid NOT NULL,
    raw_record_id uuid UNIQUE,
    tenant_id uuid NOT NULL,
    source_id uuid NOT NULL,
    external_id text, -- External ID from source system
    amount numeric(15, 2) NOT NULL,
    currency text NOT NULL DEFAULT 'USD',
    date date NOT NULL,
    description text,
    category text,
    payment_method text,
    reference text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);

-- Foreign keys
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'normalized_transactions_ingestion_id_fkey' 
        AND conrelid = 'public.normalized_transactions'::regclass
    ) THEN
        ALTER TABLE public.normalized_transactions 
        ADD CONSTRAINT normalized_transactions_ingestion_id_fkey 
        FOREIGN KEY (ingestion_id) REFERENCES public.ingestions(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'normalized_transactions_raw_record_id_fkey' 
        AND conrelid = 'public.normalized_transactions'::regclass
    ) THEN
        ALTER TABLE public.normalized_transactions 
        ADD CONSTRAINT normalized_transactions_raw_record_id_fkey 
        FOREIGN KEY (raw_record_id) REFERENCES public.raw_records(id) ON DELETE SET NULL;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'normalized_transactions_source_id_fkey' 
        AND conrelid = 'public.normalized_transactions'::regclass
    ) THEN
        ALTER TABLE public.normalized_transactions 
        ADD CONSTRAINT normalized_transactions_source_id_fkey 
        FOREIGN KEY (source_id) REFERENCES public.ingestion_sources(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'normalized_transactions_tenant_id_fkey' 
        AND conrelid = 'public.normalized_transactions'::regclass
    ) THEN
        ALTER TABLE public.normalized_transactions 
        ADD CONSTRAINT normalized_transactions_tenant_id_fkey 
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_normalized_transactions_ingestion_id ON public.normalized_transactions USING btree (ingestion_id);
CREATE INDEX IF NOT EXISTS idx_normalized_transactions_raw_record_id ON public.normalized_transactions USING btree (raw_record_id);
CREATE INDEX IF NOT EXISTS idx_normalized_transactions_tenant_id ON public.normalized_transactions USING btree (tenant_id);
CREATE INDEX IF NOT EXISTS idx_normalized_transactions_source_id ON public.normalized_transactions USING btree (source_id);
CREATE INDEX IF NOT EXISTS idx_normalized_transactions_external_id ON public.normalized_transactions USING btree (external_id);
CREATE INDEX IF NOT EXISTS idx_normalized_transactions_date ON public.normalized_transactions USING btree (date);
CREATE INDEX IF NOT EXISTS idx_normalized_transactions_amount ON public.normalized_transactions USING btree (amount);
CREATE INDEX IF NOT EXISTS idx_normalized_transactions_currency ON public.normalized_transactions USING btree (currency);
CREATE INDEX IF NOT EXISTS idx_normalized_transactions_tenant_date_amount_currency ON public.normalized_transactions USING btree (tenant_id, date, amount, currency);

-- Enable RLS
ALTER TABLE public.normalized_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policy
DROP POLICY IF EXISTS normalized_transactions_tenant_isolation ON public.normalized_transactions;
CREATE POLICY normalized_transactions_tenant_isolation ON public.normalized_transactions
    FOR ALL
    USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
        )
    );

-- ============================================================================
-- RECONCILIATION TABLES
-- ============================================================================

-- reconciliation_runs: Individual reconciliation execution runs
CREATE TABLE IF NOT EXISTS public.reconciliation_runs (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    ingestion_id uuid,
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    name text,
    status text NOT NULL DEFAULT 'pending', -- pending, running, completed, failed
    started_at timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz,
    source_count int NOT NULL DEFAULT 0,
    target_count int NOT NULL DEFAULT 0,
    matched_count int NOT NULL DEFAULT 0,
    unmatched_source_count int NOT NULL DEFAULT 0,
    unmatched_target_count int NOT NULL DEFAULT 0,
    confidence_avg numeric(5, 4),
    error_message text,
    trace_id text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);

-- Foreign keys
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'reconciliation_runs_ingestion_id_fkey' 
        AND conrelid = 'public.reconciliation_runs'::regclass
    ) THEN
        ALTER TABLE public.reconciliation_runs 
        ADD CONSTRAINT reconciliation_runs_ingestion_id_fkey 
        FOREIGN KEY (ingestion_id) REFERENCES public.ingestions(id) ON DELETE SET NULL;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'reconciliation_runs_tenant_id_fkey' 
        AND conrelid = 'public.reconciliation_runs'::regclass
    ) THEN
        ALTER TABLE public.reconciliation_runs 
        ADD CONSTRAINT reconciliation_runs_tenant_id_fkey 
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'reconciliation_runs_user_id_fkey' 
        AND conrelid = 'public.reconciliation_runs'::regclass
    ) THEN
        ALTER TABLE public.reconciliation_runs 
        ADD CONSTRAINT reconciliation_runs_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reconciliation_runs_ingestion_id ON public.reconciliation_runs USING btree (ingestion_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_runs_tenant_id ON public.reconciliation_runs USING btree (tenant_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_runs_user_id ON public.reconciliation_runs USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_runs_status ON public.reconciliation_runs USING btree (status);
CREATE INDEX IF NOT EXISTS idx_reconciliation_runs_started_at_desc ON public.reconciliation_runs USING btree (started_at DESC);

-- Enable RLS
ALTER TABLE public.reconciliation_runs ENABLE ROW LEVEL SECURITY;

-- RLS Policy
DROP POLICY IF EXISTS reconciliation_runs_tenant_isolation ON public.reconciliation_runs;
CREATE POLICY reconciliation_runs_tenant_isolation ON public.reconciliation_runs
    FOR ALL
    USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
        )
    );

-- reconciliation_matches: Individual matches between source and target transactions
CREATE TABLE IF NOT EXISTS public.reconciliation_matches (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    run_id uuid NOT NULL,
    source_transaction_id uuid NOT NULL,
    target_transaction_id uuid,
    tenant_id uuid NOT NULL,
    match_type text NOT NULL, -- "exact", "fuzzy", "manual", "unmatched"
    confidence numeric(5, 4) NOT NULL, -- 0.0000 to 1.0000
    match_reason text,
    amount_diff numeric(15, 2),
    date_diff int, -- Days difference
    reviewed boolean NOT NULL DEFAULT false,
    reviewed_by uuid,
    reviewed_at timestamptz,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);

-- Foreign keys
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'reconciliation_matches_run_id_fkey' 
        AND conrelid = 'public.reconciliation_matches'::regclass
    ) THEN
        ALTER TABLE public.reconciliation_matches 
        ADD CONSTRAINT reconciliation_matches_run_id_fkey 
        FOREIGN KEY (run_id) REFERENCES public.reconciliation_runs(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'reconciliation_matches_source_transaction_id_fkey' 
        AND conrelid = 'public.reconciliation_matches'::regclass
    ) THEN
        ALTER TABLE public.reconciliation_matches 
        ADD CONSTRAINT reconciliation_matches_source_transaction_id_fkey 
        FOREIGN KEY (source_transaction_id) REFERENCES public.normalized_transactions(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'reconciliation_matches_tenant_id_fkey' 
        AND conrelid = 'public.reconciliation_matches'::regclass
    ) THEN
        ALTER TABLE public.reconciliation_matches 
        ADD CONSTRAINT reconciliation_matches_tenant_id_fkey 
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'reconciliation_matches_reviewed_by_fkey' 
        AND conrelid = 'public.reconciliation_matches'::regclass
    ) THEN
        ALTER TABLE public.reconciliation_matches 
        ADD CONSTRAINT reconciliation_matches_reviewed_by_fkey 
        FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reconciliation_matches_run_id ON public.reconciliation_matches USING btree (run_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_matches_tenant_id ON public.reconciliation_matches USING btree (tenant_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_matches_source_transaction_id ON public.reconciliation_matches USING btree (source_transaction_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_matches_target_transaction_id ON public.reconciliation_matches USING btree (target_transaction_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_matches_match_type ON public.reconciliation_matches USING btree (match_type);
CREATE INDEX IF NOT EXISTS idx_reconciliation_matches_confidence ON public.reconciliation_matches USING btree (confidence);
CREATE INDEX IF NOT EXISTS idx_reconciliation_matches_reviewed ON public.reconciliation_matches USING btree (reviewed);

-- Enable RLS
ALTER TABLE public.reconciliation_matches ENABLE ROW LEVEL SECURITY;

-- RLS Policy
DROP POLICY IF EXISTS reconciliation_matches_tenant_isolation ON public.reconciliation_matches;
CREATE POLICY reconciliation_matches_tenant_isolation ON public.reconciliation_matches
    FOR ALL
    USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
        )
    );

-- ============================================================================
-- EXPORT TABLE
-- ============================================================================

-- exports: Data export jobs and results
CREATE TABLE IF NOT EXISTS public.exports (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    type text NOT NULL, -- "csv", "json", "excel"
    format text NOT NULL, -- "matched", "unmatched", "all", "reconciliation_report"
    reconciliation_run_id uuid,
    ingestion_id uuid,
    status text NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
    storage_location text, -- URL or storage key
    signed_url text,
    signed_url_expires_at timestamptz,
    file_size_bytes int,
    row_count int,
    error_message text,
    trace_id text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz, -- Auto-cleanup after expiration
    PRIMARY KEY (id)
);

-- Foreign keys
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'exports_tenant_id_fkey' 
        AND conrelid = 'public.exports'::regclass
    ) THEN
        ALTER TABLE public.exports 
        ADD CONSTRAINT exports_tenant_id_fkey 
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'exports_user_id_fkey' 
        AND conrelid = 'public.exports'::regclass
    ) THEN
        ALTER TABLE public.exports 
        ADD CONSTRAINT exports_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'exports_reconciliation_run_id_fkey' 
        AND conrelid = 'public.exports'::regclass
    ) THEN
        ALTER TABLE public.exports 
        ADD CONSTRAINT exports_reconciliation_run_id_fkey 
        FOREIGN KEY (reconciliation_run_id) REFERENCES public.reconciliation_runs(id) ON DELETE SET NULL;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'exports_ingestion_id_fkey' 
        AND conrelid = 'public.exports'::regclass
    ) THEN
        ALTER TABLE public.exports 
        ADD CONSTRAINT exports_ingestion_id_fkey 
        FOREIGN KEY (ingestion_id) REFERENCES public.ingestions(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_exports_tenant_id ON public.exports USING btree (tenant_id);
CREATE INDEX IF NOT EXISTS idx_exports_user_id ON public.exports USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_exports_type ON public.exports USING btree (type);
CREATE INDEX IF NOT EXISTS idx_exports_status ON public.exports USING btree (status);
CREATE INDEX IF NOT EXISTS idx_exports_reconciliation_run_id ON public.exports USING btree (reconciliation_run_id);
CREATE INDEX IF NOT EXISTS idx_exports_ingestion_id ON public.exports USING btree (ingestion_id);
CREATE INDEX IF NOT EXISTS idx_exports_created_at_desc ON public.exports USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exports_expires_at ON public.exports USING btree (expires_at);

-- Enable RLS
ALTER TABLE public.exports ENABLE ROW LEVEL SECURITY;

-- RLS Policy
DROP POLICY IF EXISTS exports_tenant_isolation ON public.exports;
CREATE POLICY exports_tenant_isolation ON public.exports
    FOR ALL
    USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
        )
    );

-- ============================================================================
-- ONBOARDING TABLES
-- ============================================================================

-- tenant_onboarding_progress: Track onboarding progress per tenant/user
CREATE TABLE IF NOT EXISTS public.tenant_onboarding_progress (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    current_step text NOT NULL DEFAULT 'create_workspace',
    completed_steps text[] DEFAULT '{}'::text[],
    skipped_steps text[] DEFAULT '{}'::text[],
    progress int NOT NULL DEFAULT 0, -- 0-100
    metadata jsonb DEFAULT '{}'::jsonb,
    completed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (id),
    UNIQUE (tenant_id, user_id)
);

-- Foreign keys
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'tenant_onboarding_progress_tenant_id_fkey' 
        AND conrelid = 'public.tenant_onboarding_progress'::regclass
    ) THEN
        ALTER TABLE public.tenant_onboarding_progress 
        ADD CONSTRAINT tenant_onboarding_progress_tenant_id_fkey 
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'tenant_onboarding_progress_user_id_fkey' 
        AND conrelid = 'public.tenant_onboarding_progress'::regclass
    ) THEN
        ALTER TABLE public.tenant_onboarding_progress 
        ADD CONSTRAINT tenant_onboarding_progress_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tenant_onboarding_progress_tenant_id ON public.tenant_onboarding_progress USING btree (tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_onboarding_progress_user_id ON public.tenant_onboarding_progress USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_onboarding_progress_progress ON public.tenant_onboarding_progress USING btree (progress);

-- Enable RLS
ALTER TABLE public.tenant_onboarding_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policy
DROP POLICY IF EXISTS tenant_onboarding_progress_tenant_isolation ON public.tenant_onboarding_progress;
CREATE POLICY tenant_onboarding_progress_tenant_isolation ON public.tenant_onboarding_progress
    FOR ALL
    USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
        )
    );

-- onboarding_events: Event log for onboarding activities
CREATE TABLE IF NOT EXISTS public.onboarding_events (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id uuid,
    user_id uuid NOT NULL,
    event_type text NOT NULL, -- onboarding_started, step_completed, activation_complete
    step_id text,
    trace_id text,
    properties jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);

-- Foreign keys
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'onboarding_events_tenant_id_fkey' 
        AND conrelid = 'public.onboarding_events'::regclass
    ) THEN
        ALTER TABLE public.onboarding_events 
        ADD CONSTRAINT onboarding_events_tenant_id_fkey 
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'onboarding_events_user_id_fkey' 
        AND conrelid = 'public.onboarding_events'::regclass
    ) THEN
        ALTER TABLE public.onboarding_events 
        ADD CONSTRAINT onboarding_events_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_onboarding_events_tenant_id ON public.onboarding_events USING btree (tenant_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_events_user_id ON public.onboarding_events USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_events_event_type ON public.onboarding_events USING btree (event_type);
CREATE INDEX IF NOT EXISTS idx_onboarding_events_trace_id ON public.onboarding_events USING btree (trace_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_events_created_at_desc ON public.onboarding_events USING btree (created_at DESC);

-- Enable RLS
ALTER TABLE public.onboarding_events ENABLE ROW LEVEL SECURITY;

-- RLS Policy
DROP POLICY IF EXISTS onboarding_events_tenant_isolation ON public.onboarding_events;
CREATE POLICY onboarding_events_tenant_isolation ON public.onboarding_events
    FOR ALL
    USING (
        tenant_id IS NULL OR tenant_id IN (
            SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
        )
    );

COMMIT;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- This migration creates the following tables:
-- 1. ingestion_sources - Data source configurations
-- 2. ingestions - Ingestion run records
-- 3. raw_records - Raw data before normalization
-- 4. normalized_transactions - Normalized transaction data
-- 5. reconciliation_runs - Reconciliation execution runs
-- 6. reconciliation_matches - Transaction matches
-- 7. exports - Data export jobs
-- 8. tenant_onboarding_progress - Onboarding tracking
-- 9. onboarding_events - Onboarding event log
--
-- All tables include:
-- - Proper foreign key constraints
-- - Comprehensive indexes for performance
-- - Row Level Security (RLS) enabled
-- - Tenant isolation policies
-- - Idempotent DDL (safe to run multiple times)
-- ============================================================================
