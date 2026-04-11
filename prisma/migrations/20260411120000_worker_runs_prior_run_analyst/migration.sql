-- Bounded workforce audit trail: worker outputs tied to RunDelta canonical truth
CREATE TABLE "worker_runs" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "workerKey" TEXT NOT NULL,
    "workerVersion" TEXT NOT NULL DEFAULT '1',
    "trigger" TEXT NOT NULL DEFAULT 'run_delta_computed',
    "runDeltaId" UUID NOT NULL,
    "status" TEXT NOT NULL,
    "output" JSONB NOT NULL DEFAULT '{}',
    "evidence" JSONB NOT NULL DEFAULT '[]',
    "degradedReasons" JSONB NOT NULL DEFAULT '[]',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "worker_runs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "worker_runs_tenantId_workerKey_createdAt_idx" ON "worker_runs"("tenantId", "workerKey", "createdAt" DESC);
CREATE INDEX "worker_runs_runDeltaId_idx" ON "worker_runs"("runDeltaId");

ALTER TABLE "worker_runs" ADD CONSTRAINT "worker_runs_runDeltaId_fkey" FOREIGN KEY ("runDeltaId") REFERENCES "run_deltas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
