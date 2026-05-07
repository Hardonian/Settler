import { prisma } from "../../../infrastructure/db/prisma";
import { OptimizationOpportunity } from "./types";

export async function analyzeCapacity(): Promise<OptimizationOpportunity[]> {
  const opportunities: OptimizationOpportunity[] = [];

  // 1. Check queue depth
  const pendingJobs = await prisma.reconJob.count({
    where: { status: "pending" },
  });

  const processingJobs = await prisma.reconJob.count({
    where: { status: "processing" },
  });

  const queueRatio = pendingJobs / (processingJobs || 1);

  if (queueRatio > 5) {
    opportunities.push({
      id: "opt_capacity_queue_depth",
      type: "capacity",
      description: `High queue depth: ${pendingJobs} pending, ${processingJobs} processing`,
      currentState: {
        pendingJobs,
        processingJobs,
        queueRatio,
      },
      proposedChange: {
        action: "scale_workers",
        targetWorkers: Math.ceil(pendingJobs / 10),
      },
      expectedImpact: {
        throughputIncrease: 2.0,
        riskLevel: "low" as const,
      },
      recommendedAction: "auto-apply" as const,
    });
  }

  // 2. Check onboarding progress as a proxy for active users
  const activeUsers24h = await prisma.onboardingProgress.count({
    where: { updatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
  });

  if (activeUsers24h > 100) {
    opportunities.push({
      id: "opt_capacity_users",
      type: "capacity",
      description: `High user load: ${activeUsers24h} active users in 24h`,
      currentState: {
        activeUsers24h,
        threshold: 100,
      },
      proposedChange: {
        action: "enable_cdn_caching",
        cacheStaticAssets: true,
      },
      expectedImpact: {
        loadReduction: 0.4,
        riskLevel: "low" as const,
      },
      recommendedAction: "auto-apply" as const,
    });
  }

  return opportunities;
}
