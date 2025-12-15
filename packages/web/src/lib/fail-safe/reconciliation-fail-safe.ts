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
    const job = await prisma.reconciliationJob.findUnique({
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
        warnings.push('High conflict rate detected. Manual review strongly recommended.');
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
    // Try to get any partial results from the database
    const partialData = await prisma.reconciliationJob.findUnique({
      where: { id: jobId },
      select: {
        matchedCount: true,
        unmatchedCount: true,
        conflictsCount: true,
        accuracy: true,
      },
    });

    if (partialData) {
      return {
        matched: partialData.matchedCount || 0,
        unmatched: partialData.unmatchedCount || 0,
        conflicts: partialData.conflictsCount || 0,
        total: (partialData.matchedCount || 0) + (partialData.unmatchedCount || 0) + (partialData.conflictsCount || 0),
        accuracy: partialData.accuracy || 0,
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
    const job = await prisma.reconciliationJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return { safe: false, warnings: ['Job not found'] };
    }

    // Check for potential issues
    if (job.status === 'running') {
      warnings.push('Another reconciliation is already running for this job.');
    }

    // Check data freshness
    const lastRun = await prisma.reconciliationJob.findFirst({
      where: {
        id: { not: jobId },
        sourceAdapter: job.sourceAdapter,
        targetAdapter: job.targetAdapter,
        status: 'completed',
      },
      orderBy: { completedAt: 'desc' },
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
