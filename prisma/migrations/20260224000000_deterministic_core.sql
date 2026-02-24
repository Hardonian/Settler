-- ============================================================================
-- DETERMINISTIC CORE V1 - Run Snapshots and Execution Provenance
-- Migration: 20260224000000_deterministic_core.sql
-- ============================================================================

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- RUN SNAPSHOTS TABLE
-- Immutable snapshot of run state before processing begins
-- ============================================================================

CREATE TABLE IF NOT EXISTS run_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  recon_job_id UUID NOT NULL,
  
  -- Fingerprints for determinism
  run_fingerprint VARCHAR(64) NOT NULL,
  input_fingerprint VARCHAR(64) NOT NULL,
  source_data_fingerprint VARCHAR(64) NOT NULL,
  target_data_fingerprint VARCHAR(64) NOT NULL,
  
  -- Configuration hashes
  adapter_config_hashes JSONB DEFAULT '{}',
  pipeline_id VARCHAR(255) NOT NULL,
  pipeline_version VARCHAR(64) NOT NULL DEFAULT '1',
  ruleset_id VARCHAR(255) NOT NULL,
  ruleset_version VARCHAR(64) NOT NULL DEFAULT '1',
  ruleset_hash VARCHAR(64) NOT NULL,
  
  -- Engine version for reproducibility
  engine_version VARCHAR(64) NOT NULL DEFAULT '1.0.0',
  
  -- Record counts
  input_record_count INTEGER NOT NULL DEFAULT 0,
  
  -- Status tracking
  status VARCHAR(32) NOT NULL DEFAULT 'QUEUED',
  status_transitions JSONB DEFAULT '[]',
  
  -- Timestamps
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Additional metadata
  metadata JSONB DEFAULT '{}'
);

-- Indexes for run_snapshots
CREATE INDEX IF NOT EXISTS idx_run_snapshots_tenant_id ON run_snapshots(tenant_id);
CREATE INDEX IF NOT EXISTS idx_run_snapshots_recon_job_id ON run_snapshots(recon_job_id);
CREATE INDEX IF NOT EXISTS idx_run_snapshots_run_fingerprint ON run_snapshots(run_fingerprint);
CREATE INDEX IF NOT EXISTS idx_run_snapshots_input_fingerprint ON run_snapshots(input_fingerprint);
CREATE INDEX IF NOT EXISTS idx_run_snapshots_status ON run_snapshots(status);
CREATE INDEX IF NOT EXISTS idx_run_snapshots_created_at ON run_snapshots(created_at DESC);

-- Unique constraint on run_fingerprint per tenant
CREATE UNIQUE INDEX IF NOT EXISTS idx_run_snapshots_tenant_fingerprint 
  ON run_snapshots(tenant_id, run_fingerprint);

-- ============================================================================
-- EXECUTION PROVENANCE TABLE
-- Evidence chain for every result
-- ============================================================================

CREATE TABLE IF NOT EXISTS execution_provenance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_result_id UUID NOT NULL,
  snapshot_id UUID NOT NULL,
  
  -- Sequence for ordering
  sequence INTEGER NOT NULL,
  
  -- Operation details
  operation VARCHAR(64) NOT NULL,
  entity_type VARCHAR(64) NOT NULL,
  entity_id UUID NOT NULL,
  
  -- Rule information
  rule_id UUID,
  rule_version INTEGER,
  
  -- Confidence and scoring
  confidence DECIMAL(5, 4),
  scoring_breakdown JSONB DEFAULT '{}',
  
  -- Actor information
  actor VARCHAR(32) NOT NULL DEFAULT 'system',
  actor_user_id UUID,
  
  -- Evidence pointers
  left_record_fingerprint VARCHAR(64),
  right_record_fingerprint VARCHAR(64),
  evidence_pointers JSONB DEFAULT '{}',
  
  -- Match rationale
  match_rationale JSONB DEFAULT '{}',
  
  -- Entry hash for integrity
  entry_hash VARCHAR(64) NOT NULL,
  
  -- Timestamp
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique constraint on run_result_id + sequence
  UNIQUE(run_result_id, sequence)
);

-- Indexes for execution_provenance
CREATE INDEX IF NOT EXISTS idx_execution_provenance_run_result_id ON execution_provenance(run_result_id);
CREATE INDEX IF NOT EXISTS idx_execution_provenance_snapshot_id ON execution_provenance(snapshot_id);
CREATE INDEX IF NOT EXISTS idx_execution_provenance_operation ON execution_provenance(operation);
CREATE INDEX IF NOT EXISTS idx_execution_provenance_entity_id ON execution_provenance(entity_id);
CREATE INDEX IF NOT EXISTS idx_execution_provenance_timestamp ON execution_provenance(timestamp);
CREATE INDEX IF NOT EXISTS idx_execution_provenance_rule_id ON execution_provenance(rule_id);

-- ============================================================================
-- DETERMINISTIC MATCH RESULTS TABLE
-- Stable IDs and evidence chain for matches
-- ============================================================================

CREATE TABLE IF NOT EXISTS deterministic_match_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  snapshot_id UUID NOT NULL,
  run_result_id UUID,
  
  -- Stable match ID (hash-based)
  stable_match_id VARCHAR(64) NOT NULL,
  
  -- Record references
  left_record_id UUID NOT NULL,
  left_record_fingerprint VARCHAR(64) NOT NULL,
  left_record_source VARCHAR(255) NOT NULL,
  
  right_record_id UUID NOT NULL,
  right_record_fingerprint VARCHAR(64) NOT NULL,
  right_record_source VARCHAR(255) NOT NULL,
  
  -- Rule information
  rule_id UUID,
  rule_version INTEGER NOT NULL DEFAULT 1,
  
  -- Confidence scoring
  confidence_score DECIMAL(5, 4) NOT NULL,
  scoring_breakdown JSONB DEFAULT '{}',
  
  -- Match rationale (structured)
  match_rationale JSONB DEFAULT '{}',
  
  -- Evidence pointers
  evidence_pointers JSONB DEFAULT '{}',
  
  -- Actor
  actor VARCHAR(32) NOT NULL DEFAULT 'system',
  
  -- Timestamps
  matched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique constraint on stable_match_id
  UNIQUE(stable_match_id)
);

-- Indexes for deterministic_match_results
CREATE INDEX IF NOT EXISTS idx_deterministic_match_tenant_id ON deterministic_match_results(tenant_id);
CREATE INDEX IF NOT EXISTS idx_deterministic_match_snapshot_id ON deterministic_match_results(snapshot_id);
CREATE INDEX IF NOT EXISTS idx_deterministic_match_run_result_id ON deterministic_match_results(run_result_id);
CREATE INDEX IF NOT EXISTS idx_deterministic_match_stable_id ON deterministic_match_results(stable_match_id);
CREATE INDEX IF NOT EXISTS idx_deterministic_match_left_record ON deterministic_match_results(left_record_id);
CREATE INDEX IF NOT EXISTS idx_deterministic_match_right_record ON deterministic_match_results(right_record_id);
CREATE INDEX IF NOT EXISTS idx_deterministic_match_confidence ON deterministic_match_results(confidence_score);

-- ============================================================================
-- INGESTION IDEMPOTENCY TABLE
-- Exactly-once ingestion guarantees
-- ============================================================================

CREATE TABLE IF NOT EXISTS ingestion_idempotency (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  
  -- Idempotency key (provided by client or generated)
  idempotency_key VARCHAR(255) NOT NULL,
  
  -- Source identification
  source_id UUID NOT NULL,
  source_type VARCHAR(64) NOT NULL,
  
  -- Payload fingerprint
  payload_fingerprint VARCHAR(64) NOT NULL,
  
  -- First seen tracking
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Run reference
  run_id UUID,
  
  -- Result reference (if processed)
  ingestion_id UUID,
  
  -- Status
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Unique constraint on tenant + source + idempotency_key
  UNIQUE(tenant_id, source_id, idempotency_key)
);

-- Indexes for ingestion_idempotency
CREATE INDEX IF NOT EXISTS idx_ingestion_idempotency_tenant_id ON ingestion_idempotency(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_idempotency_source_id ON ingestion_idempotency(source_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_idempotency_payload_fingerprint ON ingestion_idempotency(payload_fingerprint);
CREATE INDEX IF NOT EXISTS idx_ingestion_idempotency_first_seen ON ingestion_idempotency(first_seen_at DESC);

-- ============================================================================
-- RUN EXECUTION LOG TABLE
-- Detailed execution log for debugging and replay
-- ============================================================================

CREATE TABLE IF NOT EXISTS run_execution_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  snapshot_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  -- Sequence number
  sequence INTEGER NOT NULL,
  
  -- Log entry
  log_level VARCHAR(16) NOT NULL DEFAULT 'INFO',
  operation VARCHAR(64) NOT NULL,
  message TEXT,
  
  -- Context
  context JSONB DEFAULT '{}',
  
  -- Duration tracking
  duration_ms BIGINT,
  
  -- Error information
  error_type VARCHAR(128),
  error_message TEXT,
  error_stack TEXT,
  
  -- Timestamp
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique constraint on snapshot_id + sequence
  UNIQUE(snapshot_id, sequence)
);

-- Indexes for run_execution_log
CREATE INDEX IF NOT EXISTS idx_run_execution_log_snapshot_id ON run_execution_log(snapshot_id);
CREATE INDEX IF NOT EXISTS idx_run_execution_log_tenant_id ON run_execution_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_run_execution_log_timestamp ON run_execution_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_run_execution_log_operation ON run_execution_log(operation);

-- ============================================================================
-- ADD COLUMNS TO EXISTING TABLES
-- ============================================================================

-- Add snapshot_id to recon_results if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recon_results' AND column_name = 'snapshot_id'
  ) THEN
    ALTER TABLE recon_results ADD COLUMN snapshot_id UUID;
    CREATE INDEX IF NOT EXISTS idx_recon_results_snapshot_id ON recon_results(snapshot_id);
  END IF;
END $$;

-- Add input_hash to recon_results if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recon_results' AND column_name = 'input_hash'
  ) THEN
    ALTER TABLE recon_results ADD COLUMN input_hash VARCHAR(64);
    CREATE INDEX IF NOT EXISTS idx_recon_results_input_hash ON recon_results(input_hash);
  END IF;
END $$;

-- Add idempotency_key unique constraint to ingestions if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'idx_ingestions_tenant_idempotency_key'
  ) THEN
    CREATE UNIQUE INDEX idx_ingestions_tenant_idempotency_key 
      ON ingestions(tenant_id, idempotency_key) 
      WHERE idempotency_key IS NOT NULL;
  END IF;
END $$;

-- Add unique constraint for normalized transactions (org_id + source + external_id + effective_date)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'idx_normalized_transactions_unique'
  ) THEN
    CREATE UNIQUE INDEX idx_normalized_transactions_unique 
      ON normalized_transactions(tenant_id, source_id, external_id, DATE(date))
      WHERE external_id IS NOT NULL;
  END IF;
END $$;

-- ============================================================================
-- FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Add foreign key from run_snapshots to recon_jobs
ALTER TABLE run_snapshots 
  ADD CONSTRAINT fk_run_snapshots_recon_job 
  FOREIGN KEY (recon_job_id) REFERENCES recon_jobs(id) ON DELETE CASCADE;

-- Add foreign key from execution_provenance to run_snapshots
ALTER TABLE execution_provenance 
  ADD CONSTRAINT fk_execution_provenance_snapshot 
  FOREIGN KEY (snapshot_id) REFERENCES run_snapshots(id) ON DELETE CASCADE;

-- Add foreign key from deterministic_match_results to run_snapshots
ALTER TABLE deterministic_match_results 
  ADD CONSTRAINT fk_deterministic_match_snapshot 
  FOREIGN KEY (snapshot_id) REFERENCES run_snapshots(id) ON DELETE CASCADE;

-- Add foreign key from run_execution_log to run_snapshots
ALTER TABLE run_execution_log 
  ADD CONSTRAINT fk_run_execution_log_snapshot 
  FOREIGN KEY (snapshot_id) REFERENCES run_snapshots(id) ON DELETE CASCADE;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE run_snapshots IS 'Immutable snapshot of run state before processing begins. Enables replayability and determinism verification.';
COMMENT ON TABLE execution_provenance IS 'Evidence chain for every result. Provides complete audit trail of how each result was derived.';
COMMENT ON TABLE deterministic_match_results IS 'Match results with stable IDs and complete evidence chain.';
COMMENT ON TABLE ingestion_idempotency IS 'Exactly-once ingestion guarantees. Tracks payload fingerprints and first-seen timestamps.';
COMMENT ON TABLE run_execution_log IS 'Detailed execution log for debugging and replay.';
