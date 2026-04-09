/**
 * Automated Review Trigger Service
 *
 * Triggers automated review for reconciliation runs that have completed.
 * Can be called as a scheduled job or webhook handler.
 */

import { query } from "../../db";
import { logError, logInfo } from "../../utils/logger";
import { autoReviewRun } from "./automated-review";
import { checkQualityThresholds, generateQualityReport } from "./quality-monitor";

/**
 * Process completed reconciliation runs that haven't been reviewed
 */
export async function processPendingReviews(limit: number = 100): Promise<{
  processed: number;
  reviewed: number;
  errors: number;
}> {
  try {
    // Find completed runs that haven't been fully reviewed
    const runs = await query<{
      id: string;
      tenant_id: string;
      status: string;
      completed_at: Date | null;
    }>(
      `SELECT id, tenant_id, status, completed_at
       FROM reconciliation_runs
       WHERE status = 'completed'
         AND completed_at IS NOT NULL
         AND completed_at > NOW() - INTERVAL '24 hours'
         AND id NOT IN (
           SELECT DISTINCT run_id
           FROM reconciliation_matches
           WHERE reviewed = true
         )
       ORDER BY completed_at ASC
       LIMIT $1`,
      [limit]
    );

    const stats = {
      processed: 0,
      reviewed: 0,
      errors: 0,
    };

    for (const run of runs) {
      try {
        stats.processed++;

        // Auto-review the run
        const reviewStats = await autoReviewRun(run.id, run.tenant_id);
        stats.reviewed += reviewStats.reviewed;

        // Check quality and generate report
        await checkQualityThresholds(run.id, run.tenant_id);

        logInfo("Pending review processed", {
          runId: run.id,
          tenantId: run.tenant_id,
          reviewed: reviewStats.reviewed,
        });
      } catch (error) {
        stats.errors++;
        logError("Failed to process pending review", error, {
          runId: run.id,
          tenantId: run.tenant_id,
        });
      }
    }

    return stats;
  } catch (error) {
    logError("Failed to process pending reviews", error);
    throw error;
  }
}

/**
 * Trigger automated review for a specific reconciliation run
 * Called automatically after reconciliation completes
 */
export async function triggerAutomatedReview(runId: string, tenantId: string): Promise<void> {
  try {
    // Verify run is completed
    const runResult = await query<{
      status: string;
      completed_at: Date | null;
    }>(
      `SELECT status, completed_at
       FROM reconciliation_runs
       WHERE id = $1 AND tenant_id = $2`,
      [runId, tenantId]
    );

    if (runResult.length === 0) {
      throw new Error(`Reconciliation run ${runId} not found`);
    }

    const run = runResult[0]!;
    if (run.status !== "completed") {
      logInfo("Run not completed, skipping review", {
        runId,
        tenantId,
        status: run.status,
      });
      return;
    }

    // Auto-review the run
    const reviewStats = await autoReviewRun(runId, tenantId);

    // Check quality thresholds
    const alerts = await checkQualityThresholds(runId, tenantId);

    // Generate quality report
    const report = await generateQualityReport(runId, tenantId);

    logInfo("Automated review triggered", {
      runId,
      tenantId,
      reviewStats,
      alertCount: alerts.length,
      reportStatus: report.status,
    });
  } catch (error) {
    logError("Failed to trigger automated review", error, {
      runId,
      tenantId,
    });
    throw error;
  }
}

/**
 * Scheduled job to process pending reviews
 * Should be called periodically (e.g., every 5 minutes)
 */
export async function scheduledReviewProcessor(): Promise<void> {
  try {
    const stats = await processPendingReviews(100);
    logInfo("Scheduled review processor completed", stats);
  } catch (error) {
    logError("Scheduled review processor failed", error);
    throw error;
  }
}
