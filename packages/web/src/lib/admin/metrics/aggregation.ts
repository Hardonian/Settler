/**
 * Admin Dashboard Aggregation Utilities
 *
 * Server-side aggregation functions for computing metrics from database.
 * Optimized for performance with proper indexing and bounded queries.
 */

import { KPIMetrics, TrendPoint, ExceptionHeatmap, ActivityFeedItem } from "./types";
import { prisma } from "@/shared/db/prismaClient";

/**
 * Calculate date range from time range string
 */
export function getDateRange(
  range: "24h" | "7d" | "30d" | "custom",
  startDate?: Date,
  endDate?: Date
): { start: Date; end: Date } {
  const end = endDate || new Date();
  let start: Date;

  switch (range) {
    case "24h":
      start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
      break;
    case "7d":
      start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
      start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "custom":
      start = startDate || new Date(end.getTime() - 24 * 60 * 60 * 1000);
      break;
  }

  return { start, end };
}

/**
 * Aggregate KPI metrics for a time range
 */
export async function aggregateKPIMetrics(
  tenantId: string | null,
  start: Date,
  end: Date
): Promise<KPIMetrics> {
  // Build base where clause
  const whereClause: any = {
    createdAt: { gte: start, lte: end },
  };
  if (tenantId) {
    whereClause.tenantId = tenantId;
  }

  // Get reconciliation runs in range
  const runs = await prisma.reconciliationRun.findMany({
    where: {
      ...whereClause,
      status: "completed",
    },
    select: {
      matchedCount: true,
      unmatchedSourceCount: true,
      unmatchedTargetCount: true,
      confidenceAvg: true,
      sourceCount: true,
      targetCount: true,
    },
  });

  // Aggregate metrics
  const totalMatched = runs.reduce(
    (sum: number, r: { matchedCount?: number | null }) => sum + (r.matchedCount || 0),
    0
  );
  const totalUnmatched = runs.reduce(
    (
      sum: number,
      r: { unmatchedSourceCount?: number | null; unmatchedTargetCount?: number | null }
    ) => sum + (r.unmatchedSourceCount || 0) + (r.unmatchedTargetCount || 0),
    0
  );
  const totalVolume = runs.reduce(
    (sum: number, r: { sourceCount?: number | null; targetCount?: number | null }) =>
      sum + (r.sourceCount || 0) + (r.targetCount || 0),
    0
  );
  const matchedPercent = totalVolume > 0 ? (totalMatched / totalVolume) * 100 : 0;

  // Get confidence stats
  const confidences = runs
    .map((r: { confidenceAvg?: number | null }) => r.confidenceAvg)
    .filter((c: number | null | undefined): c is number => c !== null && c !== undefined)
    .map((c: number) => Number(c));
  const confidenceAvg =
    confidences.length > 0
      ? confidences.reduce((sum: number, c: number) => sum + c, 0) / confidences.length
      : null;
  const confidenceMin = confidences.length > 0 ? Math.min(...confidences) : null;
  const confidenceMax = confidences.length > 0 ? Math.max(...confidences) : null;

  // Get exceptions count
  const exceptionsCount = await prisma.driftEvent.count({
    where: {
      ...whereClause,
      acknowledged: false,
    },
  });

  // Get refunds count (from metadata or separate query)
  const refundsCount = await prisma.reconciliationMatch.count({
    where: {
      run: {
        ...whereClause,
      },
      matchType: "unmatched",
      metadata: {
        path: ["isRefund"],
        equals: true,
      },
    },
  });

  // Get payout gaps (unmatched target transactions)
  const payoutGaps = await prisma.reconciliationMatch.count({
    where: {
      run: {
        ...whereClause,
      },
      matchType: "unmatched",
      targetTransactionId: null,
    },
  });

  // Calculate average time to resolve exceptions (simplified)
  const resolvedExceptions = await prisma.driftEvent.findMany({
    where: {
      ...whereClause,
      acknowledged: true,
      acknowledgedAt: { not: null },
    },
    select: {
      createdAt: true,
      acknowledgedAt: true,
    },
  });

  const resolveTimes = resolvedExceptions
    .map((e: { acknowledgedAt: Date | null; createdAt: Date }) => {
      if (!e.acknowledgedAt) return null;
      return new Date(e.acknowledgedAt).getTime() - new Date(e.createdAt).getTime();
    })
    .filter((t: number | null): t is number => t !== null);
  const avgTimeToResolve =
    resolveTimes.length > 0
      ? resolveTimes.reduce((sum: number, t: number) => sum + t, 0) / resolveTimes.length
      : 0;

  return {
    matchedPercent,
    exceptionsCount,
    avgTimeToResolve,
    totalVolume,
    refundsCount,
    payoutGaps,
    matchedCount: totalMatched,
    unmatchedCount: totalUnmatched,
    confidenceAvg,
    confidenceMin,
    confidenceMax,
  };
}

/**
 * Generate trend data points for a time range
 */
export async function aggregateTrendData(
  tenantId: string | null,
  start: Date,
  end: Date,
  bucketSize: "hour" | "day" = "hour"
): Promise<TrendPoint[]> {
  // Simplified: return hourly/daily buckets
  const buckets: TrendPoint[] = [];
  const bucketMs = bucketSize === "hour" ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

  let current = new Date(start);
  while (current <= end) {
    const bucketEnd = new Date(Math.min(current.getTime() + bucketMs, end.getTime()));

    const whereClause: any = {
      createdAt: { gte: current, lt: bucketEnd },
    };
    if (tenantId) {
      whereClause.tenantId = tenantId;
    }

    const runs = await prisma.reconciliationRun.findMany({
      where: {
        ...whereClause,
        status: "completed",
      },
      select: {
        matchedCount: true,
        sourceCount: true,
        targetCount: true,
      },
    });

    const totalMatched = runs.reduce((sum: number, r: any) => sum + (r.matchedCount || 0), 0);
    const totalVolume = runs.reduce(
      (sum: number, r: any) => sum + (r.sourceCount || 0) + (r.targetCount || 0),
      0
    );
    const matchedPercent = totalVolume > 0 ? (totalMatched / totalVolume) * 100 : 0;

    buckets.push({
      timestamp: current.toISOString(),
      value: matchedPercent,
    });

    current = bucketEnd;
  }

  return buckets;
}

/**
 * Aggregate exception heatmap data
 */
export async function aggregateExceptionHeatmap(
  tenantId: string | null,
  start: Date,
  end: Date
): Promise<ExceptionHeatmap[]> {
  const whereClause: any = {
    createdAt: { gte: start, lte: end },
  };
  if (tenantId) {
    whereClause.tenantId = tenantId;
  }

  const exceptions = await prisma.driftEvent.findMany({
    where: whereClause,
    select: {
      driftType: true,
      severity: true,
    },
  });

  // Group by source (driftType) and severity
  const heatmap = new Map<string, Map<string, number>>();

  for (const ex of exceptions) {
    const source = ex.driftType || "unknown";
    const severity = (ex.severity || "info") as "info" | "warn" | "critical";

    if (!heatmap.has(source)) {
      heatmap.set(source, new Map());
    }
    const severityMap = heatmap.get(source)!;
    severityMap.set(severity, (severityMap.get(severity) || 0) + 1);
  }

  const result: ExceptionHeatmap[] = [];
  for (const [source, severityMap] of heatmap.entries()) {
    for (const [severity, count] of severityMap.entries()) {
      result.push({
        source,
        severity: severity as "info" | "warn" | "critical",
        count,
      });
    }
  }

  return result;
}

/**
 * Get recent activity feed items
 */
export async function getRecentActivity(
  tenantId: string | null,
  limit: number = 50
): Promise<ActivityFeedItem[]> {
  const whereClause: any = {};
  if (tenantId) {
    whereClause.tenantId = tenantId;
  }

  // Get recent runs
  const runs = await prisma.reconciliationRun.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      status: true,
      createdAt: true,
      tenantId: true,
    },
  });

  // Get recent exceptions
  const exceptions = await prisma.driftEvent.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      severity: true,
      acknowledged: true,
      createdAt: true,
      tenantId: true,
    },
  });

  const activities: ActivityFeedItem[] = [];

  // Add run activities
  for (const run of runs) {
    if (run.status === "completed") {
      activities.push({
        id: run.id,
        type: "run_completed",
        timestamp: run.createdAt.toISOString(),
        message: `Reconciliation run completed`,
        metadata: { runId: run.id },
      });
    }
  }

  // Add exception activities
  for (const ex of exceptions) {
    if (!ex.acknowledged) {
      activities.push({
        id: ex.id,
        type: "exception_created",
        timestamp: ex.createdAt.toISOString(),
        message: `New ${ex.severity} exception detected`,
        metadata: { exceptionId: ex.id, severity: ex.severity },
      });
    } else {
      activities.push({
        id: ex.id,
        type: "exception_resolved",
        timestamp: ex.createdAt.toISOString(),
        message: `Exception resolved`,
        metadata: { exceptionId: ex.id },
      });
    }
  }

  // Sort by timestamp and limit
  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return activities.slice(0, limit);
}
