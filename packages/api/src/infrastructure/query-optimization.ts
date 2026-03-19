import { PrismaClient } from "@prisma/client";
import { logInfo, logDebug } from "../utils/logger";

const prisma = new PrismaClient();

export interface QueryOptions {
  /** Use materialized view if available */
  useMaterializedView?: boolean;
  /** Force refresh materialized view before query */
  refreshView?: boolean;
  /** Cache result */
  cache?: boolean;
  /** Cache TTL in seconds */
  cacheTtl?: number;
}

/**
 * Get reconciliation summary using Prisma
 */
export async function getReconciliationSummary(
  jobId: string,
  dateRange?: { start: Date; end: Date },
  options: QueryOptions = {}
): Promise<any> {
  const where = {
    reconJobId: jobId,
    ...(dateRange && {
      createdAt: {
        gte: dateRange.start,
        lte: dateRange.end,
      },
    }),
  };

  const results = await prisma.reconResult.groupBy({
    by: ["status"],
    where,
    _count: {
      status: true,
    },
  });

  const summary = results.reduce(
    (acc, { status, _count }) => {
      acc[status] = _count.status;
      return acc;
    },
    {} as Record<string, number>
  );

  const total = await prisma.reconResult.count({ where });

  return { ...summary, total };
}

/**
 * Get job performance metrics using Prisma
 */
export async function getJobPerformance(jobId: string, options: QueryOptions = {}): Promise<any> {
  const job = await prisma.reconJob.findUnique({
    where: { id: jobId },
    include: {
      results: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
  });

  if (!job) {
    return null;
  }

  const totalExecutions = await prisma.reconResult.count({
    where: { reconJobId: jobId },
  });

  const successfulExecutions = await prisma.reconResult.count({
    where: { reconJobId: jobId, status: "completed" },
  });

  const failedExecutions = await prisma.reconResult.count({
    where: { reconJobId: jobId, status: "failed" },
  });

  const avgExecutionTime = await prisma.reconResult.aggregate({
    where: { reconJobId: jobId, status: "completed" },
    _avg: {
      durationMs: true,
    },
  });

  return {
    job_id: jobId,
    total_executions: totalExecutions,
    successful_executions: successfulExecutions,
    failed_executions: failedExecutions,
    avg_execution_time_ms: avgExecutionTime._avg.durationMs,
    last_execution_at: job.results[0]?.createdAt,
    last_execution_status: job.results[0]?.status,
  };
}

/**
 * Get tenant usage metrics using Prisma
 */
export async function getTenantUsage(
  tenantId: string,
  timeRange: "hour" | "day" | "week" = "hour",
  options: QueryOptions = {}
): Promise<any> {
  // TODO: This requires a new data model for API logs
  return [];
}

/**
 * Get match accuracy by job using Prisma
 */
export async function getMatchAccuracy(jobId?: string, options: QueryOptions = {}): Promise<any> {
  const where = {
    ...(jobId && { reconJobId: jobId }),
  };

  const totalMatches = await prisma.reconResult.count({ where });

  const accurateMatches = await prisma.reconResult.count({
    where: {
      ...where,
      confidenceAvg: {
        gte: 0.95,
      },
    },
  });

  const inaccurateMatches = await prisma.reconResult.count({
    where: {
      ...where,
      confidenceAvg: {
        lt: 0.95,
      },
    },
  });

  const avgConfidence = await prisma.reconResult.aggregate({
    where,
    _avg: {
      confidenceAvg: true,
    },
  });

  return {
    job_id: jobId,
    total_matches: totalMatches,
    accurate_matches: accurateMatches,
    inaccurate_matches: inaccurateMatches,
    accuracy_percentage: totalMatches > 0 ? (accurateMatches / totalMatches) * 100 : 0,
    avg_confidence_score: avgConfidence._avg.confidenceAvg,
  };
}

/**
 * Refresh a materialized view
 */
export async function refreshMaterializedView(viewName: string): Promise<void> {
  // This function is no longer needed
}

/**
 * Refresh all materialized views
 */
export async function refreshAllMaterializedViews(): Promise<void> {
  // This function is no longer needed
}
