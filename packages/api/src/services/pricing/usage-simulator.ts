/**
 * Usage Simulation Engine
 *
 * Analyzes usage patterns and simulates costs
 * Part of Section 9: Pricing Intelligence
 */

import { PrismaClient } from "@prisma/client";
// logInfo imported but unused - may be used in future

export interface UsageSimulation {
  period: "daily" | "weekly" | "monthly";
  reconComparisons: number;
  validations: number;
  transformations: number;
  mappings: number;
  workflowSteps: number;
  aiTokens: number;
  storageBytes: number;
  webhookTriggers: number;
  estimatedCost: number;
}

interface HistoricalUsage {
  reconComparisons: number;
  validations: number;
  transformations: number;
  mappings: number;
  workflowSteps: number;
  aiTokens: number;
  storageBytes: number;
  webhookTriggers: number;
}

export class UsageSimulator {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Simulate usage for a tenant
   */
  async simulateUsage(
    tenantId: string,
    period: "daily" | "weekly" | "monthly" = "monthly"
  ): Promise<UsageSimulation> {
    // Get historical usage
    const historicalUsage = await this.getHistoricalUsage(tenantId, period);

    // Project future usage based on trends
    const projectedUsage = this.projectUsage(historicalUsage, period);

    // Calculate estimated cost
    const estimatedCost = this.calculateCost(projectedUsage);

    return {
      period,
      ...projectedUsage,
      estimatedCost,
    };
  }

  /**
   * Get historical usage
   */
  private async getHistoricalUsage(tenantId: string, period: "daily" | "weekly" | "monthly") {
    const startDate = this.getStartDate(period);

    const usageEvents = await this.prisma.usageEvent.findMany({
      where: {
        tenantId,
        timestamp: {
          gte: startDate,
        },
      },
    });

    const usage = {
      reconComparisons: 0,
      validations: 0,
      transformations: 0,
      mappings: 0,
      workflowSteps: 0,
      aiTokens: 0,
      storageBytes: 0,
      webhookTriggers: 0,
    };

    for (const event of usageEvents) {
      const quantity = Number(event.quantity);

      switch (event.eventType) {
        case "recon_comparison":
          usage.reconComparisons += quantity;
          break;
        case "validation":
          usage.validations += quantity;
          break;
        case "transformation":
          usage.transformations += quantity;
          break;
        case "mapping":
          usage.mappings += quantity;
          break;
        case "workflow_step":
          usage.workflowSteps += quantity;
          break;
        case "ai_tokens":
          usage.aiTokens += quantity;
          break;
        case "storage":
          usage.storageBytes += quantity;
          break;
        case "webhook_trigger":
          usage.webhookTriggers += quantity;
          break;
      }
    }

    return usage;
  }

  /**
   * Project future usage
   */
  private projectUsage(
    historical: HistoricalUsage,
    _period: "daily" | "weekly" | "monthly"
  ): HistoricalUsage {
    // Simple projection: assume 10% growth
    const growthFactor = 1.1;

    return {
      reconComparisons: Math.round(historical.reconComparisons * growthFactor),
      validations: Math.round(historical.validations * growthFactor),
      transformations: Math.round(historical.transformations * growthFactor),
      mappings: Math.round(historical.mappings * growthFactor),
      workflowSteps: Math.round(historical.workflowSteps * growthFactor),
      aiTokens: Math.round(historical.aiTokens * growthFactor),
      storageBytes: Math.round(historical.storageBytes * growthFactor),
      webhookTriggers: Math.round(historical.webhookTriggers * growthFactor),
    };
  }

  /**
   * Calculate cost
   */
  private calculateCost(usage: HistoricalUsage): number {
    const pricing = {
      reconComparison: 0.01 / 1000,
      validation: 0.005 / 1000,
      transformation: 0.01 / 1000,
      mapping: 0.005 / 1000,
      workflowStep: 0.001,
      aiToken: 0.002 / 1000, // Average
      storage: 0.1 / (1024 * 1024 * 1024), // Per GB
      webhook: 0.001,
    };

    return (
      usage.reconComparisons * pricing.reconComparison +
      usage.validations * pricing.validation +
      usage.transformations * pricing.transformation +
      usage.mappings * pricing.mapping +
      usage.workflowSteps * pricing.workflowStep +
      usage.aiTokens * pricing.aiToken +
      usage.storageBytes * pricing.storage +
      usage.webhookTriggers * pricing.webhook
    );
  }

  /**
   * Get start date for period
   */
  private getStartDate(period: "daily" | "weekly" | "monthly"): Date {
    const now = new Date();
    switch (period) {
      case "daily":
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case "weekly":
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case "monthly":
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }
}
