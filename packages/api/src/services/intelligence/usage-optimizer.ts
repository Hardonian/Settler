/**
 * Usage Optimization AI
 * 
 * Analyzes usage patterns and optimizes costs
 * Part of Phase VII: Platform Intelligence
 */

import { PrismaClient } from '@prisma/client';
import { logInfo } from '../../utils/logger';
import { AIRouter } from '../ai-mesh/ai-router';

export interface UsageOptimization {
  recommendation: string;
  estimatedSavings: number;
  confidence: number;
  action: 'switch_model' | 'adjust_quota' | 'optimize_schedule' | 'cache_results';
}

export class UsageOptimizer {
  private prisma: PrismaClient;
  private router: AIRouter;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.router = new AIRouter();
  }

  /**
   * Analyze usage and generate optimizations
   */
  async analyzeUsage(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<UsageOptimization[]> {
    const optimizations: UsageOptimization[] = [];

    // Get usage events
    const usageEvents = await this.prisma.usageEvent.findMany({
      where: {
        tenantId,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Analyze AI token usage
    const aiUsage = usageEvents.filter(e => e.eventType === 'ai_tokens');
    const totalTokens = aiUsage.reduce((sum, e) => sum + Number(e.quantity), 0);
    const avgCost = aiUsage.reduce((sum, e) => {
      const model = e.metadata?.['model'] as string;
      if (model) {
        const config = this.router.getModelConfig(model as any);
        return sum + this.router.estimateCost(model as any, Number(e.quantity));
      }
      return sum;
    }, 0) / aiUsage.length;

    // Recommend cheaper model if accuracy allows
    if (avgCost > 0.01 && totalTokens > 100000) {
      optimizations.push({
        recommendation: 'Consider switching to gpt-3.5-turbo for non-critical tasks',
        estimatedSavings: avgCost * totalTokens * 0.5,
        confidence: 0.8,
        action: 'switch_model',
      });
    }

    // Analyze reconciliation patterns
    const reconUsage = usageEvents.filter(e => e.eventType === 'recon_comparison');
    const peakHours = this.identifyPeakHours(reconUsage);

    if (peakHours.length > 0) {
      optimizations.push({
        recommendation: `Schedule reconciliations during off-peak hours (${peakHours.join(', ')})`,
        estimatedSavings: 0, // Would need pricing data
        confidence: 0.7,
        action: 'optimize_schedule',
      });
    }

    logInfo('Usage optimization analysis completed', { tenantId, optimizations: optimizations.length });
    return optimizations;
  }

  /**
   * Identify peak usage hours
   */
  private identifyPeakHours(usageEvents: any[]): string[] {
    const hourCounts = new Map<number, number>();

    for (const event of usageEvents) {
      const hour = new Date(event.timestamp).getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    }

    const sorted = Array.from(hourCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => `${hour}:00`);

    return sorted;
  }
}
