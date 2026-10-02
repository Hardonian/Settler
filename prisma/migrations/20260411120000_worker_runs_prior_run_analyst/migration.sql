-- Bounded workforce audit trail: worker outputs tied to RunDelta canonical truth
-- Corrected 2026-10-02: columns were originally created camelCase (quoted),
-- contradicting the schema's @map("snake_case") column mappings; renamed to the
-- declared column names. Applied on the live database via RENAME (see
-- docs/MIGRATION_AUDIT_REPORT.md companion notes).
CREATE TABLE "worker_runs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "worker_key" TEXT NOT NULL,
    "worker_version" TEXT NOT NULL DEFAULT '1',
    "trigger" TEXT NOT NULL DEFAULT 'run_delta_computed',
    "run_delta_id" UUID NOT NULL,
    "status" TEXT NOT NULL,
    "output" JSONB NOT NULL DEFAULT '{}',
    "evidence" JSONB NOT NULL DEFAULT '[]',
    "degraded_reasons" JSONB NOT NULL DEFAULT '[]',
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "worker_runs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "worker_runs_tenant_id_worker_key_created_at_idx" ON "worker_runs"("tenant_id", "worker_key", "created_at" DESC);
CREATE INDEX "worker_runs_run_delta_id_idx" ON "worker_runs"("run_delta_id");

ALTER TABLE "worker_runs" ADD CONSTRAINT "worker_runs_run_delta_id_fkey" FOREIGN KEY ("run_delta_id") REFERENCES "run_deltas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
