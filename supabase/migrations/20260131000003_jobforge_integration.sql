-- JobForge Core Schema
-- Multi-tenant job queue with RLS, RPC, and concurrency-safe operations
-- Version: 0.1.0

BEGIN;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE: jobforge_jobs
-- ============================================================================
CREATE TABLE jobforge_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'succeeded', 'failed', 'dead', 'canceled')),
  attempts INT NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  max_attempts INT NOT NULL DEFAULT 5 CHECK (max_attempts >= 1),
  run_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  locked_at TIMESTAMPTZ,
  locked_by TEXT,
  heartbeat_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  idempotency_key TEXT,
  created_by TEXT,
  error JSONB,
  result_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Idempotency constraint
  CONSTRAINT jobforge_jobs_idempotency_unique
    UNIQUE (tenant_id, type, idempotency_key)
    DEFERRABLE INITIALLY DEFERRED
);

-- Partial unique index for idempotency (where idempotency_key is not null)
CREATE UNIQUE INDEX idx_jobforge_jobs_idempotency
  ON jobforge_jobs (tenant_id, type, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- Index for efficient job claiming
CREATE INDEX idx_jobforge_jobs_claim
  ON jobforge_jobs (tenant_id, status, run_at)
  WHERE status = 'queued';

-- Index for locked jobs
CREATE INDEX idx_jobforge_jobs_locked
  ON jobforge_jobs (locked_at, locked_by)
  WHERE locked_at IS NOT NULL;

-- Index for job type filtering
CREATE INDEX idx_jobforge_jobs_type
  ON jobforge_jobs (tenant_id, type);

-- Index for status filtering
CREATE INDEX idx_jobforge_jobs_status
  ON jobforge_jobs (tenant_id, status, created_at DESC);

-- ============================================================================
-- TABLE: jobforge_job_results
-- ============================================================================
CREATE TABLE jobforge_job_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobforge_jobs(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  result JSONB NOT NULL DEFAULT '{}'::jsonb,
  artifact_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_jobforge_job_results_job_id
  ON jobforge_job_results (job_id);

CREATE INDEX idx_jobforge_job_results_tenant
  ON jobforge_job_results (tenant_id, created_at DESC);

-- ============================================================================
-- TABLE: jobforge_job_attempts
-- ============================================================================
CREATE TABLE jobforge_job_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobforge_jobs(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  attempt_no INT NOT NULL CHECK (attempt_no >= 1),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  error JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_jobforge_job_attempts_job_id
  ON jobforge_job_attempts (job_id, attempt_no);

CREATE INDEX idx_jobforge_job_attempts_tenant
  ON jobforge_job_attempts (tenant_id, created_at DESC);

-- ============================================================================
-- TABLE: jobforge_connector_configs
-- ============================================================================
CREATE TABLE jobforge_connector_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  connector_type TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT jobforge_connector_configs_unique
    UNIQUE (tenant_id, connector_type)
);

CREATE INDEX idx_jobforge_connector_configs_tenant
  ON jobforge_connector_configs (tenant_id);

-- ============================================================================
-- TRIGGER: Update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION jobforge_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER jobforge_jobs_update_updated_at
  BEFORE UPDATE ON jobforge_jobs
  FOR EACH ROW
  EXECUTE FUNCTION jobforge_update_updated_at();

CREATE TRIGGER jobforge_connector_configs_update_updated_at
  BEFORE UPDATE ON jobforge_connector_configs
  FOR EACH ROW
  EXECUTE FUNCTION jobforge_update_updated_at();

-- ============================================================================
-- RPC: jobforge_enqueue_job
-- Enqueue a new job with idempotency support
-- ============================================================================
CREATE OR REPLACE FUNCTION jobforge_enqueue_job(
  p_tenant_id UUID,
  p_type TEXT,
  p_payload JSONB,
  p_idempotency_key TEXT DEFAULT NULL,
  p_run_at TIMESTAMPTZ DEFAULT NOW(),
  p_max_attempts INT DEFAULT 5
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_job_row jobforge_jobs%ROWTYPE;
BEGIN
  -- Validate inputs
  IF p_tenant_id IS NULL OR p_type IS NULL OR p_type = '' THEN
    RAISE EXCEPTION 'tenant_id and type are required';
  END IF;

  -- Upsert with idempotency
  INSERT INTO jobforge_jobs (
    tenant_id,
    type,
    payload,
    idempotency_key,
    run_at,
    max_attempts,
    status
  )
  VALUES (
    p_tenant_id,
    p_type,
    p_payload,
    p_idempotency_key,
    p_run_at,
    p_max_attempts,
    'queued'
  )
  ON CONFLICT (tenant_id, type, idempotency_key)
  WHERE idempotency_key IS NOT NULL
  DO UPDATE SET
    updated_at = NOW()
  RETURNING * INTO v_job_row;

  -- Return job as JSONB
  RETURN row_to_json(v_job_row)::jsonb;
END;
$$;

-- ============================================================================
-- RPC: jobforge_claim_jobs
-- Claim jobs for processing with FOR UPDATE SKIP LOCKED
-- ============================================================================
CREATE OR REPLACE FUNCTION jobforge_claim_jobs(
  p_worker_id TEXT,
  p_limit INT DEFAULT 10
)
RETURNS SETOF jobforge_jobs
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  UPDATE jobforge_jobs
  SET
    status = 'running',
    locked_by = p_worker_id,
    locked_at = NOW(),
    heartbeat_at = NOW(),
    started_at = COALESCE(started_at, NOW()),
    attempts = attempts + 1,
    updated_at = NOW()
  WHERE id IN (
    SELECT id
    FROM jobforge_jobs
    WHERE status = 'queued'
      AND run_at <= NOW()
    ORDER BY run_at ASC
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  )
  RETURNING *;
END;
$$;

-- ============================================================================
-- RPC: jobforge_heartbeat_job
-- Update heartbeat timestamp for a running job
-- ============================================================================
CREATE OR REPLACE FUNCTION jobforge_heartbeat_job(
  p_job_id UUID,
  p_worker_id TEXT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE jobforge_jobs
  SET heartbeat_at = NOW(),
      updated_at = NOW()
  WHERE id = p_job_id
    AND locked_by = p_worker_id
    AND status = 'running';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job not found or not locked by worker';
  END IF;
END;
$$;

-- ============================================================================
-- RPC: jobforge_complete_job
-- Complete a job with success or failure, handle retries and dead-letter
-- ============================================================================
CREATE OR REPLACE FUNCTION jobforge_complete_job(
  p_job_id UUID,
  p_worker_id TEXT,
  p_status TEXT,
  p_error JSONB DEFAULT NULL,
  p_result JSONB DEFAULT NULL,
  p_artifact_ref TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_job jobforge_jobs%ROWTYPE;
  v_result_id UUID;
  v_backoff_seconds INT;
BEGIN
  -- Validate status
  IF p_status NOT IN ('succeeded', 'failed') THEN
    RAISE EXCEPTION 'Status must be succeeded or failed';
  END IF;

  -- Get current job
  SELECT * INTO v_job
  FROM jobforge_jobs
  WHERE id = p_job_id
    AND locked_by = p_worker_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job not found or not locked by worker';
  END IF;

  -- Record attempt
  INSERT INTO jobforge_job_attempts (
    job_id,
    tenant_id,
    attempt_no,
    started_at,
    finished_at,
    error
  )
  VALUES (
    v_job.id,
    v_job.tenant_id,
    v_job.attempts,
    v_job.started_at,
    NOW(),
    p_error
  );

  -- Handle success
  IF p_status = 'succeeded' THEN
    -- Store result if provided
    IF p_result IS NOT NULL THEN
      INSERT INTO jobforge_job_results (
        job_id,
        tenant_id,
        result,
        artifact_ref
      )
      VALUES (
        v_job.id,
        v_job.tenant_id,
        p_result,
        p_artifact_ref
      )
      RETURNING id INTO v_result_id;
    END IF;

    UPDATE jobforge_jobs
    SET
      status = 'succeeded',
      finished_at = NOW(),
      result_id = v_result_id,
      locked_by = NULL,
      locked_at = NULL,
      updated_at = NOW()
    WHERE id = p_job_id;

  -- Handle failure
  ELSIF p_status = 'failed' THEN
    -- Check if we should retry
    IF v_job.attempts < v_job.max_attempts THEN
      -- Calculate exponential backoff: 2^(attempts-1) seconds, capped at 3600
      v_backoff_seconds := LEAST(POWER(2, v_job.attempts - 1)::INT, 3600);

      UPDATE jobforge_jobs
      SET
        status = 'queued',
        run_at = NOW() + (v_backoff_seconds || ' seconds')::INTERVAL,
        error = p_error,
        locked_by = NULL,
        locked_at = NULL,
        heartbeat_at = NULL,
        updated_at = NOW()
      WHERE id = p_job_id;

    ELSE
      -- Max attempts reached, move to dead letter
      UPDATE jobforge_jobs
      SET
        status = 'dead',
        finished_at = NOW(),
        error = p_error,
        locked_by = NULL,
        locked_at = NULL,
        updated_at = NOW()
      WHERE id = p_job_id;
    END IF;
  END IF;
END;
$$;

-- ============================================================================
-- RPC: jobforge_cancel_job
-- Cancel a queued job
-- ============================================================================
CREATE OR REPLACE FUNCTION jobforge_cancel_job(
  p_job_id UUID,
  p_tenant_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE jobforge_jobs
  SET
    status = 'canceled',
    finished_at = NOW(),
    updated_at = NOW()
  WHERE id = p_job_id
    AND tenant_id = p_tenant_id
    AND status IN ('queued', 'running');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job not found or cannot be canceled';
  END IF;
END;
$$;

-- ============================================================================
-- RPC: jobforge_reschedule_job
-- Reschedule a queued or failed job
-- ============================================================================
CREATE OR REPLACE FUNCTION jobforge_reschedule_job(
  p_job_id UUID,
  p_tenant_id UUID,
  p_run_at TIMESTAMPTZ
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE jobforge_jobs
  SET
    run_at = p_run_at,
    status = 'queued',
    updated_at = NOW()
  WHERE id = p_job_id
    AND tenant_id = p_tenant_id
    AND status IN ('queued', 'failed', 'dead');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job not found or cannot be rescheduled';
  END IF;
END;
$$;

-- ============================================================================
-- RPC: jobforge_list_jobs
-- List jobs with filtering and pagination
-- ============================================================================
CREATE OR REPLACE FUNCTION jobforge_list_jobs(
  p_tenant_id UUID,
  p_filters JSONB DEFAULT '{}'::jsonb
)
RETURNS SETOF jobforge_jobs
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_status TEXT;
  v_type TEXT;
  v_limit INT;
  v_offset INT;
BEGIN
  -- Extract filters
  v_status := p_filters->>'status';
  v_type := p_filters->>'type';
  v_limit := COALESCE((p_filters->>'limit')::INT, 50);
  v_offset := COALESCE((p_filters->>'offset')::INT, 0);

  -- Validate limit
  v_limit := LEAST(v_limit, 1000);

  RETURN QUERY
  SELECT *
  FROM jobforge_jobs
  WHERE tenant_id = p_tenant_id
    AND (v_status IS NULL OR status = v_status)
    AND (v_type IS NULL OR type = v_type)
  ORDER BY created_at DESC
  LIMIT v_limit
  OFFSET v_offset;
END;
$$;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE jobforge_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobforge_job_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobforge_job_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobforge_connector_configs ENABLE ROW LEVEL SECURITY;

-- Policy: Tenants can SELECT their own jobs
CREATE POLICY jobforge_jobs_select_policy ON jobforge_jobs
  FOR SELECT
  USING (
    tenant_id::text = current_setting('app.tenant_id', true)
    OR current_setting('app.tenant_id', true) IS NULL
  );

-- Policy: Prevent direct UPDATE (mutations via RPC only)
CREATE POLICY jobforge_jobs_update_policy ON jobforge_jobs
  FOR UPDATE
  USING (false);

-- Policy: Prevent direct INSERT (use RPC)
CREATE POLICY jobforge_jobs_insert_policy ON jobforge_jobs
  FOR INSERT
  WITH CHECK (false);

-- Policy: Prevent direct DELETE
CREATE POLICY jobforge_jobs_delete_policy ON jobforge_jobs
  FOR DELETE
  USING (false);

-- Results policies
CREATE POLICY jobforge_job_results_select_policy ON jobforge_job_results
  FOR SELECT
  USING (
    tenant_id::text = current_setting('app.tenant_id', true)
    OR current_setting('app.tenant_id', true) IS NULL
  );

CREATE POLICY jobforge_job_results_write_policy ON jobforge_job_results
  FOR ALL
  USING (false);

-- Attempts policies
CREATE POLICY jobforge_job_attempts_select_policy ON jobforge_job_attempts
  FOR SELECT
  USING (
    tenant_id::text = current_setting('app.tenant_id', true)
    OR current_setting('app.tenant_id', true) IS NULL
  );

CREATE POLICY jobforge_job_attempts_write_policy ON jobforge_job_attempts
  FOR ALL
  USING (false);

-- Connector configs policies
CREATE POLICY jobforge_connector_configs_select_policy ON jobforge_connector_configs
  FOR SELECT
  USING (
    tenant_id::text = current_setting('app.tenant_id', true)
    OR current_setting('app.tenant_id', true) IS NULL
  );

CREATE POLICY jobforge_connector_configs_write_policy ON jobforge_connector_configs
  FOR ALL
  USING (false);

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant execute on RPC functions to authenticated users
GRANT EXECUTE ON FUNCTION jobforge_enqueue_job TO authenticated, anon;
GRANT EXECUTE ON FUNCTION jobforge_claim_jobs TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION jobforge_heartbeat_job TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION jobforge_complete_job TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION jobforge_cancel_job TO authenticated, anon;
GRANT EXECUTE ON FUNCTION jobforge_reschedule_job TO authenticated, anon;
GRANT EXECUTE ON FUNCTION jobforge_list_jobs TO authenticated, anon;

-- Grant SELECT on tables to authenticated users (RLS enforced)
GRANT SELECT ON jobforge_jobs TO authenticated, anon;
GRANT SELECT ON jobforge_job_results TO authenticated, anon;
GRANT SELECT ON jobforge_job_attempts TO authenticated, anon;
GRANT SELECT ON jobforge_connector_configs TO authenticated, anon;

COMMENT ON TABLE jobforge_jobs IS 'JobForge job queue with multi-tenant isolation';
COMMENT ON TABLE jobforge_job_results IS 'Job execution results storage';
COMMENT ON TABLE jobforge_job_attempts IS 'Job attempt history for debugging';
COMMENT ON TABLE jobforge_connector_configs IS 'Tenant-specific connector configurations';

COMMIT;
