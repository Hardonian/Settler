/**
 * Health Optimization AI
 * 
 * Detects recurrent failures and proposes improvements
 * Part of Phase VII: Platform Intelligence
 */

import { PrismaClient } from '@prisma/client';
import { logInfo } from '../../utils/logger';

export interface HealthRecommendation {
  type: 'template_suggestion' | 'workflow_improvement' | 'mapping_fix' | 'validation_rule';
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  action: Record<string, unknown>;
}

export class HealthOptimizer {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Analyze health and generate recommendations
   */
  async analyzeHealth(tenantId: string): Promise<HealthRecommendation[]> {
    const recommendations: HealthRecommendation[] = [];

    // Analyze failed jobs
    const failedJobs = await this.prisma.reconResult.findMany({
      where: {
        tenantId,
        status: 'failed',
        startedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      include: {
        reconJob: true,
      },
    });

    // Group by error type
    const errorPatterns = new Map<string, number>();
    for (const job of failedJobs) {
      const error = job.errorMessage || 'unknown';
      errorPatterns.set(error, (errorPatterns.get(error) || 0) + 1);
    }

    // Suggest templates for common patterns
    for (const [error, count] of errorPatterns.entries()) {
      if (count > 5) {
        recommendations.push({
          type: 'template_suggestion',
          description: `Common error pattern detected: ${error.substring(0, 50)}...`,
          confidence: 0.8,
          impact: 'high',
          action: {
            createTemplate: true,
            errorPattern: error,
            frequency: count,
          },
        });
      }
    }

    // Analyze schema drifts
    const drifts = await this.prisma.driftEvent.findMany({
      where: {
        tenantId,
        acknowledged: false,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
    });

    // Group by field path
    const driftPatterns = new Map<string, number>();
    for (const drift of drifts) {
      const field = drift.fieldPath || 'unknown';
      driftPatterns.set(field, (driftPatterns.get(field) || 0) + 1);
    }

    // Suggest mapping fixes
    for (const [field, count] of driftPatterns.entries()) {
      if (count > 3) {
        recommendations.push({
          type: 'mapping_fix',
          description: `Frequent drift detected in field: ${field}`,
          confidence: 0.9,
          impact: 'medium',
          action: {
            fieldPath: field,
            frequency: count,
            suggestMappingUpdate: true,
          },
        });
      }
    }

    logInfo('Health optimization analysis completed', { tenantId, recommendations: recommendations.length });
    return recommendations;
  }
}
