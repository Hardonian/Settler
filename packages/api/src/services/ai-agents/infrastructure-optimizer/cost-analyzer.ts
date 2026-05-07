import { prisma } from "../../../infrastructure/db/prisma";
import { OptimizationOpportunity } from "./types";

export async function analyzeCosts(): Promise<OptimizationOpportunity[]> {
  const opportunities: OptimizationOpportunity[] = [];

  // 1. Analyze AI usage patterns
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const aiCalls = await prisma.usageEvent.findMany({
    where: {
      eventType: "ai_request",
      timestamp: { gte: thirtyDaysAgo },
    },
    select: { metadata: true },
  });

  // Group by model and find optimization opportunities
  const modelUsage: Record<string, { calls: number; tokens: number; cost: number }> = {};
  for (const call of aiCalls) {
    const metadata = (call.metadata as any) || {};
    const model = metadata.model || "unknown";
    const cost = metadata.cost || 0;
    const tokens = metadata.tokens || 0;

    if (!modelUsage[model]) {
      modelUsage[model] = { calls: 0, tokens: 0, cost: 0 };
    }
    const usage = modelUsage[model]!;
    usage.calls++;
    usage.tokens += tokens;
    usage.cost += cost;
  }

  // Check for expensive model usage that could be downgraded
  const gpt4Usage = modelUsage["gpt-4"];
  if (gpt4Usage && gpt4Usage.cost > 100) {
    opportunities.push({
      id: "opt_cost_ai_downgrade",
      type: "cost",
      description: `High GPT-4 usage detected: $${gpt4Usage.cost.toFixed(2)} in 30 days`,
      currentState: {
        model: "gpt-4",
        cost30Days: gpt4Usage.cost,
        calls30Days: gpt4Usage.calls,
      },
      proposedChange: {
        downgradeTo: "gpt-4o-mini",
      },
      expectedImpact: {
        costSavings: gpt4Usage.cost * 0.9,
        riskLevel: "low" as const,
      },
      recommendedAction: "human-review" as const,
    });
  }

  // 2. Check for unused reconciliation jobs
  const staleJobs = await prisma.reconJob.count({
    where: {
      status: "active",
      lastRunAt: { lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
    },
  });

  if (staleJobs > 10) {
    opportunities.push({
      id: "opt_cost_stale_jobs",
      type: "cost",
      description: `${staleJobs} stale reconciliation jobs detected (>90 days since last run)`,
      currentState: {
        staleJobCount: staleJobs,
        threshold: "90 days",
      },
      proposedChange: {
        action: "archive_or_delete",
        targetCount: staleJobs,
      },
      expectedImpact: {
        costSavings: staleJobs * 5, // $5 per job/month estimate
        riskLevel: "low" as const,
      },
      recommendedAction: "human-review" as const,
    });
  }

  // 3. Check for high-volume raw data
  const unmappedCount = await prisma.rawRecord.count({
    where: {
      status: "failed",
      createdAt: { gte: thirtyDaysAgo },
    },
  });

  if (unmappedCount > 10000) {
    opportunities.push({
      id: "opt_cost_unmapped_cleanup",
      type: "cost",
      description: `High unmapped record count: ${unmappedCount} records in 30 days`,
      currentState: {
        unmappedRecords: unmappedCount,
        storageCostEstimate: unmappedCount * 0.001,
      },
      proposedChange: {
        action: "review_mappings",
        autoCleanupThreshold: "30 days",
      },
      expectedImpact: {
        costSavings: 25,
        riskLevel: "low" as const,
      },
      recommendedAction: "human-review" as const,
    });
  }

  return opportunities;
}
