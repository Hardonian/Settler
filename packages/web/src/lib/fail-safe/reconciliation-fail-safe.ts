/**
 * Reconciliation Fail-Safe Service
 * 
 * Implements fail-safe behaviors for reconciliation operations,
 * ensuring partial results are returned with warnings rather than silent failures.
 */

import { prisma } from '@/shared/db/prismaClient';

export interface FailSafeResult<T> {
  success: boolean;
  data?: T;
  partial?: boolean;
  warnings: string[];
  errors: string[];
  confidence: 'high' | 'medium' | 'low';
}

export interface ReconciliationResult {
  matched: number;
  unmatched: number;
  conflicts: number;
  total: number;
  accuracy: number;
}

/**
 * Execute reconciliation with fail-safe behavior
 */
export async function executeReconciliationWithFailSafe(
  jobId: string
): Promise<FailSafeResult<ReconciliationResult>> {
  const warnings: string[] = [];
  const errors: string[] = [];

  try {
    const job = await prisma.reconJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return {
        success: false,
        warnings: [],
        errors: ['Reconciliation job not found'],
        confidence: 'low',
      };
    }

    // Attempt reconciliation
    let result: ReconciliationResult;
    let partial = false;

    try {
      // Simulate reconciliation logic here
      // In production, this would call the actual reconciliation service
      result = {
        matched: 0,
        unmatched: 0,
        conflicts: 0,
        total: 0,
        accuracy: 0,
      };

      // Check for partial results
      if (result.total > 0 && result.matched < result.total * 0.5) {
        partial = true;
        warnings.push('Less than 50% of transactions matched. Review recommended.');
      }

      if (result.conflicts > result.total * 0.1) {
        partial = true;
        warnings.push('High conflict rate detected. Automated exception handling will process conflicts.');
      }
    } catch (reconciliationError) {
      // Fail-safe: Return partial results if available
      const errorMessage = reconciliationError instanceof Error 
        ? reconciliationError.message 
        : 'Unknown error during reconciliation';
      
      errors.push(`Reconciliation encountered errors: ${errorMessage}`);
      
      // Try to get partial results
      const partialResult = await getPartialResults(jobId);
      if (partialResult) {
        return {
          success: false,
          data: partialResult,
          partial: true,
          warnings: ['Reconciliation completed with errors. Partial results available.'],
          errors,
          confidence: 'low',
        };
      }

      return {
        success: false,
        warnings: [],
        errors,
        confidence: 'low',
      };
    }

    // Determine confidence level
    let confidence: 'high' | 'medium' | 'low' = 'high';
    if (result.accuracy < 80) {
      confidence = 'low';
    } else if (result.accuracy < 95) {
      confidence = 'medium';
    }

    return {
      success: true,
      data: result,
      partial,
      warnings,
      errors: [],
      confidence,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      warnings: [],
      errors: [`Failed to execute reconciliation: ${errorMessage}`],
      confidence: 'low',
    };
  }
}

/**
 * Get partial results if reconciliation fails
 */
async function getPartialResults(jobId: string): Promise<ReconciliationResult | null> {
  try {
    // Try to get any partial results from ReconResult (where these fields actually exist)
    const latestResult = await prisma.reconResult.findFirst({
      where: { reconJobId: jobId },
      orderBy: { createdAt: 'desc' },
      select: {
        matchedCount: true,
        unmatchedSourceCount: true,
        unmatchedTargetCount: true,
        conflictCount: true,
        summary: true,
      },
    });

    if (latestResult) {
      // Calculate accuracy from summary metadata if available
      const summary = latestResult.summary as Record<string, unknown> | null;
      const accuracy = summary?.accuracy ? Number(summary.accuracy) : 0;
      
      return {
        matched: latestResult.matchedCount || 0,
        unmatched: (latestResult.unmatchedSourceCount || 0) + (latestResult.unmatchedTargetCount || 0),
        conflicts: latestResult.conflictCount || 0,
        total: (latestResult.matchedCount || 0) + (latestResult.unmatchedSourceCount || 0) + (latestResult.unmatchedTargetCount || 0) + (latestResult.conflictCount || 0),
        accuracy,
      };
    }

    return null;
  } catch (error) {
    console.error('[Fail-Safe] Error getting partial results:', error);
    return null;
  }
}

/**
 * Validate reconciliation can proceed safely
 */
export async function validateReconciliationSafety(
  jobId: string
): Promise<{ safe: boolean; warnings: string[] }> {
  const warnings: string[] = [];

  try {
    const job = await prisma.reconJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return { safe: false, warnings: ['Job not found'] };
    }

    // Check for potential issues
    if (job.status === 'running') {
      warnings.push('Another reconciliation is already running for this job.');
    }

    // Check data freshness - get from ReconResult since completedAt is there
    const lastRun = await prisma.reconResult.findFirst({
      where: {
        reconJob: {
          id: { not: jobId },
          sourceAdapter: job.sourceAdapter,
          targetAdapter: job.targetAdapter,
        },
        status: 'completed',
      },
      orderBy: { completedAt: 'desc' },
      select: {
        completedAt: true,
      },
      take: 1,
    });

    if (lastRun && lastRun.completedAt) {
      const daysSinceLastRun = (Date.now() - lastRun.completedAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLastRun > 30) {
        warnings.push('Last successful reconciliation was over 30 days ago. Data may be stale.');
      }
    }

    return {
      safe: warnings.length === 0,
      warnings,
    };
  } catch (error) {
    return {
      safe: false,
      warnings: ['Unable to validate safety: ' + (error instanceof Error ? error.message : 'Unknown error')],
    };
  }
}
