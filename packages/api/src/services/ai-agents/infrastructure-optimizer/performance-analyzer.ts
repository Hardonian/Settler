import { prisma } from "../../../infrastructure/db/prisma";
import { OptimizationOpportunity } from "./types";

export async function analyzePerformance(): Promise<OptimizationOpportunity[]> {
  const opportunities: OptimizationOpportunity[] = [];

  // 1. Check for error-prone connectors
  const errorRates = await prisma.reconResult.groupBy({
    by: ["connectorId"],
    where: {
      createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      status: { in: ["error", "failed"] },
    },
    _count: { id: true },
  });

  const totalRuns = await prisma.reconResult.groupBy({
    by: ["connectorId"],
    where: {
      createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    },
    _count: { id: true },
  });

  for (const errorStat of errorRates) {
    const totalStat = totalRuns.find((t: any) => t.connectorId === errorStat.connectorId);
    if (totalStat) {
      const errorRate = errorStat._count.id / totalStat._count.id;
      if (errorRate > 0.2) {
        opportunities.push({
          id: `opt_perf_errors_${errorStat.connectorId}`,
          type: "performance",
          description: `High error rate for connector ${errorStat.connectorId}: ${(errorRate * 100).toFixed(1)}%`,
          currentState: {
            connectorId: errorStat.connectorId,
            errorRate,
            errorCount7Days: errorStat._count.id,
            totalCount7Days: totalStat._count.id,
          },
          proposedChange: {
            action: "review_connector_config",
            retryPolicy: "exponential_backoff",
          },
          expectedImpact: {
            errorRateReduction: 0.5,
            riskLevel: "low" as const,
          },
          recommendedAction: "human-review" as const,
        });
      }
    }
  }

  // 2. Check for memory-intensive jobs
  const largeJobs = await prisma.reconJob.findMany({
    where: {
      status: "completed",
      executionTime: { gt: 300000 }, // > 5 minutes
      createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    },
    select: { id: true, name: true, executionTime: true },
    take: 10,
  });

  for (const job of largeJobs) {
    opportunities.push({
      id: `opt_perf_memory_${job.id}`,
      type: "performance",
      description: `Memory-intensive job detected: ${job.name} (${job.executionTime}ms)`,
      currentState: {
        jobId: job.id,
        jobName: job.name,
        executionTimeMs: job.executionTime,
      },
      proposedChange: {
        action: "enable_streaming",
        batchSize: 1000,
      },
      expectedImpact: {
        memoryReduction: 0.6,
        riskLevel: "low" as const,
      },
      recommendedAction: "human-review" as const,
    });
  }

  return opportunities;
}
