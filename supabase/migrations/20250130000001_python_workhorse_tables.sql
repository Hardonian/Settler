-- Migration: Python Workhorse Job Queue Tables
-- Created: 2025-01-30
-- Description: Job queue tables for Python batch processing subsystem

BEGIN;

-- ============================================================================
-- 1. PYTHON JOBS TABLE (Job Queue)
-- ============================================================================

CREATE TABLE IF NOT EXISTS python_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,

    -- Job definition
    job_type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}',
    priority INTEGER NOT NULL DEFAULT 100,
    idempotency_key VARCHAR(255),

    -- Execution state
    status VARCHAR(20) NOT NULL DEFAULT 'queued',
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,

    -- Timing
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    available_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- Concurrency control
    locked_at TIMESTAMPTZ,
    locked_by VARCHAR(255),

    -- Error tracking
    last_error JSONB,
    error_message TEXT,

    -- Results
    result JSONB,
    output_location TEXT,
    records_processed INTEGER,
    records_failed INTEGER,

    -- Constraints
    CONSTRAINT valid_status CHECK (status IN ('queued', 'running', 'succeeded', 'failed', 'dead', 'cancelled')),
    CONSTRAINT valid_job_type CHECK (job_type IN (
        'csv_ingestion', 'json_ingestion', 'pdf_report', 'excel_export',
        'reconciliation_batch', 'anomaly_detection', 'daily_report',
        'data_quality_check', 'custom'
    )),
    CONSTRAINT positive_priority CHECK (priority > 0),
    CONSTRAINT non_negative_attempts CHECK (attempts >= 0),
    CONSTRAINT positive_max_attempts CHECK (max_attempts > 0),

    -- Idempotency constraint
    UNIQUE(idempotency_key)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_python_jobs_tenant_id ON python_jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_python_jobs_workspace_id ON python_jobs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_python_jobs_status ON python_jobs(status);
CREATE INDEX IF NOT EXISTS idx_python_jobs_job_type ON python_jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_python_jobs_priority_created ON python_jobs(priority ASC, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_python_jobs_available ON python_jobs(status, available_at) WHERE status = 'queued';
CREATE INDEX IF NOT EXISTS idx_python_jobs_locked ON python_jobs(locked_at, locked_by) WHERE status = 'running';

-- Partial index for idempotency lookups (only non-null keys)
CREATE UNIQUE INDEX IF NOT EXISTS idx_python_jobs_idempotency 
    ON python_jobs(idempotency_key) 
    WHERE idempotency_key IS NOT NULL;

-- ============================================================================
-- 2. PYTHON JOB ATTEMPTS TABLE (Execution History)
-- ============================================================================

CREATE TABLE IF NOT EXISTS python_job_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES python_jobs(id) ON DELETE CASCADE,
    attempt_no INTEGER NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    ok BOOLEAN,
    error JSONB,
    worker_id VARCHAR(255),
    correlation_id VARCHAR(255),

    CONSTRAINT positive_attempt_no CHECK (attempt_no > 0),
    UNIQUE(job_id, attempt_no)
);

CREATE INDEX IF NOT EXISTS idx_python_job_attempts_job_id ON python_job_attempts(job_id);
CREATE INDEX IF NOT EXISTS idx_python_job_attempts_worker ON python_job_attempts(worker_id);
CREATE INDEX IF NOT EXISTS idx_python_job_attempts_correlation ON python_job_attempts(correlation_id);

-- ============================================================================
-- 3. PYTHON DEAD LETTERS TABLE (Failed Job Archive)
-- ============================================================================

CREATE TABLE IF NOT EXISTS python_dead_letters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES python_jobs(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    workspace_id UUID,
    job_type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    error JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID,
    resolution VARCHAR(50),
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_python_dead_letters_tenant ON python_dead_letters(tenant_id);
CREATE INDEX IF NOT EXISTS idx_python_dead_letters_job_type ON python_dead_letters(job_type);
CREATE INDEX IF NOT EXISTS idx_python_dead_letters_created ON python_dead_letters(created_at);

-- ============================================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE python_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE python_job_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE python_dead_letters ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policies
CREATE POLICY tenant_isolation_python_jobs ON python_jobs
    FOR ALL USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation_python_job_attempts ON python_job_attempts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM python_jobs j
            WHERE j.id = python_job_attempts.job_id
            AND j.tenant_id = current_tenant_id()
        )
    );

CREATE POLICY tenant_isolation_python_dead_letters ON python_dead_letters
    FOR ALL USING (tenant_id = current_tenant_id());

-- ============================================================================
-- 5. TRIGGERS
-- ============================================================================

-- Update timestamp on modification
CREATE OR REPLACE FUNCTION update_python_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_python_jobs_updated_at ON python_jobs;
CREATE TRIGGER tr_python_jobs_updated_at
    BEFORE UPDATE ON python_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_python_jobs_updated_at();

-- ============================================================================
-- 6. FUNCTIONS
-- ============================================================================

-- Function to get job statistics for a tenant
CREATE OR REPLACE FUNCTION get_python_job_stats(p_tenant_id UUID)
RETURNS TABLE (
    status VARCHAR(20),
    count BIGINT
) AS $$
BEGIN
    PERFORM set_config('app.current_tenant_id', p_tenant_id::text, true);
    
    RETURN QUERY
    SELECT 
        pj.status,
        COUNT(*)::BIGINT
    FROM python_jobs pj
    WHERE pj.tenant_id = p_tenant_id
    GROUP BY pj.status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to enqueue a job (with idempotency)
CREATE OR REPLACE FUNCTION enqueue_python_job(
    p_tenant_id UUID,
    p_workspace_id UUID,
    p_job_type VARCHAR(50),
    p_payload JSONB,
    p_priority INTEGER DEFAULT 100,
    p_idempotency_key VARCHAR(255) DEFAULT NULL,
    p_max_attempts INTEGER DEFAULT 3,
    p_delay_seconds INTEGER DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
    v_job_id UUID;
    v_available_at TIMESTAMPTZ;
BEGIN
    PERFORM set_config('app.current_tenant_id', p_tenant_id::text, true);
    
    v_available_at := NOW() + (p_delay_seconds || ' seconds')::INTERVAL;
    
    INSERT INTO python_jobs (
        tenant_id, workspace_id, job_type, payload,
        priority, idempotency_key, max_attempts,
        available_at, status, attempts, created_at
    ) VALUES (
        p_tenant_id, p_workspace_id, p_job_type, p_payload,
        p_priority, p_idempotency_key, p_max_attempts,
        v_available_at, 'queued', 0, NOW()
    )
    ON CONFLICT (idempotency_key) WHERE idempotency_key IS NOT NULL
    DO UPDATE SET
        updated_at = NOW()
    RETURNING id INTO v_job_id;
    
    RETURN v_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to release stale locks (for cron job)
CREATE OR REPLACE FUNCTION release_stale_python_locks(p_lock_timeout_seconds INTEGER)
RETURNS INTEGER AS $$
DECLARE
    v_released INTEGER;
BEGIN
    UPDATE python_jobs
    SET status = 'queued',
        locked_at = NULL,
        locked_by = NULL,
        available_at = GREATEST(available_at, NOW()),
        updated_at = NOW()
    WHERE status = 'running'
        AND locked_at < (NOW() - (p_lock_timeout_seconds || ' seconds')::INTERVAL);
    
    GET DIAGNOSTICS v_released = ROW_COUNT;
    RETURN v_released;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. COMMENTS
-- ============================================================================

COMMENT ON TABLE python_jobs IS 'Job queue for Python workhorse batch processing';
COMMENT ON TABLE python_job_attempts IS 'Execution history for Python jobs';
COMMENT ON TABLE python_dead_letters IS 'Archive of failed Python jobs for review';

COMMENT ON COLUMN python_jobs.idempotency_key IS 'Optional key for idempotent job enqueueing';
COMMENT ON COLUMN python_jobs.priority IS 'Lower values = higher priority (1=Critical, 100=Normal)';
COMMENT ON COLUMN python_jobs.locked_by IS 'Worker instance ID holding the lock';

COMMIT;
