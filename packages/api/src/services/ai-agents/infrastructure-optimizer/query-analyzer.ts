import { prisma } from "../../../infrastructure/db/prisma";
import { logInfo } from "../../../utils/logger";
import { OptimizationOpportunity } from "./types";

export async function analyzeQueries(): Promise<OptimizationOpportunity[]> {
  const opportunities: OptimizationOpportunity[] = [];

  try {
    const slowQueries = (await prisma.$queryRaw`
      SELECT query, mean_exec_time, calls, rows
      FROM pg_stat_statements
      WHERE mean_exec_time > 100
      ORDER BY mean_exec_time DESC
      LIMIT 10
    `) as any[];

    for (let i = 0; i < slowQueries.length; i++) {
      const sq = slowQueries[i];
      if (!sq) continue;
      if (
        sq.query.includes("CREATE INDEX") ||
        sq.query.startsWith("COMMIT") ||
        sq.query.startsWith("BEGIN")
      ) {
        continue;
      }

      opportunities.push({
        id: `opt_query_${i + 1}`,
        type: "query",
        description: `Slow query detected: ${sq.query.substring(0, 100)}...`,
        currentState: {
          query: sq.query,
          avgDuration: sq.mean_exec_time,
          callCount: sq.calls,
        },
        proposedChange: {
          recommendation: "Consider adding indexes or optimizing query structure",
        },
        expectedImpact: {
          performanceImprovement: 50,
          riskLevel: "low" as const,
        },
        recommendedAction: "human-review" as const,
      });
    }
  } catch {
    // pg_stat_statements not available, fall back to query log analysis
    logInfo("pg_stat_statements not available, using query log analysis");

    const recentJobs = await prisma.reconJob.findMany({
      where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      select: { id: true, executionTime: true },
      orderBy: { executionTime: "desc" },
      take: 20,
    });

    for (let i = 0; i < recentJobs.length; i++) {
      const job = recentJobs[i];
      if (job.executionTime && job.executionTime > 60000) {
        opportunities.push({
          id: `opt_slow_job_${i + 1}`,
          type: "query",
          description: `Slow reconciliation job: ${job.id}`,
          currentState: {
            jobId: job.id,
            executionTimeMs: job.executionTime,
          },
          proposedChange: {
            recommendation: "Review job configuration and data volume",
          },
          expectedImpact: {
            performanceImprovement: 30,
            riskLevel: "low" as const,
          },
          recommendedAction: "human-review" as const,
        });
      }
    }
  }

  return opportunities;
}
