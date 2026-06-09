/**
 * Structured logging for UUID collisions across recon_jobs and recon_results.
 * No PII beyond ids already in the request path.
 */

export interface UuidCollisionLogInput {
  tenantId: string;
  duplicateUuid: string;
  reconJobId: string;
  reconciliationRunId: string;
}

export type CollisionLogger = (entry: UuidCollisionLogInput) => void | Promise<void>;

let collisionLogger: CollisionLogger | null = null;

export function setReconciliationCollisionLogger(logger: CollisionLogger | null): void {
  collisionLogger = logger;
}

export async function logConflict(entry: UuidCollisionLogInput): Promise<void> {
  if (collisionLogger) {
    await collisionLogger(entry);
    return;
  }

  console.error(
    JSON.stringify({
      level: "error",
      event: "reconciliation_uuid_collision",
      tenant_id: entry.tenantId,
      duplicate_uuid: entry.duplicateUuid,
      recon_job_id: entry.reconJobId,
      reconciliation_run_id: entry.reconciliationRunId,
    })
  );
}
