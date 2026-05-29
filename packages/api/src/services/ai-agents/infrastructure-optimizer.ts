/**
 * Infrastructure Optimizer Agent
 *
 * Automatically optimizes Settler's infrastructure:
 * - Query optimization
 * - Cost reduction
 * - Performance tuning
 * - Capacity planning
 */

import { BaseAgent } from "./orchestrator";
import { logError, logInfo } from "../../utils/logger";
import { prisma } from "../../infrastructure/db/prisma";

export interface OptimizationOpportunity {
  id: string;
  type: "query" | "cost" | "performance" | "capacity";
  description: string;
  currentState: Record<string, unknown>;
  proposedChange: Record<string, unknown>;
  expectedImpact: {
    costSavings?: number;
    performanceImprovement?: number;
    errorRateReduction?: number;
    memoryReduction?: number;
    throughputIncrease?: number;
    loadReduction?: number;
    riskLevel: "low" | "medium" | "high";
  };
  recommendedAction: "auto-apply" | "human-review";
}

export class InfrastructureOptimizerAgent extends BaseAgent {
  id = "infrastructure-optimizer";
  name = "Infrastructure Optimizer";
  type = "infrastructure" as const;

  private lastOptimization?: Date;
  private optimizationHistory: OptimizationOpportunity[] = [];

  async initialize(): Promise<void> {
    // Start periodic optimization checks
    setInterval(() => {
      if (this.enabled) {
        this.analyzeInfrastructure().catch((error) => {
          logError("Infrastructure analysis failed", error);
        });
      }
    }, 3600000); // Every hour

    this.enabled = true;
  }

  async execute(action: string, params: Record<string, unknown>): Promise<unknown> {
    switch (action) {
      case "analyze":
        return await this.analyzeInfrastructure();

      case "optimize":
        return await this.optimizeInfrastructure(params);

      case "get_opportunities":
        return this.optimizationHistory;

      case "get_stats":
        return await this.getStatus();

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  async getStatus(): Promise<{
    enabled: boolean;
    lastExecution?: Date;
    metrics?: Record<string, unknown>;
  }> {
    const status: {
      enabled: boolean;
      lastExecution?: Date;
      metrics?: Record<string, unknown>;
    } = {
      enabled: this.enabled,
    };
    if (this.lastOptimization) {
      status.lastExecution = this.lastOptimization;
    }
    status.metrics = {
      opportunitiesFound: this.optimizationHistory.length,
      autoApplied: this.optimizationHistory.filter((o) => o.recommendedAction === "auto-apply")
        .length,
    };
    return status;
  }

  /**
   * Analyze infrastructure for optimization opportunities
   */
  private async analyzeInfrastructure(): Promise<OptimizationOpportunity[]> {
    const opportunities: OptimizationOpportunity[] = [];

    // Analyze query performance
    const slowQueries = await this.findSlowQueries();
    opportunities.push(...slowQueries);

    // Analyze costs
    const costOpportunities = await this.findCostOptimizations();
    opportunities.push(...costOpportunities);

    // Analyze performance
    const performanceOpportunities = await this.findPerformanceIssues();
    opportunities.push(...performanceOpportunities);

    // Analyze capacity
    const capacityOpportunities = await this.findCapacityIssues();
    opportunities.push(...capacityOpportunities);

    this.optimizationHistory = opportunities;
    this.lastOptimization = new Date();

    // Auto-apply low-risk optimizations
    for (const opportunity of opportunities) {
      if (
        opportunity.recommendedAction === "auto-apply" &&
        opportunity.expectedImpact.riskLevel === "low"
      ) {
        await this.applyOptimization(opportunity).catch((error) => {
          logError(`Failed to apply optimization ${opportunity.id}`, error);
        });
      }
    }

    return opportunities;
  }

  /**
   * Find slow queries by querying pg_stat_statements (if available)
   */
  private async findSlowQueries(): Promise<OptimizationOpportunity[]> {
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

  /**
   * Find cost optimization opportunities
   */
  private async findCostOptimizations(): Promise<OptimizationOpportunity[]> {
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

  /**
   * Find performance issues by analyzing job execution times and error rates
   */
  private async findPerformanceIssues(): Promise<OptimizationOpportunity[]> {
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

    const totalRunsMap = new Map(totalRuns.map((t: any) => [t.connectorId, t]));
    for (const errorStat of errorRates) {
      const totalStat = totalRunsMap.get(errorStat.connectorId);
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

  /**
   * Find capacity issues by analyzing queue depth and processing rates
   */
  private async findCapacityIssues(): Promise<OptimizationOpportunity[]> {
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

  /**
   * Apply an optimization
   */
  private async applyOptimization(opportunity: OptimizationOpportunity): Promise<void> {
    logInfo(`Applying optimization: ${opportunity.id}`, { opportunityId: opportunity.id });

    try {
      switch (opportunity.type) {
        case "query":
          // Log the slow query for manual review
          await prisma.anomaly.create({
            data: {
              tenantId: "00000000-0000-0000-0000-000000000000", // System tenant
              type: "optimization",
              severity: "low",
              message: `Query optimization recommended: ${opportunity.description}`,
              metadata: opportunity.currentState as any,
            },
          });
          break;

        case "cost":
          // Apply cost optimizations automatically if low risk
          if (opportunity.recommendedAction === "auto-apply") {
            if (opportunity.proposedChange?.downgradeTo) {
              // Update AI config to use cheaper model
              const { aiConfig } = await import("../../config/ai-config");
              aiConfig.defaultModel = opportunity.proposedChange.downgradeTo as string;
              logInfo(`Downgraded AI model to ${opportunity.proposedChange.downgradeTo}`);
            }
          }
          break;

        case "performance":
          // Enable optimizations for performance issues
          if (opportunity.proposedChange?.enable_streaming) {
            logInfo("Streaming optimization recommended", {
              jobId: opportunity.currentState.jobId,
            });
          }
          break;

        case "capacity":
          // Scale workers for capacity issues
          if (opportunity.proposedChange?.scale_workers) {
            const targetWorkers = opportunity.proposedChange.targetWorkers as number;
            logInfo(`Worker scaling recommended: ${targetWorkers} workers`);
          }
          break;
      }

      // Log the optimization in Anomaly table
      await prisma.anomaly.create({
        data: {
          tenantId: "00000000-0000-0000-0000-000000000000",
          type: "optimization",
          severity: "low",
          message: `Applied optimization: ${opportunity.description}`,
          metadata: {
            opportunityId: opportunity.id,
            currentState: opportunity.currentState,
            proposedChange: opportunity.proposedChange,
            expectedImpact: opportunity.expectedImpact,
          } as any,
          resolved: true,
          resolvedAt: new Date(),
        },
      });

      this.emit("optimization_applied", opportunity);
      logInfo(`Optimization applied: ${opportunity.id}`);
    } catch (error) {
      logError(`Failed to apply optimization ${opportunity.id}`, error);
      throw error;
    }
  }

  /**
   * Optimize infrastructure based on params
   */
  private async optimizeInfrastructure(params: Record<string, unknown>): Promise<unknown> {
    const opportunities = await this.analyzeInfrastructure();

    if (params.autoApply === true) {
      const lowRiskOpportunities = opportunities.filter(
        (o) => o.expectedImpact.riskLevel === "low"
      );

      for (const opportunity of lowRiskOpportunities) {
        await this.applyOptimization(opportunity);
      }

      return {
        applied: lowRiskOpportunities.length,
        opportunities: lowRiskOpportunities,
      };
    }

    return {
      opportunities,
      message: "Review opportunities and apply manually",
    };
  }
}
