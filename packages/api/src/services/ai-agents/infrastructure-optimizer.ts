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
import { OptimizationOpportunity } from "./infrastructure-optimizer/types";
import { analyzeQueries } from "./infrastructure-optimizer/query-analyzer";
import { analyzeCosts } from "./infrastructure-optimizer/cost-analyzer";
import { analyzePerformance } from "./infrastructure-optimizer/performance-analyzer";
import { analyzeCapacity } from "./infrastructure-optimizer/capacity-analyzer";

export { OptimizationOpportunity };

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
    const slowQueries = await analyzeQueries();
    opportunities.push(...slowQueries);

    // Analyze costs
    const costOpportunities = await analyzeCosts();
    opportunities.push(...costOpportunities);

    // Analyze performance
    const performanceOpportunities = await analyzePerformance();
    opportunities.push(...performanceOpportunities);

    // Analyze capacity
    const capacityOpportunities = await analyzeCapacity();
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
