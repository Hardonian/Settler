-- ============================================================================
-- INTEGRATIONS FRAMEWORK MIGRATION
-- ============================================================================
-- Comprehensive schema for Tier-1 to Tier-3 integrations
-- Supports: Bank feeds, Accounting, Subscriptions, Marketplaces, ERP, Tax
-- ============================================================================

BEGIN;

-- ============================================================================
-- ENUMS
-- ============================================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'connector_auth_type') THEN
    CREATE TYPE public.connector_auth_type AS ENUM ('oauth2', 'api_key', 'manual_upload', 'token_based');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'connector_status') THEN
    CREATE TYPE public.connector_status AS ENUM ('not_connected', 'connecting', 'connected', 'needs_attention', 'error', 'disconnected');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sync_run_status') THEN
    CREATE TYPE public.sync_run_status AS ENUM ('pending', 'running', 'completed', 'failed', 'cancelled');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'financial_entity_type') THEN
    CREATE TYPE public.financial_entity_type AS ENUM ('transaction', 'balance', 'payout', 'invoice', 'subscription', 'tax_estimate', 'fee', 'refund');
  END IF;
END $$;

-- ============================================================================
-- CONNECTOR INSTANCES (per tenant/provider)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.connectors (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  provider_id text NOT NULL, -- e.g., 'plaid', 'truelayer', 'freshbooks'
  display_name text NOT NULL,
  status public.connector_status NOT NULL DEFAULT 'not_connected',
  auth_type public.connector_auth_type NOT NULL,
  config jsonb DEFAULT '{}'::jsonb, -- Non-sensitive config (e.g., environment, region)
  last_sync_at timestamptz,
  last_successful_sync_at timestamptz,
  last_error text,
  error_count int4 DEFAULT 0,
  consecutive_failures int4 DEFAULT 0,
  auto_disabled bool DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  PRIMARY KEY (id),
  CONSTRAINT connectors_tenant_provider_unique UNIQUE (tenant_id, provider_id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'connectors_tenant_id_fkey' AND conrelid = 'public.connectors'::regclass
  ) THEN
    ALTER TABLE public.connectors ADD CONSTRAINT connectors_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'connectors_created_by_fkey' AND conrelid = 'public.connectors'::regclass
  ) THEN
    ALTER TABLE public.connectors ADD CONSTRAINT connectors_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_connectors_tenant_id ON public.connectors USING btree (tenant_id);
CREATE INDEX IF NOT EXISTS idx_connectors_provider_id ON public.connectors USING btree (provider_id);
CREATE INDEX IF NOT EXISTS idx_connectors_status ON public.connectors USING btree (status);
CREATE INDEX IF NOT EXISTS idx_connectors_last_sync_at ON public.connectors USING btree (last_sync_at DESC) WHERE last_sync_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_connectors_auto_disabled ON public.connectors USING btree (auto_disabled) WHERE auto_disabled = true;

-- ============================================================================
-- ENCRYPTED CREDENTIALS STORAGE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.connector_credentials (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  connector_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  -- Encrypted credentials stored as JSONB (encrypted at application level)
  encrypted_credentials jsonb NOT NULL,
  -- OAuth tokens
  access_token_encrypted text,
  refresh_token_encrypted text,
  token_expires_at timestamptz,
  -- Metadata
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  rotated_at timestamptz,
  PRIMARY KEY (id),
  CONSTRAINT connector_credentials_connector_unique UNIQUE (connector_id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'connector_credentials_connector_id_fkey' AND conrelid = 'public.connector_credentials'::regclass
  ) THEN
    ALTER TABLE public.connector_credentials ADD CONSTRAINT connector_credentials_connector_id_fkey FOREIGN KEY (connector_id) REFERENCES connectors(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'connector_credentials_tenant_id_fkey' AND conrelid = 'public.connector_credentials'::regclass
  ) THEN
    ALTER TABLE public.connector_credentials ADD CONSTRAINT connector_credentials_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_connector_credentials_connector_id ON public.connector_credentials USING btree (connector_id);
CREATE INDEX IF NOT EXISTS idx_connector_credentials_tenant_id ON public.connector_credentials USING btree (tenant_id);
CREATE INDEX IF NOT EXISTS idx_connector_credentials_token_expires_at ON public.connector_credentials USING btree (token_expires_at) WHERE token_expires_at IS NOT NULL;

-- ============================================================================
-- EXTERNAL ACCOUNTS/INSTITUTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.connector_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  connector_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  provider_account_id text NOT NULL, -- External account ID from provider
  account_name text NOT NULL,
  account_type text, -- e.g., 'checking', 'savings', 'credit_card', 'business'
  currency text NOT NULL DEFAULT 'USD',
  institution_name text,
  institution_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  is_active bool DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  CONSTRAINT connector_accounts_connector_provider_unique UNIQUE (connector_id, provider_account_id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'connector_accounts_connector_id_fkey' AND conrelid = 'public.connector_accounts'::regclass
  ) THEN
    ALTER TABLE public.connector_accounts ADD CONSTRAINT connector_accounts_connector_id_fkey FOREIGN KEY (connector_id) REFERENCES connectors(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'connector_accounts_tenant_id_fkey' AND conrelid = 'public.connector_accounts'::regclass
  ) THEN
    ALTER TABLE public.connector_accounts ADD CONSTRAINT connector_accounts_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_connector_accounts_connector_id ON public.connector_accounts USING btree (connector_id);
CREATE INDEX IF NOT EXISTS idx_connector_accounts_tenant_id ON public.connector_accounts USING btree (tenant_id);
CREATE INDEX IF NOT EXISTS idx_connector_accounts_provider_account_id ON public.connector_accounts USING btree (provider_account_id);
CREATE INDEX IF NOT EXISTS idx_connector_accounts_is_active ON public.connector_accounts USING btree (is_active) WHERE is_active = true;

-- ============================================================================
-- SYNC RUNS (tracking sync execution)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.sync_runs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  connector_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  status public.sync_run_status NOT NULL DEFAULT 'pending',
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  -- Metrics
  accounts_synced int4 DEFAULT 0,
  transactions_synced int4 DEFAULT 0,
  balances_synced int4 DEFAULT 0,
  payouts_synced int4 DEFAULT 0,
  invoices_synced int4 DEFAULT 0,
  subscriptions_synced int4 DEFAULT 0,
  errors_count int4 DEFAULT 0,
  warnings_count int4 DEFAULT 0,
  -- Error details
  error_message text,
  error_details jsonb,
  -- Sync parameters
  sync_since timestamptz,
  sync_until timestamptz,
  cursor text, -- For pagination/cursor-based syncs
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sync_runs_connector_id_fkey' AND conrelid = 'public.sync_runs'::regclass
  ) THEN
    ALTER TABLE public.sync_runs ADD CONSTRAINT sync_runs_connector_id_fkey FOREIGN KEY (connector_id) REFERENCES connectors(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sync_runs_tenant_id_fkey' AND conrelid = 'public.sync_runs'::regclass
  ) THEN
    ALTER TABLE public.sync_runs ADD CONSTRAINT sync_runs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sync_runs_connector_id ON public.sync_runs USING btree (connector_id);
CREATE INDEX IF NOT EXISTS idx_sync_runs_tenant_id ON public.sync_runs USING btree (tenant_id);
CREATE INDEX IF NOT EXISTS idx_sync_runs_status ON public.sync_runs USING btree (status);
CREATE INDEX IF NOT EXISTS idx_sync_runs_started_at_desc ON public.sync_runs USING btree (started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_runs_connector_started_at ON public.sync_runs USING btree (connector_id, started_at DESC);

-- ============================================================================
-- SYNC CURSORS (for pagination/cursor-based syncs)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.sync_cursors (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  connector_id uuid NOT NULL,
  account_id uuid, -- Optional: cursor per account
  tenant_id uuid NOT NULL,
  cursor_key text NOT NULL, -- e.g., 'transactions', 'balances', 'payouts'
  cursor_value text NOT NULL,
  last_synced_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  CONSTRAINT sync_cursors_unique UNIQUE (connector_id, COALESCE(account_id, '00000000-0000-0000-0000-000000000000'::uuid), cursor_key)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sync_cursors_connector_id_fkey' AND conrelid = 'public.sync_cursors'::regclass
  ) THEN
    ALTER TABLE public.sync_cursors ADD CONSTRAINT sync_cursors_connector_id_fkey FOREIGN KEY (connector_id) REFERENCES connectors(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sync_cursors_account_id_fkey' AND conrelid = 'public.sync_cursors'::regclass
  ) THEN
    ALTER TABLE public.sync_cursors ADD CONSTRAINT sync_cursors_account_id_fkey FOREIGN KEY (account_id) REFERENCES connector_accounts(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sync_cursors_tenant_id_fkey' AND conrelid = 'public.sync_cursors'::regclass
  ) THEN
    ALTER TABLE public.sync_cursors ADD CONSTRAINT sync_cursors_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sync_cursors_connector_account ON public.sync_cursors USING btree (connector_id, account_id);
CREATE INDEX IF NOT EXISTS idx_sync_cursors_tenant_id ON public.sync_cursors USING btree (tenant_id);

-- ============================================================================
-- CANONICAL FINANCIAL TRANSACTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  connector_id uuid NOT NULL,
  account_id uuid, -- FK to connector_accounts
  -- Canonical fields
  external_id text NOT NULL, -- Provider's transaction ID
  transaction_type text NOT NULL, -- 'debit', 'credit', 'transfer', 'fee', 'refund'
  amount_cents bigint NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  occurred_at timestamptz NOT NULL,
  description text,
  -- Reference fields
  reference_id text, -- e.g., order ID, invoice ID
  reference_type text, -- e.g., 'order', 'invoice', 'payout'
  -- Metadata
  provider_metadata jsonb DEFAULT '{}'::jsonb, -- Provider-specific fields
  raw_payload jsonb, -- Full raw payload for audit
  -- Idempotency
  idempotency_key text NOT NULL,
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  CONSTRAINT financial_transactions_idempotency_unique UNIQUE (tenant_id, connector_id, idempotency_key)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'financial_transactions_tenant_id_fkey' AND conrelid = 'public.financial_transactions'::regclass
  ) THEN
    ALTER TABLE public.financial_transactions ADD CONSTRAINT financial_transactions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'financial_transactions_connector_id_fkey' AND conrelid = 'public.financial_transactions'::regclass
  ) THEN
    ALTER TABLE public.financial_transactions ADD CONSTRAINT financial_transactions_connector_id_fkey FOREIGN KEY (connector_id) REFERENCES connectors(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'financial_transactions_account_id_fkey' AND conrelid = 'public.financial_transactions'::regclass
  ) THEN
    ALTER TABLE public.financial_transactions ADD CONSTRAINT financial_transactions_account_id_fkey FOREIGN KEY (account_id) REFERENCES connector_accounts(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_financial_transactions_tenant_id ON public.financial_transactions USING btree (tenant_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_connector_id ON public.financial_transactions USING btree (connector_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_account_id ON public.financial_transactions USING btree (account_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_occurred_at ON public.financial_transactions USING btree (occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_external_id ON public.financial_transactions USING btree (connector_id, external_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_reference ON public.financial_transactions USING btree (reference_type, reference_id) WHERE reference_id IS NOT NULL;

-- ============================================================================
-- CANONICAL BALANCES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.financial_balances (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  connector_id uuid NOT NULL,
  account_id uuid NOT NULL,
  -- Balance fields
  balance_cents bigint NOT NULL,
  available_balance_cents bigint, -- If different from balance
  currency text NOT NULL DEFAULT 'USD',
  -- Snapshot timestamp
  snapshot_at timestamptz NOT NULL DEFAULT now(),
  -- Metadata
  provider_metadata jsonb DEFAULT '{}'::jsonb,
  raw_payload jsonb,
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'financial_balances_tenant_id_fkey' AND conrelid = 'public.financial_balances'::regclass
  ) THEN
    ALTER TABLE public.financial_balances ADD CONSTRAINT financial_balances_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'financial_balances_connector_id_fkey' AND conrelid = 'public.financial_balances'::regclass
  ) THEN
    ALTER TABLE public.financial_balances ADD CONSTRAINT financial_balances_connector_id_fkey FOREIGN KEY (connector_id) REFERENCES connectors(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'financial_balances_account_id_fkey' AND conrelid = 'public.financial_balances'::regclass
  ) THEN
    ALTER TABLE public.financial_balances ADD CONSTRAINT financial_balances_account_id_fkey FOREIGN KEY (account_id) REFERENCES connector_accounts(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_financial_balances_tenant_id ON public.financial_balances USING btree (tenant_id);
CREATE INDEX IF NOT EXISTS idx_financial_balances_account_id ON public.financial_balances USING btree (account_id);
CREATE INDEX IF NOT EXISTS idx_financial_balances_snapshot_at_desc ON public.financial_balances USING btree (account_id, snapshot_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS financial_balances_account_snapshot_unique ON public.financial_balances USING btree (account_id, snapshot_at);

-- ============================================================================
-- CANONICAL PAYOUTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.financial_payouts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  connector_id uuid NOT NULL,
  account_id uuid, -- Source account
  -- Payout fields
  external_id text NOT NULL,
  amount_cents bigint NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL, -- 'pending', 'processing', 'completed', 'failed', 'cancelled'
  initiated_at timestamptz NOT NULL,
  completed_at timestamptz,
  -- Fee information
  fee_cents bigint DEFAULT 0,
  net_amount_cents bigint, -- amount - fee
  -- Destination
  destination_type text, -- 'bank_account', 'card', 'paypal', etc.
  destination_id text,
  -- Metadata
  description text,
  provider_metadata jsonb DEFAULT '{}'::jsonb,
  raw_payload jsonb,
  -- Idempotency
  idempotency_key text NOT NULL,
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  CONSTRAINT financial_payouts_idempotency_unique UNIQUE (tenant_id, connector_id, idempotency_key)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'financial_payouts_tenant_id_fkey' AND conrelid = 'public.financial_payouts'::regclass
  ) THEN
    ALTER TABLE public.financial_payouts ADD CONSTRAINT financial_payouts_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'financial_payouts_connector_id_fkey' AND conrelid = 'public.financial_payouts'::regclass
  ) THEN
    ALTER TABLE public.financial_payouts ADD CONSTRAINT financial_payouts_connector_id_fkey FOREIGN KEY (connector_id) REFERENCES connectors(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_financial_payouts_tenant_id ON public.financial_payouts USING btree (tenant_id);
CREATE INDEX IF NOT EXISTS idx_financial_payouts_connector_id ON public.financial_payouts USING btree (connector_id);
CREATE INDEX IF NOT EXISTS idx_financial_payouts_initiated_at_desc ON public.financial_payouts USING btree (initiated_at DESC);
CREATE INDEX IF NOT EXISTS idx_financial_payouts_status ON public.financial_payouts USING btree (status);
CREATE INDEX IF NOT EXISTS idx_financial_payouts_external_id ON public.financial_payouts USING btree (connector_id, external_id);

-- ============================================================================
-- CANONICAL INVOICES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.financial_invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  connector_id uuid NOT NULL,
  -- Invoice fields
  external_id text NOT NULL,
  invoice_number text,
  customer_id text,
  customer_name text,
  amount_cents bigint NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL, -- 'draft', 'sent', 'paid', 'overdue', 'cancelled'
  issue_date date,
  due_date date,
  paid_at timestamptz,
  -- Metadata
  line_items jsonb DEFAULT '[]'::jsonb,
  provider_metadata jsonb DEFAULT '{}'::jsonb,
  raw_payload jsonb,
  -- Idempotency
  idempotency_key text NOT NULL,
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  CONSTRAINT financial_invoices_idempotency_unique UNIQUE (tenant_id, connector_id, idempotency_key)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'financial_invoices_tenant_id_fkey' AND conrelid = 'public.financial_invoices'::regclass
  ) THEN
    ALTER TABLE public.financial_invoices ADD CONSTRAINT financial_invoices_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'financial_invoices_connector_id_fkey' AND conrelid = 'public.financial_invoices'::regclass
  ) THEN
    ALTER TABLE public.financial_invoices ADD CONSTRAINT financial_invoices_connector_id_fkey FOREIGN KEY (connector_id) REFERENCES connectors(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_financial_invoices_tenant_id ON public.financial_invoices USING btree (tenant_id);
CREATE INDEX IF NOT EXISTS idx_financial_invoices_connector_id ON public.financial_invoices USING btree (connector_id);
CREATE INDEX IF NOT EXISTS idx_financial_invoices_status ON public.financial_invoices USING btree (status);
CREATE INDEX IF NOT EXISTS idx_financial_invoices_due_date ON public.financial_invoices USING btree (due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_financial_invoices_external_id ON public.financial_invoices USING btree (connector_id, external_id);

-- ============================================================================
-- CANONICAL SUBSCRIPTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.financial_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  connector_id uuid NOT NULL,
  -- Subscription fields
  external_id text NOT NULL,
  customer_id text NOT NULL,
  customer_name text,
  plan_id text,
  plan_name text,
  status text NOT NULL, -- 'active', 'cancelled', 'past_due', 'trialing', 'paused'
  billing_cycle text, -- 'monthly', 'yearly', 'weekly', etc.
  amount_cents bigint NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end bool DEFAULT false,
  cancelled_at timestamptz,
  -- Metadata
  provider_metadata jsonb DEFAULT '{}'::jsonb,
  raw_payload jsonb,
  -- Idempotency
  idempotency_key text NOT NULL,
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  CONSTRAINT financial_subscriptions_idempotency_unique UNIQUE (tenant_id, connector_id, idempotency_key)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'financial_subscriptions_tenant_id_fkey' AND conrelid = 'public.financial_subscriptions'::regclass
  ) THEN
    ALTER TABLE public.financial_subscriptions ADD CONSTRAINT financial_subscriptions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'financial_subscriptions_connector_id_fkey' AND conrelid = 'public.financial_subscriptions'::regclass
  ) THEN
    ALTER TABLE public.financial_subscriptions ADD CONSTRAINT financial_subscriptions_connector_id_fkey FOREIGN KEY (connector_id) REFERENCES connectors(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_financial_subscriptions_tenant_id ON public.financial_subscriptions USING btree (tenant_id);
CREATE INDEX IF NOT EXISTS idx_financial_subscriptions_connector_id ON public.financial_subscriptions USING btree (connector_id);
CREATE INDEX IF NOT EXISTS idx_financial_subscriptions_status ON public.financial_subscriptions USING btree (status);
CREATE INDEX IF NOT EXISTS idx_financial_subscriptions_customer_id ON public.financial_subscriptions USING btree (connector_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_financial_subscriptions_external_id ON public.financial_subscriptions USING btree (connector_id, external_id);

-- ============================================================================
-- CANONICAL TAX ESTIMATES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.financial_tax_estimates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  connector_id uuid NOT NULL,
  -- Tax estimate fields
  external_id text NOT NULL,
  transaction_id text, -- Reference to transaction/invoice
  transaction_type text, -- 'sale', 'refund', 'adjustment'
  amount_cents bigint NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  tax_amount_cents bigint NOT NULL,
  tax_rate numeric, -- Percentage
  jurisdiction text, -- Country/state/city
  tax_type text, -- 'sales_tax', 'vat', 'gst', etc.
  occurred_at timestamptz NOT NULL,
  -- Metadata
  provider_metadata jsonb DEFAULT '{}'::jsonb,
  raw_payload jsonb,
  -- Idempotency
  idempotency_key text NOT NULL,
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  CONSTRAINT financial_tax_estimates_idempotency_unique UNIQUE (tenant_id, connector_id, idempotency_key)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'financial_tax_estimates_tenant_id_fkey' AND conrelid = 'public.financial_tax_estimates'::regclass
  ) THEN
    ALTER TABLE public.financial_tax_estimates ADD CONSTRAINT financial_tax_estimates_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'financial_tax_estimates_connector_id_fkey' AND conrelid = 'public.financial_tax_estimates'::regclass
  ) THEN
    ALTER TABLE public.financial_tax_estimates ADD CONSTRAINT financial_tax_estimates_connector_id_fkey FOREIGN KEY (connector_id) REFERENCES connectors(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_financial_tax_estimates_tenant_id ON public.financial_tax_estimates USING btree (tenant_id);
CREATE INDEX IF NOT EXISTS idx_financial_tax_estimates_connector_id ON public.financial_tax_estimates USING btree (connector_id);
CREATE INDEX IF NOT EXISTS idx_financial_tax_estimates_occurred_at_desc ON public.financial_tax_estimates USING btree (occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_financial_tax_estimates_transaction_id ON public.financial_tax_estimates USING btree (connector_id, transaction_id) WHERE transaction_id IS NOT NULL;

-- ============================================================================
-- RAW EVENTS (for audit and replay)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.raw_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  connector_id uuid NOT NULL,
  event_type text NOT NULL, -- 'webhook', 'poll', 'sync'
  event_id text NOT NULL, -- Provider's event ID (for deduplication)
  payload jsonb NOT NULL,
  processed bool DEFAULT false,
  processed_at timestamptz,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  CONSTRAINT raw_events_unique UNIQUE (connector_id, event_id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'raw_events_tenant_id_fkey' AND conrelid = 'public.raw_events'::regclass
  ) THEN
    ALTER TABLE public.raw_events ADD CONSTRAINT raw_events_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'raw_events_connector_id_fkey' AND conrelid = 'public.raw_events'::regclass
  ) THEN
    ALTER TABLE public.raw_events ADD CONSTRAINT raw_events_connector_id_fkey FOREIGN KEY (connector_id) REFERENCES connectors(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_raw_events_tenant_id ON public.raw_events USING btree (tenant_id);
CREATE INDEX IF NOT EXISTS idx_raw_events_connector_id ON public.raw_events USING btree (connector_id);
CREATE INDEX IF NOT EXISTS idx_raw_events_event_type ON public.raw_events USING btree (event_type);
CREATE INDEX IF NOT EXISTS idx_raw_events_processed ON public.raw_events USING btree (processed) WHERE processed = false;
CREATE INDEX IF NOT EXISTS idx_raw_events_created_at_desc ON public.raw_events USING btree (created_at DESC);

-- ============================================================================
-- WEBHOOK EVENTS (deduplication and replay)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.webhook_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  connector_id uuid NOT NULL,
  webhook_id text NOT NULL, -- Provider's webhook ID
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  signature text, -- For verification
  processed bool DEFAULT false,
  processed_at timestamptz,
  retry_count int4 DEFAULT 0,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  CONSTRAINT webhook_events_unique UNIQUE (connector_id, webhook_id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'webhook_events_tenant_id_fkey' AND conrelid = 'public.webhook_events'::regclass
  ) THEN
    ALTER TABLE public.webhook_events ADD CONSTRAINT webhook_events_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'webhook_events_connector_id_fkey' AND conrelid = 'public.webhook_events'::regclass
  ) THEN
    ALTER TABLE public.webhook_events ADD CONSTRAINT webhook_events_connector_id_fkey FOREIGN KEY (connector_id) REFERENCES connectors(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_webhook_events_tenant_id ON public.webhook_events USING btree (tenant_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_connector_id ON public.webhook_events USING btree (connector_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON public.webhook_events USING btree (processed) WHERE processed = false;
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at_desc ON public.webhook_events USING btree (created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connector_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connector_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_cursors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_tax_estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's tenant IDs
CREATE OR REPLACE FUNCTION get_user_tenant_ids() RETURNS uuid[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT tenant_id FROM app_private.memberships
    WHERE user_id = auth.uid() AND status = 'active'
    UNION
    SELECT tenant_id FROM public.user_tenants
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- RLS Policies for connectors
DROP POLICY IF EXISTS connectors_select_tenant ON public.connectors;
CREATE POLICY connectors_select_tenant ON public.connectors
  FOR SELECT
  USING (tenant_id = ANY(get_user_tenant_ids()));

DROP POLICY IF EXISTS connectors_insert_tenant ON public.connectors;
CREATE POLICY connectors_insert_tenant ON public.connectors
  FOR INSERT
  WITH CHECK (tenant_id = ANY(get_user_tenant_ids()));

DROP POLICY IF EXISTS connectors_update_tenant ON public.connectors;
CREATE POLICY connectors_update_tenant ON public.connectors
  FOR UPDATE
  USING (tenant_id = ANY(get_user_tenant_ids()))
  WITH CHECK (tenant_id = ANY(get_user_tenant_ids()));

DROP POLICY IF EXISTS connectors_delete_tenant ON public.connectors;
CREATE POLICY connectors_delete_tenant ON public.connectors
  FOR DELETE
  USING (tenant_id = ANY(get_user_tenant_ids()));

-- RLS Policies for connector_credentials
DROP POLICY IF EXISTS connector_credentials_select_tenant ON public.connector_credentials;
CREATE POLICY connector_credentials_select_tenant ON public.connector_credentials
  FOR SELECT
  USING (tenant_id = ANY(get_user_tenant_ids()));

DROP POLICY IF EXISTS connector_credentials_insert_tenant ON public.connector_credentials;
CREATE POLICY connector_credentials_insert_tenant ON public.connector_credentials
  FOR INSERT
  WITH CHECK (tenant_id = ANY(get_user_tenant_ids()));

DROP POLICY IF EXISTS connector_credentials_update_tenant ON public.connector_credentials;
CREATE POLICY connector_credentials_update_tenant ON public.connector_credentials
  FOR UPDATE
  USING (tenant_id = ANY(get_user_tenant_ids()))
  WITH CHECK (tenant_id = ANY(get_user_tenant_ids()));

DROP POLICY IF EXISTS connector_credentials_delete_tenant ON public.connector_credentials;
CREATE POLICY connector_credentials_delete_tenant ON public.connector_credentials
  FOR DELETE
  USING (tenant_id = ANY(get_user_tenant_ids()));

-- RLS Policies for connector_accounts
DROP POLICY IF EXISTS connector_accounts_select_tenant ON public.connector_accounts;
CREATE POLICY connector_accounts_select_tenant ON public.connector_accounts
  FOR SELECT
  USING (tenant_id = ANY(get_user_tenant_ids()));

DROP POLICY IF EXISTS connector_accounts_insert_tenant ON public.connector_accounts;
CREATE POLICY connector_accounts_insert_tenant ON public.connector_accounts
  FOR INSERT
  WITH CHECK (tenant_id = ANY(get_user_tenant_ids()));

DROP POLICY IF EXISTS connector_accounts_update_tenant ON public.connector_accounts;
CREATE POLICY connector_accounts_update_tenant ON public.connector_accounts
  FOR UPDATE
  USING (tenant_id = ANY(get_user_tenant_ids()))
  WITH CHECK (tenant_id = ANY(get_user_tenant_ids()));

DROP POLICY IF EXISTS connector_accounts_delete_tenant ON public.connector_accounts;
CREATE POLICY connector_accounts_delete_tenant ON public.connector_accounts
  FOR DELETE
  USING (tenant_id = ANY(get_user_tenant_ids()));

-- RLS Policies for sync_runs
DROP POLICY IF EXISTS sync_runs_select_tenant ON public.sync_runs;
CREATE POLICY sync_runs_select_tenant ON public.sync_runs
  FOR SELECT
  USING (tenant_id = ANY(get_user_tenant_ids()));

DROP POLICY IF EXISTS sync_runs_insert_tenant ON public.sync_runs;
CREATE POLICY sync_runs_insert_tenant ON public.sync_runs
  FOR INSERT
  WITH CHECK (tenant_id = ANY(get_user_tenant_ids()));

DROP POLICY IF EXISTS sync_runs_update_tenant ON public.sync_runs;
CREATE POLICY sync_runs_update_tenant ON public.sync_runs
  FOR UPDATE
  USING (tenant_id = ANY(get_user_tenant_ids()))
  WITH CHECK (tenant_id = ANY(get_user_tenant_ids()));

DROP POLICY IF EXISTS sync_runs_delete_tenant ON public.sync_runs;
CREATE POLICY sync_runs_delete_tenant ON public.sync_runs
  FOR DELETE
  USING (tenant_id = ANY(get_user_tenant_ids()));

-- RLS Policies for sync_cursors
DROP POLICY IF EXISTS sync_cursors_select_tenant ON public.sync_cursors;
CREATE POLICY sync_cursors_select_tenant ON public.sync_cursors
  FOR SELECT
  USING (tenant_id = ANY(get_user_tenant_ids()));

DROP POLICY IF EXISTS sync_cursors_insert_tenant ON public.sync_cursors;
CREATE POLICY sync_cursors_insert_tenant ON public.sync_cursors
  FOR INSERT
  WITH CHECK (tenant_id = ANY(get_user_tenant_ids()));

DROP POLICY IF EXISTS sync_cursors_update_tenant ON public.sync_cursors;
CREATE POLICY sync_cursors_update_tenant ON public.sync_cursors
  FOR UPDATE
  USING (tenant_id = ANY(get_user_tenant_ids()))
  WITH CHECK (tenant_id = ANY(get_user_tenant_ids()));

DROP POLICY IF EXISTS sync_cursors_delete_tenant ON public.sync_cursors;
CREATE POLICY sync_cursors_delete_tenant ON public.sync_cursors
  FOR DELETE
  USING (tenant_id = ANY(get_user_tenant_ids()));

-- RLS Policies for financial_transactions
DROP POLICY IF EXISTS financial_transactions_select_tenant ON public.financial_transactions;
CREATE POLICY financial_transactions_select_tenant ON public.financial_transactions
  FOR SELECT
  USING (tenant_id = ANY(get_user_tenant_ids()));

DROP POLICY IF EXISTS financial_transactions_insert_tenant ON public.financial_transactions;
CREATE POLICY financial_transactions_insert_tenant ON public.financial_transactions
  FOR INSERT
  WITH CHECK (tenant_id = ANY(get_user_tenant_ids()));

DROP POLICY IF EXISTS financial_transactions_update_tenant ON public.financial_transactions;
CREATE POLICY financial_transactions_update_tenant ON public.financial_transactions
  FOR UPDATE
  USING (tenant_id = ANY(get_user_tenant_ids()))
  WITH CHECK (tenant_id = ANY(get_user_tenant_ids()));

DROP POLICY IF EXISTS financial_transactions_delete_tenant ON public.financial_transactions;
CREATE POLICY financial_transactions_delete_tenant ON public.financial_transactions
  FOR DELETE
  USING (tenant_id = ANY(get_user_tenant_ids()));

-- RLS Policies for financial_balances
DROP POLICY IF EXISTS financial_balances_select_tenant ON public.financial_balances;
CREATE POLICY financial_balances_select_tenant ON public.financial_balances
  FOR SELECT
  USING (tenant_id = ANY(get_user_tenant_ids()));

DROP POLICY IF EXISTS financial_balances_insert_tenant ON public.financial_balances;
CREATE POLICY financial_balances_insert_tenant ON public.financial_balances
  FOR INSERT
  WITH CHECK (tenant_id = ANY(get_user_tenant_ids()));

DROP POLICY IF EXISTS financial_balances_update_tenant ON public.financial_balances;
CREATE POLICY financial_balances_update_tenant ON public.financial_balances
  FOR UPDATE
  USING (tenant_id = ANY(get_user_tenant_ids()))
  WITH CHECK (tenant_id = ANY(get_user_tenant_ids()));

DROP POLICY IF EXISTS financial_balances_delete_tenant ON public.financial_balances;
CREATE POLICY financial_balances_delete_tenant ON public.financial_balances
  FOR DELETE
  USING (tenant_id = ANY(get_user_tenant_ids()));

-- RLS Policies for financial_payouts
DROP POLICY IF EXISTS financial_payouts_select_tenant ON public.financial_payouts;
CREATE POLICY financial_payouts_select_tenant ON public.financial_payouts
  FOR SELECT
  USING (tenant_id = ANY(get_user_tenant_ids()));

DROP POLICY IF EXISTS financial_payouts_insert_tenant ON public.financial_payouts;
CREATE POLICY financial_payouts_insert_tenant ON public.financial_payouts
  FOR INSERT
  WITH CHECK (tenant_id = ANY(get_user_tenant_ids()));

DROP POLICY IF EXISTS financial_payouts_update_tenant ON public.financial_payouts;
CREATE POLICY financial_payouts_update_tenant ON public.financial_payouts
  FOR UPDATE
  USING (tenant_id = ANY(get_user_tenant_ids()))
  WITH CHECK (tenant_id = ANY(get_user_tenant_ids()));

DROP POLICY IF EXISTS financial_payouts_delete_tenant ON public.financial_payouts;
CREATE POLICY financial_payouts_delete_tenant ON public.financial_payouts
  FOR DELETE
  USING (tenant_id = ANY(get_user_tenant_ids()));

-- RLS Policies for financial_invoices
DROP POLICY IF EXISTS financial_invoices_select_tenant ON public.financial_invoices;
CREATE POLICY financial_invoices_select_tenant ON public.financial_invoices
  FOR SELECT
  USING (tenant_id = ANY(get_user_tenant_ids()));

DROP POLICY IF EXISTS financial_invoices_insert_tenant ON public.financial_invoices;
CREATE POLICY financial_invoices_insert_tenant ON public.financial_invoices
  FOR INSERT
  WITH CHECK (tenant_id = ANY(get_user_tenant_ids()));

DROP POLICY IF EXISTS financial_invoices_update_tenant ON public.financial_invoices;
CREATE POLICY financial_invoices_update_tenant ON public.financial_invoices
  FOR UPDATE
  USING (tenant_id = ANY(get_user_tenant_ids()))
  WITH CHECK (tenant_id = ANY(get_user_tenant_ids()));

DROP POLICY IF EXISTS financial_invoices_delete_tenant ON public.financial_invoices;
CREATE POLICY financial_invoices_delete_tenant ON public.financial_invoices
  FOR DELETE
  USING (tenant_id = ANY(get_user_tenant_ids()));

-- RLS Policies for financial_subscriptions
DROP POLICY IF EXISTS financial_subscriptions_select_tenant ON public.financial_subscriptions;
CREATE POLICY financial_subscriptions_select_tenant ON public.financial_subscriptions
  FOR SELECT
  USING (tenant_id = ANY(get_user_tenant_ids()));

DROP POLICY IF EXISTS financial_subscriptions_insert_tenant ON public.financial_subscriptions;
CREATE POLICY financial_subscriptions_insert_tenant ON public.financial_subscriptions
  FOR INSERT
  WITH CHECK (tenant_id = ANY(get_user_tenant_ids()));

DROP POLICY IF EXISTS financial_subscriptions_update_tenant ON public.financial_subscriptions;
CREATE POLICY financial_subscriptions_update_tenant ON public.financial_subscriptions
  FOR UPDATE
  USING (tenant_id = ANY(get_user_tenant_ids()))
  WITH CHECK (tenant_id = ANY(get_user_tenant_ids()));

DROP POLICY IF EXISTS financial_subscriptions_delete_tenant ON public.financial_subscriptions;
CREATE POLICY financial_subscriptions_delete_tenant ON public.financial_subscriptions
  FOR DELETE
  USING (tenant_id = ANY(get_user_tenant_ids()));

-- RLS Policies for financial_tax_estimates
DROP POLICY IF EXISTS financial_tax_estimates_select_tenant ON public.financial_tax_estimates;
CREATE POLICY financial_tax_estimates_select_tenant ON public.financial_tax_estimates
  FOR SELECT
  USING (tenant_id = ANY(get_user_tenant_ids()));

DROP POLICY IF EXISTS financial_tax_estimates_insert_tenant ON public.financial_tax_estimates;
CREATE POLICY financial_tax_estimates_insert_tenant ON public.financial_tax_estimates
  FOR INSERT
  WITH CHECK (tenant_id = ANY(get_user_tenant_ids()));

DROP POLICY IF EXISTS financial_tax_estimates_update_tenant ON public.financial_tax_estimates;
CREATE POLICY financial_tax_estimates_update_tenant ON public.financial_tax_estimates
  FOR UPDATE
  USING (tenant_id = ANY(get_user_tenant_ids()))
  WITH CHECK (tenant_id = ANY(get_user_tenant_ids()));

DROP POLICY IF EXISTS financial_tax_estimates_delete_tenant ON public.financial_tax_estimates;
CREATE POLICY financial_tax_estimates_delete_tenant ON public.financial_tax_estimates
  FOR DELETE
  USING (tenant_id = ANY(get_user_tenant_ids()));

-- RLS Policies for raw_events
DROP POLICY IF EXISTS raw_events_select_tenant ON public.raw_events;
CREATE POLICY raw_events_select_tenant ON public.raw_events
  FOR SELECT
  USING (tenant_id = ANY(get_user_tenant_ids()));

DROP POLICY IF EXISTS raw_events_insert_tenant ON public.raw_events;
CREATE POLICY raw_events_insert_tenant ON public.raw_events
  FOR INSERT
  WITH CHECK (tenant_id = ANY(get_user_tenant_ids()));

DROP POLICY IF EXISTS raw_events_update_tenant ON public.raw_events;
CREATE POLICY raw_events_update_tenant ON public.raw_events
  FOR UPDATE
  USING (tenant_id = ANY(get_user_tenant_ids()))
  WITH CHECK (tenant_id = ANY(get_user_tenant_ids()));

DROP POLICY IF EXISTS raw_events_delete_tenant ON public.raw_events;
CREATE POLICY raw_events_delete_tenant ON public.raw_events
  FOR DELETE
  USING (tenant_id = ANY(get_user_tenant_ids()));

-- RLS Policies for webhook_events
DROP POLICY IF EXISTS webhook_events_select_tenant ON public.webhook_events;
CREATE POLICY webhook_events_select_tenant ON public.webhook_events
  FOR SELECT
  USING (tenant_id = ANY(get_user_tenant_ids()));

DROP POLICY IF EXISTS webhook_events_insert_tenant ON public.webhook_events;
CREATE POLICY webhook_events_insert_tenant ON public.webhook_events
  FOR INSERT
  WITH CHECK (tenant_id = ANY(get_user_tenant_ids()));

DROP POLICY IF EXISTS webhook_events_update_tenant ON public.webhook_events;
CREATE POLICY webhook_events_update_tenant ON public.webhook_events
  FOR UPDATE
  USING (tenant_id = ANY(get_user_tenant_ids()))
  WITH CHECK (tenant_id = ANY(get_user_tenant_ids()));

DROP POLICY IF EXISTS webhook_events_delete_tenant ON public.webhook_events;
CREATE POLICY webhook_events_delete_tenant ON public.webhook_events
  FOR DELETE
  USING (tenant_id = ANY(get_user_tenant_ids()));

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_connectors_updated_at BEFORE UPDATE ON public.connectors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_connector_credentials_updated_at BEFORE UPDATE ON public.connector_credentials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_connector_accounts_updated_at BEFORE UPDATE ON public.connector_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_payouts_updated_at BEFORE UPDATE ON public.financial_payouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_invoices_updated_at BEFORE UPDATE ON public.financial_invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_subscriptions_updated_at BEFORE UPDATE ON public.financial_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sync_cursors_updated_at BEFORE UPDATE ON public.sync_cursors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;
