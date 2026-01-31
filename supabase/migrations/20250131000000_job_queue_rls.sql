-- Migration: Job Queue Tables (RLS-safe design)
-- Created: 2025-01-31
-- Description: Generic job queue with tenant isolation, idempotency, and safe worker concurrency

BEGIN;

-- ============================================================================
-- 1. JOB STATUS ENUM
-- ============================================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_status') THEN
    CREATE TYPE public.job_status AS ENUM ('queued', 'running', 'succeeded', 'failed', 'dead', 'canceled');
  END IF;
END $$;

-- ============================================================================
-- 2. JOBS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Job definition
    type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}',
    
    -- Execution state
    status job_status NOT NULL DEFAULT 'queued',
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    
    -- Timing (using run_at for scheduling/backoff)
    run_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    locked_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    
    -- Concurrency control
    locked_by VARCHAR(255),
    
    -- Error tracking
    error JSONB,
    error_message TEXT,
    
    -- Results (reference to external storage rather than inline)
    result_ref VARCHAR(500),
    
    -- Idempotency
    idempotency_key VARCHAR(255),
    
    -- Audit
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT positive_attempts CHECK (attempts >= 0),
    CONSTRAINT positive_max_attempts CHECK (max_attempts > 0),
    CONSTRAINT attempts_not_exceed_max CHECK (attempts <= max_attempts),
    
    -- Idempotency: unique per tenant + type + key
    UNIQUE(tenant_id, type, idempotency_key)
);

-- ============================================================================
-- 3. JOB RESULTS TABLE (separate for size/performance)
-- ============================================================================

CREATE TABLE IF NOT EXISTS job_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Result storage (for larger payloads)
    result_data JSONB,
    result_url TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_job_result UNIQUE (job_id)
);

-- ============================================================================
-- 4. INDEXES FOR PERFORMANCE
-- ============================================================================

-- Primary query patterns
CREATE INDEX IF NOT EXISTS idx_jobs_tenant_id ON jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_type ON jobs(type);
CREATE INDEX IF NOT EXISTS idx_jobs_run_at ON jobs(run_at);

-- Claiming pattern (FOR UPDATE SKIP LOCKED)
CREATE INDEX IF NOT EXISTS idx_jobs_claimable 
    ON jobs(status, run_at, tenant_id) 
    WHERE status = 'queued' AND run_at <= NOW();

-- Running jobs lookup (for heartbeats)
CREATE INDEX IF NOT EXISTS idx_jobs_locked 
    ON jobs(locked_by, locked_at) 
    WHERE status = 'running';

-- Idempotency lookups
CREATE INDEX IF NOT EXISTS idx_jobs_idempotency 
    ON jobs(tenant_id, type, idempotency_key) 
    WHERE idempotency_key IS NOT NULL;

-- Tenant status overview
CREATE INDEX IF NOT EXISTS idx_jobs_tenant_status 
    ON jobs(tenant_id, status, created_at DESC);

-- Job results indexes
CREATE INDEX IF NOT EXISTS idx_job_results_tenant_id ON job_results(tenant_id);
CREATE INDEX IF NOT EXISTS idx_job_results_job_id ON job_results(job_id);

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_results ENABLE ROW LEVEL SECURITY;

-- Tenants can only see their own jobs
CREATE POLICY tenant_jobs_isolation ON jobs
    FOR ALL 
    USING (tenant_id = current_tenant_id());

-- Tenants can only see their own job results (via job_id relationship)
CREATE POLICY tenant_job_results_isolation ON job_results
    FOR ALL 
    USING (tenant_id = current_tenant_id());

-- ============================================================================
-- 6. RPC FUNCTIONS
-- ============================================================================

-- Function to enqueue a job (idempotent)
CREATE OR REPLACE FUNCTION enqueue_job(
    p_tenant_id UUID,
    p_type VARCHAR(100),
    p_payload JSONB DEFAULT '{}',
    p_idempotency_key VARCHAR(255) DEFAULT NULL,
    p_run_at TIMESTAMPTZ DEFAULT NOW(),
    p_max_attempts INTEGER DEFAULT 3,
    p_created_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_job_id UUID;
BEGIN
    -- Set tenant context for RLS
    PERFORM set_config('app.current_tenant_id', p_tenant_id::text, true);
    
    INSERT INTO jobs (
        tenant_id,
        type,
        payload,
        idempotency_key,
        run_at,
        max_attempts,
        status,
        attempts,
        created_by,
        created_at,
        updated_at
    ) VALUES (
        p_tenant_id,
        p_type,
        p_payload,
        p_idempotency_key,
        p_run_at,
        p_max_attempts,
        'queued',
        0,
        p_created_by,
        NOW(),
        NOW()
    )
    ON CONFLICT (tenant_id, type, idempotency_key) 
    WHERE idempotency_key IS NOT NULL
    DO UPDATE SET
        updated_at = NOW()
    RETURNING id INTO v_job_id;
    
    RETURN v_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to claim jobs for a worker (concurrency-safe)
CREATE OR REPLACE FUNCTION claim_jobs(
    p_worker_id VARCHAR(255),
    p_limit INTEGER DEFAULT 1,
    p_tenant_id UUID DEFAULT NULL  -- NULL = any tenant (worker context)
)
RETURNS TABLE (
    job_id UUID,
    tenant_id UUID,
    job_type VARCHAR(100),
    payload JSONB,
    attempts INTEGER,
    max_attempts INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH claimable_jobs AS (
        SELECT 
            j.id,
            j.tenant_id,
            j.type,
            j.payload,
            j.attempts,
            j.max_attempts
        FROM jobs j
        WHERE j.status = 'queued'
          AND j.run_at <= NOW()
          AND (p_tenant_id IS NULL OR j.tenant_id = p_tenant_id)
        ORDER BY j.run_at ASC, j.created_at ASC
        FOR UPDATE SKIP LOCKED
        LIMIT p_limit
    ),
    claimed AS (
        UPDATE jobs
        SET 
            status = 'running',
            locked_by = p_worker_id,
            locked_at = NOW(),
            started_at = COALESCE(started_at, NOW()),
            attempts = attempts + 1,
            updated_at = NOW()
        FROM claimable_jobs c
        WHERE jobs.id = c.id
        RETURNING jobs.id, jobs.tenant_id, jobs.type, jobs.payload, jobs.attempts, jobs.max_attempts
    )
    SELECT * FROM claimed;
END;
$$ LANGUAGE plpgsql;

-- Function to complete a job
CREATE OR REPLACE FUNCTION complete_job(
    p_job_id UUID,
    p_status job_status,
    p_error JSONB DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL,
    p_result_ref VARCHAR(500) DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_tenant_id UUID;
    v_attempts INTEGER;
    v_max_attempts INTEGER;
BEGIN
    -- Get job details
    SELECT j.tenant_id, j.attempts, j.max_attempts
    INTO v_tenant_id, v_attempts, v_max_attempts
    FROM jobs j
    WHERE j.id = p_job_id;
    
    IF v_tenant_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Auto-detect dead status
    IF p_status = 'failed' AND v_attempts >= v_max_attempts THEN
        p_status := 'dead';
    END IF;
    
    UPDATE jobs
    SET 
        status = p_status,
        error = p_error,
        error_message = p_error_message,
        result_ref = p_result_ref,
        finished_at = CASE WHEN p_status IN ('succeeded', 'failed', 'dead', 'canceled') THEN NOW() ELSE finished_at END,
        locked_by = NULL,
        locked_at = NULL,
        updated_at = NOW()
    WHERE id = p_job_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to send heartbeat (extend lock)
CREATE OR REPLACE FUNCTION heartbeat_job(
    p_job_id UUID,
    p_worker_id VARCHAR(255)
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE jobs
    SET 
        locked_at = NOW(),
        updated_at = NOW()
    WHERE id = p_job_id
      AND status = 'running'
      AND locked_by = p_worker_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to release stale locks (for cron)
CREATE OR REPLACE FUNCTION release_stale_locks(
    p_stale_threshold INTERVAL DEFAULT INTERVAL '5 minutes'
)
RETURNS INTEGER AS $$
DECLARE
    v_released INTEGER;
BEGIN
    WITH stale_jobs AS (
        SELECT id
        FROM jobs
        WHERE status = 'running'
          AND locked_at < NOW() - p_stale_threshold
    ),
    released AS (
        UPDATE jobs
        SET 
            status = CASE 
                WHEN attempts >= max_attempts THEN 'dead'::job_status 
                ELSE 'queued'::job_status 
            END,
            locked_by = NULL,
            locked_at = NULL,
            run_at = NOW() + (POWER(2, attempts) * INTERVAL '1 minute'),  -- Exponential backoff
            updated_at = NOW()
        FROM stale_jobs s
        WHERE jobs.id = s.id
        RETURNING jobs.id
    )
    SELECT COUNT(*) INTO v_released FROM released;
    
    RETURN v_released;
END;
$$ LANGUAGE plpgsql;

-- Function to store job result (separate from completion)
CREATE OR REPLACE FUNCTION store_job_result(
    p_job_id UUID,
    p_result_data JSONB DEFAULT NULL,
    p_result_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_tenant_id UUID;
    v_result_id UUID;
BEGIN
    -- Get tenant_id from job
    SELECT tenant_id INTO v_tenant_id
    FROM jobs WHERE id = p_job_id;
    
    IF v_tenant_id IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Set tenant context for RLS
    PERFORM set_config('app.current_tenant_id', v_tenant_id::text, true);
    
    INSERT INTO job_results (job_id, tenant_id, result_data, result_url, created_at)
    VALUES (p_job_id, v_tenant_id, p_result_data, p_result_url, NOW())
    ON CONFLICT (job_id) 
    DO UPDATE SET
        result_data = EXCLUDED.result_data,
        result_url = EXCLUDED.result_url
    RETURNING id INTO v_result_id;
    
    RETURN v_result_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to retry a dead/failed job
CREATE OR REPLACE FUNCTION retry_job(
    p_job_id UUID,
    p_delay INTERVAL DEFAULT INTERVAL '0 seconds'
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE jobs
    SET 
        status = 'queued',
        run_at = NOW() + p_delay,
        error = NULL,
        error_message = NULL,
        finished_at = NULL,
        locked_by = NULL,
        locked_at = NULL,
        updated_at = NOW()
    WHERE id = p_job_id
      AND status IN ('failed', 'dead');
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. TRIGGER FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_jobs_updated_at ON jobs;
CREATE TRIGGER tr_jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_jobs_updated_at();

-- ============================================================================
-- 8. SEED JOB TYPE FOR SMOKE TESTS
-- ============================================================================

-- Function to create a test job (for smoke tests)
CREATE OR REPLACE FUNCTION create_test_job(
    p_tenant_id UUID,
    p_test_data JSONB DEFAULT '{"message": "smoke test"}'
)
RETURNS UUID AS $$
BEGIN
    RETURN enqueue_job(
        p_tenant_id := p_tenant_id,
        p_type := 'smoke_test',
        p_payload := p_test_data,
        p_idempotency_key := 'smoke_test_' || p_tenant_id::text || '_' || extract(epoch from now())::text
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 9. COMMENTS
-- ============================================================================

COMMENT ON TABLE jobs IS 'Generic job queue with tenant isolation and idempotency support';
COMMENT ON TABLE job_results IS 'Job result storage (separate table for performance)';

COMMENT ON COLUMN jobs.tenant_id IS 'Tenant/org isolation boundary';
COMMENT ON COLUMN jobs.type IS 'Job type discriminator (e.g., email, report, export)';
COMMENT ON COLUMN jobs.run_at IS 'When job should run (used for scheduling and backoff)';
COMMENT ON COLUMN jobs.locked_by IS 'Worker instance holding the lock';
COMMENT ON COLUMN jobs.result_ref IS 'Reference to external result storage (URL, path, etc.)';
COMMENT ON COLUMN jobs.idempotency_key IS 'Client-provided key for idempotent enqueueing';

COMMENT ON FUNCTION enqueue_job IS 'Enqueue a job with idempotency support';
COMMENT ON FUNCTION claim_jobs IS 'Claim jobs for processing (FOR UPDATE SKIP LOCKED)';
COMMENT ON FUNCTION complete_job IS 'Mark job as complete/failed/dead';
COMMENT ON FUNCTION heartbeat_job IS 'Extend lock lease on running job';
COMMENT ON FUNCTION release_stale_locks IS 'Release locks from crashed workers';

-- ============================================================================
-- 10. ROLLBACK STATEMENTS (for reference)
-- ============================================================================
/*
-- To rollback this migration:

DROP FUNCTION IF EXISTS create_test_job(UUID, JSONB);
DROP FUNCTION IF EXISTS retry_job(UUID, INTERVAL);
DROP FUNCTION IF EXISTS store_job_result(UUID, JSONB, TEXT);
DROP FUNCTION IF EXISTS release_stale_locks(INTERVAL);
DROP FUNCTION IF EXISTS heartbeat_job(UUID, VARCHAR);
DROP FUNCTION IF EXISTS complete_job(UUID, job_status, JSONB, TEXT, VARCHAR);
DROP FUNCTION IF EXISTS claim_jobs(VARCHAR, INTEGER, UUID);
DROP FUNCTION IF EXISTS enqueue_job(UUID, VARCHAR, JSONB, VARCHAR, TIMESTAMPTZ, INTEGER, UUID);

DROP TRIGGER IF EXISTS tr_jobs_updated_at ON jobs;
DROP FUNCTION IF EXISTS update_jobs_updated_at();

DROP POLICY IF EXISTS tenant_job_results_isolation ON job_results;
DROP POLICY IF EXISTS tenant_jobs_isolation ON jobs;

ALTER TABLE jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE job_results DISABLE ROW LEVEL SECURITY;

DROP INDEX IF EXISTS idx_job_results_job_id;
DROP INDEX IF EXISTS idx_job_results_tenant_id;
DROP INDEX IF EXISTS idx_jobs_tenant_status;
DROP INDEX IF EXISTS idx_jobs_idempotency;
DROP INDEX IF EXISTS idx_jobs_locked;
DROP INDEX IF EXISTS idx_jobs_claimable;
DROP INDEX IF EXISTS idx_jobs_run_at;
DROP INDEX IF EXISTS idx_jobs_type;
DROP INDEX IF EXISTS idx_jobs_status;
DROP INDEX IF EXISTS idx_jobs_tenant_id;

DROP TABLE IF EXISTS job_results;
DROP TABLE IF EXISTS jobs;

DROP TYPE IF EXISTS job_status;
*/

COMMIT;