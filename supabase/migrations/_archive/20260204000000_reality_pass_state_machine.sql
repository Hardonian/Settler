-- Reality Pass: State Machine + Job Queue Schema
-- Creates enhanced recon_runs with state machine, run_events, and job queue tables

-- ============================================================================
-- PART 1: Enhanced Reconciliation Runs with State Machine
-- ============================================================================

-- Drop and recreate recon_runs with state machine status
DROP TABLE IF EXISTS reconciliation_runs CASCADE;

CREATE TABLE recon_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL, -- Maps to tenant_id (workspace = tenant in this system)
  created_by UUID NOT NULL,
  
  -- State machine status (deterministic transitions)
  status TEXT NOT NULL DEFAULT 'created' CHECK (
    status IN (
      'created',
      'queued',
      'ingesting',
      'validating',
      'reconciling',
      'completed',
      'failed',
      'cancelled'
    )
  ),
  
  -- Idempotency
  idempotency_key TEXT,
  
  -- Input/output manifests
  input_manifest JSONB DEFAULT '{}',
  result_summary JSONB DEFAULT '{}',
  
  -- Error tracking (structured)
  error JSONB,
  
  -- Timestamps
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Legacy fields for backward compatibility
  ingestion_id UUID,
  name TEXT,
  source_count INTEGER DEFAULT 0,
  target_count INTEGER DEFAULT 0,
  matched_count INTEGER DEFAULT 0,
  unmatched_source_count INTEGER DEFAULT 0,
  unmatched_target_count INTEGER DEFAULT 0,
  confidence_avg DECIMAL(5, 4),
  error_message TEXT,
  trace_id TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Unique constraint for idempotency
  CONSTRAINT recon_runs_idempotency_unique UNIQUE (workspace_id, idempotency_key) 
    WHERE idempotency_key IS NOT NULL
);

CREATE INDEX idx_recon_runs_workspace_id ON recon_runs(workspace_id);
CREATE INDEX idx_recon_runs_status ON recon_runs(status);
CREATE INDEX idx_recon_runs_idempotency_key ON recon_runs(idempotency_key);
CREATE INDEX idx_recon_runs_created_by ON recon_runs(created_by);
CREATE INDEX idx_recon_runs_started_at ON recon_runs(started_at DESC);
CREATE INDEX idx_recon_runs_created_at ON recon_runs(created_at DESC);

-- ============================================================================
-- PART 2: Run Events (Audit Trail)
-- ============================================================================

CREATE TABLE run_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  run_id UUID NOT NULL REFERENCES recon_runs(id) ON DELETE CASCADE,
  
  -- Event type
  type TEXT NOT NULL CHECK (
    type IN (
      'state_change',
      'ingest_progress',
      'validation_error',
      'reconciliation_progress',
      'completion',
      'failure',
      'cancellation',
      'retry',
      'user_action'
    )
  ),
  
  -- Event payload
  payload JSONB DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);

CREATE INDEX idx_run_events_workspace_id ON run_events(workspace_id);
CREATE INDEX idx_run_events_run_id ON run_events(run_id);
CREATE INDEX idx_run_events_type ON run_events(type);
CREATE INDEX idx_run_events_created_at ON run_events(workspace_id, run_id, created_at DESC);

-- ============================================================================
-- PART 3: Job Queue System
-- ============================================================================

CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  
  -- Job type
  type TEXT NOT NULL, -- e.g. 'run.process', 'ingest.process', 'export.generate'
  
  -- Job payload
  payload JSONB NOT NULL DEFAULT '{}',
  
  -- Status
  status TEXT NOT NULL DEFAULT 'queued' CHECK (
    status IN ('queued', 'running', 'succeeded', 'failed', 'dead')
  ),
  
  -- Idempotency
  idempotency_key TEXT,
  
  -- Related run (if applicable)
  run_id UUID REFERENCES recon_runs(id) ON DELETE SET NULL,
  
  -- Scheduling/backoff
  available_at TIMESTAMPTZ DEFAULT NOW(),
  locked_at TIMESTAMPTZ,
  locked_by TEXT, -- Worker identifier
  
  -- Retry tracking
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 8,
  
  -- Error tracking
  last_error JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint for idempotency
  CONSTRAINT jobs_idempotency_unique UNIQUE (workspace_id, type, idempotency_key)
    WHERE idempotency_key IS NOT NULL
);

CREATE INDEX idx_jobs_workspace_id ON jobs(workspace_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_type ON jobs(type);
CREATE INDEX idx_jobs_available_at ON jobs(available_at) WHERE status = 'queued';
CREATE INDEX idx_jobs_run_id ON jobs(run_id);
CREATE INDEX idx_jobs_idempotency_key ON jobs(idempotency_key);

-- Job Attempts (History)
CREATE TABLE job_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  attempt_no INTEGER NOT NULL,
  
  started_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  ok BOOLEAN,
  error JSONB,
  
  CONSTRAINT job_attempts_unique UNIQUE (job_id, attempt_no)
);

CREATE INDEX idx_job_attempts_job_id ON job_attempts(job_id);
CREATE INDEX idx_job_attempts_attempt_no ON job_attempts(job_id, attempt_no);

-- Dead Letter Queue
CREATE TABLE dead_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  workspace_id UUID NOT NULL,
  type TEXT NOT NULL,
  payload JSONB NOT NULL,
  error JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dead_letters_workspace_id ON dead_letters(workspace_id);
CREATE INDEX idx_dead_letters_type ON dead_letters(type);
CREATE INDEX idx_dead_letters_created_at ON dead_letters(created_at DESC);

-- ============================================================================
-- PART 4: RLS Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE recon_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE run_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE dead_letters ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's workspace/tenant memberships
CREATE OR REPLACE FUNCTION get_user_workspace_ids()
RETURNS UUID[] AS $$
  SELECT COALESCE(ARRAY_AGG(tenant_id)::UUID[], ARRAY[]::UUID[])
  FROM tenant_users
  WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Recon Runs RLS
CREATE POLICY recon_runs_select ON recon_runs
  FOR SELECT
  USING (
    workspace_id IN (SELECT UNNEST(get_user_workspace_ids()))
  );

CREATE POLICY recon_runs_insert ON recon_runs
  FOR INSERT
  WITH CHECK (
    workspace_id IN (SELECT UNNEST(get_user_workspace_ids()))
  );

CREATE POLICY recon_runs_update ON recon_runs
  FOR UPDATE
  USING (
    workspace_id IN (SELECT UNNEST(get_user_workspace_ids()))
  )
  WITH CHECK (
    workspace_id IN (SELECT UNNEST(get_user_workspace_ids()))
  );

-- Only owners/admins can cancel (handled in application logic, RLS allows update)

-- Run Events RLS
CREATE POLICY run_events_select ON run_events
  FOR SELECT
  USING (
    workspace_id IN (SELECT UNNEST(get_user_workspace_ids()))
  );

CREATE POLICY run_events_insert ON run_events
  FOR INSERT
  WITH CHECK (
    workspace_id IN (SELECT UNNEST(get_user_workspace_ids()))
  );

-- Jobs RLS
CREATE POLICY jobs_select ON jobs
  FOR SELECT
  USING (
    workspace_id IN (SELECT UNNEST(get_user_workspace_ids()))
  );

CREATE POLICY jobs_insert ON jobs
  FOR INSERT
  WITH CHECK (
    workspace_id IN (SELECT UNNEST(get_user_workspace_ids()))
  );

CREATE POLICY jobs_update ON jobs
  FOR UPDATE
  USING (
    workspace_id IN (SELECT UNNEST(get_user_workspace_ids()))
  );

-- Job Attempts RLS (via job_id)
CREATE POLICY job_attempts_select ON job_attempts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = job_attempts.job_id
        AND jobs.workspace_id IN (SELECT UNNEST(get_user_workspace_ids()))
    )
  );

-- Dead Letters RLS
-- Dead letters: only owners/admins (handled in application logic)
CREATE POLICY dead_letters_select ON dead_letters
  FOR SELECT
  USING (
    workspace_id IN (SELECT UNNEST(get_user_workspace_ids()))
  );

-- ============================================================================
-- PART 5: Functions & Triggers
-- ============================================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recon_runs_updated_at
  BEFORE UPDATE ON recon_runs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Auto-create state change event
CREATE OR REPLACE FUNCTION create_state_change_event()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO run_events (workspace_id, run_id, type, payload, created_by)
    VALUES (
      NEW.workspace_id,
      NEW.id,
      'state_change',
      jsonb_build_object(
        'from', OLD.status,
        'to', NEW.status,
        'timestamp', NOW()
      ),
      NEW.created_by
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER recon_runs_state_change_event
  AFTER UPDATE ON recon_runs
  FOR EACH ROW
  EXECUTE FUNCTION create_state_change_event();
