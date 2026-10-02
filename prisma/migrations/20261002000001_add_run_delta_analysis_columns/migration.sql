-- Add the analysis columns declared by the RunDelta model in prisma/schema.prisma
-- that no migration ever created (schema was ahead of migrations; the live
-- run_deltas table had only the original 15 columns from create_recon_tables).
-- Column names follow the schema's @map("snake_case") convention.
-- Additive, idempotent (IF NOT EXISTS), defaults match model defaults.

ALTER TABLE run_deltas ADD COLUMN IF NOT EXISTS exception_delta INTEGER NOT NULL DEFAULT 0;
ALTER TABLE run_deltas ADD COLUMN IF NOT EXISTS critical_delta INTEGER NOT NULL DEFAULT 0;
ALTER TABLE run_deltas ADD COLUMN IF NOT EXISTS high_delta INTEGER NOT NULL DEFAULT 0;
ALTER TABLE run_deltas ADD COLUMN IF NOT EXISTS medium_delta INTEGER NOT NULL DEFAULT 0;
ALTER TABLE run_deltas ADD COLUMN IF NOT EXISTS low_delta INTEGER NOT NULL DEFAULT 0;
ALTER TABLE run_deltas ADD COLUMN IF NOT EXISTS new_exception_patterns JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE run_deltas ADD COLUMN IF NOT EXISTS resolved_patterns JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE run_deltas ADD COLUMN IF NOT EXISTS config_drift_detected BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE run_deltas ADD COLUMN IF NOT EXISTS config_drift_summary JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE run_deltas ADD COLUMN IF NOT EXISTS confidence_delta DECIMAL(5, 4);
ALTER TABLE run_deltas ADD COLUMN IF NOT EXISTS quality_score_delta DECIMAL(5, 4);
ALTER TABLE run_deltas ADD COLUMN IF NOT EXISTS analysis_version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE run_deltas ADD COLUMN IF NOT EXISTS algorithm TEXT NOT NULL DEFAULT 'v1';
ALTER TABLE run_deltas ADD COLUMN IF NOT EXISTS processing_time_ms BIGINT;
ALTER TABLE run_deltas ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_run_deltas_job ON run_deltas(job_id);
CREATE INDEX IF NOT EXISTS idx_run_deltas_generated_at ON run_deltas(delta_generated_at DESC);
