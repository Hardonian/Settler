import { PrismaClient } from "@prisma/client";

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
  _options: QueryOptions = {}
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
export async function getJobPerformance(jobId: string, _options: QueryOptions = {}): Promise<any> {
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
  _timeRange: "hour" | "day" | "week" = "hour",
  _options: QueryOptions = {}
): Promise<any> {
  // TODO: This requires a new data model for API logs
  return [];
}

/**
 * Get match accuracy by job using Prisma
 */
export async function getMatchAccuracy(jobId?: string, _options: QueryOptions = {}): Promise<any> {
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

// ============================================================================
// Materialized View Integration
// ============================================================================
// Re-export materialized view infrastructure for convenient access
export * from "./MaterializedViewIndex";

// Lazy initialization helper for materialized view infrastructure
export async function initializeMaterializedViewInfrastructure(tenantId: string): Promise<{
  enabled: boolean;
  views: number;
}> {
  const { initializeTenantMaterializedViews } = await import("./MaterializedViewManager");
  const { startScheduler } = await import("./MaterializedViewScheduler");

  // Initialize tenant configuration
  await initializeTenantMaterializedViews(tenantId);

  // Start scheduler if not already running
  startScheduler(60000); // Check every minute

  const config = (await import("./MaterializedViewManager")).getTenantConfig(tenantId);

  return {
    enabled: config?.enabled ?? false,
    views: config?.views.length ?? 0,
  };
}

/**
 * Refresh all materialized views across all tenants
 * Used by the background job scheduler
 */
export async function refreshAllMaterializedViews(): Promise<{
  success: boolean;
  refreshedViews: number;
  failedViews: number;
  errors: string[];
}> {
  const { tenantConfigs } = await import("./MaterializedViewManager");
  const { refreshAllTenantViews } = await import("./MaterializedViewScheduler");

  // Get all tenants with materialized views enabled
  const configs = Array.from(tenantConfigs.values()).filter((c: any) => c.enabled);

  const results = {
    success: true,
    refreshedViews: 0,
    failedViews: 0,
    errors: [] as string[],
  };

  for (const config of configs) {
    const tenantResult = await refreshAllTenantViews(config.tenantId, true);

    for (const viewResult of tenantResult.results) {
      if (viewResult.success) {
        results.refreshedViews++;
      } else {
        results.failedViews++;
        results.errors.push(`${config.tenantId}/${viewResult.viewId}: ${viewResult.error}`);
      }
    }
  }

  results.success = results.failedViews === 0;

  return results;
}

/**
 * Execute a query with automatic materialized view optimization
 * This is the main entry point for using materialized views with queries
 */
export async function executeOptimizedQuery(
  tenantId: string,
  query: string,
  options: {
    /** Force use of materialized view */
    forceMaterializedView?: boolean;
    /** Allow stale data */
    allowStale?: boolean;
    /** Force refresh before query */
    forceRefresh?: boolean;
  } = {}
): Promise<{
  /** Whether a materialized view was used */
  usedMaterializedView: boolean;
  /** The query that was executed */
  executedQuery: string;
  /** Performance metrics */
  metrics: {
    startTime: number;
    endTime: number;
    durationMs: number;
  };
  /** Results from the query */
  results: any[];
}> {
  const startTime = Date.now();

  // Try to rewrite query to use materialized view
  const { rewriteQuery } = await import("./MaterializedViewQueryRewriter");
  const { getTenantConfig } = await import("./MaterializedViewManager");

  const tenantConfig = getTenantConfig(tenantId);
  let useMaterializedView =
    options.forceMaterializedView ||
    (tenantConfig?.enabled && tenantConfig.settings.enableQueryRewriting);

  let executedQuery = query;
  let usedMv = false;

  if (useMaterializedView) {
    const rewriteResult = await rewriteQuery(tenantId, query, {
      allowStale: options.allowStale,
      forceRefresh: options.forceRefresh,
    });

    if (rewriteResult.rewritten) {
      executedQuery = rewriteResult.query;
      usedMv = true;
    }
  }

  // Execute the query (this would use the actual database query function)
  // For now, return the query that would be executed
  const endTime = Date.now();

  return {
    usedMaterializedView: usedMv,
    executedQuery,
    metrics: {
      startTime,
      endTime,
      durationMs: endTime - startTime,
    },
    results: [], // Would contain actual query results
  };
}
