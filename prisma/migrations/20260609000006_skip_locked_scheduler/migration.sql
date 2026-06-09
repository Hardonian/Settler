-- CreateTable
CREATE TABLE "scheduled_jobs" (
    "id" UUID NOT NULL,
    "reconJobId" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "scheduled_for" TIMESTAMP(3) NOT NULL,
    "locked_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "scheduled_jobs_status_scheduled_for_idx" ON "scheduled_jobs"("status", "scheduled_for");

-- CreateIndex
CREATE INDEX "scheduled_jobs_reconJobId_idx" ON "scheduled_jobs"("reconJobId");

-- AlterTable
ALTER TABLE "recon_jobs" ADD COLUMN "next_execution_at" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "scheduled_jobs" ADD CONSTRAINT "scheduled_jobs_reconJobId_fkey" FOREIGN KEY ("reconJobId") REFERENCES "recon_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
