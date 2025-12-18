-- Ingestion Pipeline Migration
-- Creates tables for universal ingestion system

-- Ingestion Sources
CREATE TABLE IF NOT EXISTS ingestion_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- csv, stripe, shopify, manual
  connector_type VARCHAR(50), -- stripe, shopify, etc. (null for CSV/manual)
  config_encrypted TEXT, -- Encrypted connector config
  config_metadata JSONB DEFAULT '{}', -- Non-sensitive metadata
  status VARCHAR(50) DEFAULT 'active', -- active, paused, error
  last_sync_at TIMESTAMP,
  last_sync_status VARCHAR(50), -- success, failed, partial
  last_sync_error TEXT,
  sync_schedule VARCHAR(100), -- Cron expression
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_ingestion_sources_tenant_id ON ingestion_sources(tenant_id);
CREATE INDEX idx_ingestion_sources_user_id ON ingestion_sources(user_id);
CREATE INDEX idx_ingestion_sources_type ON ingestion_sources(type);
CREATE INDEX idx_ingestion_sources_connector_type ON ingestion_sources(connector_type);
CREATE INDEX idx_ingestion_sources_status ON ingestion_sources(status);
CREATE INDEX idx_ingestion_sources_deleted_at ON ingestion_sources(deleted_at);

-- Ingestions
CREATE TABLE IF NOT EXISTS ingestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES ingestion_sources(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  idempotency_key VARCHAR(255) UNIQUE, -- For idempotent retries
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  error_message TEXT,
  error_stack TEXT,
  trace_id VARCHAR(255), -- For observability
  raw_record_count INTEGER DEFAULT 0,
  normalized_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  retry_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ingestions_source_id ON ingestions(source_id);
CREATE INDEX idx_ingestions_tenant_id ON ingestions(tenant_id);
CREATE INDEX idx_ingestions_user_id ON ingestions(user_id);
CREATE INDEX idx_ingestions_status ON ingestions(status);
CREATE INDEX idx_ingestions_idempotency_key ON ingestions(idempotency_key);
CREATE INDEX idx_ingestions_started_at ON ingestions(started_at DESC);

-- Raw Records
CREATE TABLE IF NOT EXISTS raw_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingestion_id UUID NOT NULL REFERENCES ingestions(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES ingestion_sources(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  raw_data JSONB NOT NULL, -- Original raw data from source
  row_number INTEGER, -- For CSV imports
  external_id VARCHAR(255), -- External ID from source system
  status VARCHAR(50) DEFAULT 'pending', -- pending, normalized, failed
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_raw_records_ingestion_id ON raw_records(ingestion_id);
CREATE INDEX idx_raw_records_source_id ON raw_records(source_id);
CREATE INDEX idx_raw_records_tenant_id ON raw_records(tenant_id);
CREATE INDEX idx_raw_records_external_id ON raw_records(external_id);
CREATE INDEX idx_raw_records_status ON raw_records(status);

-- Normalized Transactions
CREATE TABLE IF NOT EXISTS normalized_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingestion_id UUID NOT NULL REFERENCES ingestions(id) ON DELETE CASCADE,
  raw_record_id UUID UNIQUE REFERENCES raw_records(id) ON DELETE SET NULL,
  tenant_id UUID NOT NULL,
  source_id UUID NOT NULL REFERENCES ingestion_sources(id) ON DELETE CASCADE,
  external_id VARCHAR(255), -- External ID from source system
  amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  date DATE NOT NULL,
  description TEXT,
  category VARCHAR(100),
  payment_method VARCHAR(100),
  reference VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_normalized_transactions_ingestion_id ON normalized_transactions(ingestion_id);
CREATE INDEX idx_normalized_transactions_raw_record_id ON normalized_transactions(raw_record_id);
CREATE INDEX idx_normalized_transactions_tenant_id ON normalized_transactions(tenant_id);
CREATE INDEX idx_normalized_transactions_source_id ON normalized_transactions(source_id);
CREATE INDEX idx_normalized_transactions_external_id ON normalized_transactions(external_id);
CREATE INDEX idx_normalized_transactions_date ON normalized_transactions(date);
CREATE INDEX idx_normalized_transactions_amount ON normalized_transactions(amount);
CREATE INDEX idx_normalized_transactions_currency ON normalized_transactions(currency);
CREATE INDEX idx_normalized_transactions_tenant_date_amount_currency ON normalized_transactions(tenant_id, date, amount, currency);

-- Reconciliation Runs
CREATE TABLE IF NOT EXISTS reconciliation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingestion_id UUID REFERENCES ingestions(id) ON DELETE SET NULL,
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending', -- pending, running, completed, failed
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  source_count INTEGER DEFAULT 0,
  target_count INTEGER DEFAULT 0,
  matched_count INTEGER DEFAULT 0,
  unmatched_source_count INTEGER DEFAULT 0,
  unmatched_target_count INTEGER DEFAULT 0,
  confidence_avg DECIMAL(5, 4),
  error_message TEXT,
  trace_id VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reconciliation_runs_ingestion_id ON reconciliation_runs(ingestion_id);
CREATE INDEX idx_reconciliation_runs_tenant_id ON reconciliation_runs(tenant_id);
CREATE INDEX idx_reconciliation_runs_user_id ON reconciliation_runs(user_id);
CREATE INDEX idx_reconciliation_runs_status ON reconciliation_runs(status);
CREATE INDEX idx_reconciliation_runs_started_at ON reconciliation_runs(started_at DESC);

-- Reconciliation Matches
CREATE TABLE IF NOT EXISTS reconciliation_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES reconciliation_runs(id) ON DELETE CASCADE,
  source_transaction_id UUID NOT NULL REFERENCES normalized_transactions(id) ON DELETE CASCADE,
  target_transaction_id UUID REFERENCES normalized_transactions(id) ON DELETE SET NULL,
  tenant_id UUID NOT NULL,
  match_type VARCHAR(50) NOT NULL, -- exact, fuzzy, manual, unmatched
  confidence DECIMAL(5, 4) NOT NULL, -- 0.0000 to 1.0000
  match_reason TEXT,
  amount_diff DECIMAL(15, 2),
  date_diff INTEGER, -- Days difference
  reviewed BOOLEAN DEFAULT FALSE,
  reviewed_by UUID,
  reviewed_at TIMESTAMP,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reconciliation_matches_run_id ON reconciliation_matches(run_id);
CREATE INDEX idx_reconciliation_matches_tenant_id ON reconciliation_matches(tenant_id);
CREATE INDEX idx_reconciliation_matches_source_transaction_id ON reconciliation_matches(source_transaction_id);
CREATE INDEX idx_reconciliation_matches_target_transaction_id ON reconciliation_matches(target_transaction_id);
CREATE INDEX idx_reconciliation_matches_match_type ON reconciliation_matches(match_type);
CREATE INDEX idx_reconciliation_matches_confidence ON reconciliation_matches(confidence);
CREATE INDEX idx_reconciliation_matches_reviewed ON reconciliation_matches(reviewed);

-- Exports
CREATE TABLE IF NOT EXISTS exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL, -- csv, json, excel
  format VARCHAR(50) NOT NULL, -- matched, unmatched, all, reconciliation_report
  reconciliation_run_id UUID REFERENCES reconciliation_runs(id) ON DELETE SET NULL,
  ingestion_id UUID REFERENCES ingestions(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
  storage_location VARCHAR(500), -- URL or storage key
  signed_url TEXT,
  signed_url_expires_at TIMESTAMP,
  file_size_bytes INTEGER,
  row_count INTEGER,
  error_message TEXT,
  trace_id VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP -- Auto-cleanup after expiration
);

CREATE INDEX idx_exports_tenant_id ON exports(tenant_id);
CREATE INDEX idx_exports_user_id ON exports(user_id);
CREATE INDEX idx_exports_type ON exports(type);
CREATE INDEX idx_exports_status ON exports(status);
CREATE INDEX idx_exports_reconciliation_run_id ON exports(reconciliation_run_id);
CREATE INDEX idx_exports_ingestion_id ON exports(ingestion_id);
CREATE INDEX idx_exports_created_at ON exports(created_at DESC);
CREATE INDEX idx_exports_expires_at ON exports(expires_at);
