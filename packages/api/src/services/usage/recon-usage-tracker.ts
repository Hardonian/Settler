/**
 * Recon Usage Tracker
 * 
 * Tracks metered usage for reconciliation operations
 * Part of Phase II: Billing Expansion
 */

import { PrismaClient } from '@prisma/client';
import { logError } from '../../utils/logger';

export interface UsageEvent {
  tenantId: string;
  billingAccountId: string;
  eventType: string;
  quantity: number;
  unit: string;
  metadata?: Record<string, any>;
}

export class ReconUsageTracker {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Track reconciliation comparison usage
   */
  async trackReconComparison(
    tenantId: string,
    billingAccountId: string,
    comparisonCount: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.trackUsage({
      tenantId,
      billingAccountId,
      eventType: 'recon_comparison',
      quantity: comparisonCount,
      unit: 'comparison',
      metadata,
    });
  }

  /**
   * Track validation usage
   */
  async trackValidation(
    tenantId: string,
    billingAccountId: string,
    validationCount: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.trackUsage({
      tenantId,
      billingAccountId,
      eventType: 'validation',
      quantity: validationCount,
      unit: 'validation',
      metadata,
    });
  }

  /**
   * Track transformation usage
   */
  async trackTransformation(
    tenantId: string,
    billingAccountId: string,
    transformationCount: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.trackUsage({
      tenantId,
      billingAccountId,
      eventType: 'transformation',
      quantity: transformationCount,
      unit: 'transformation',
      metadata,
    });
  }

  /**
   * Track mapping usage
   */
  async trackMapping(
    tenantId: string,
    billingAccountId: string,
    mappingCount: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.trackUsage({
      tenantId,
      billingAccountId,
      eventType: 'mapping',
      quantity: mappingCount,
      unit: 'mapping',
      metadata,
    });
  }

  /**
   * Track workflow chain step usage
   */
  async trackWorkflowStep(
    tenantId: string,
    billingAccountId: string,
    stepCount: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.trackUsage({
      tenantId,
      billingAccountId,
      eventType: 'workflow_step',
      quantity: stepCount,
      unit: 'step',
      metadata,
    });
  }

  /**
   * Track AI token usage
   */
  async trackAITokens(
    tenantId: string,
    billingAccountId: string,
    tokenCount: number,
    model?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.trackUsage({
      tenantId,
      billingAccountId,
      eventType: 'ai_tokens',
      quantity: tokenCount,
      unit: 'token',
      metadata: {
        ...metadata,
        model,
      },
    });
  }

  /**
   * Track audit report generation
   */
  async trackAuditReport(
    tenantId: string,
    billingAccountId: string,
    reportCount: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.trackUsage({
      tenantId,
      billingAccountId,
      eventType: 'audit_report',
      quantity: reportCount,
      unit: 'report',
      metadata,
    });
  }

  /**
   * Track storage usage
   */
  async trackStorage(
    tenantId: string,
    billingAccountId: string,
    bytes: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.trackUsage({
      tenantId,
      billingAccountId,
      eventType: 'storage',
      quantity: bytes,
      unit: 'byte',
      metadata,
    });
  }

  /**
   * Track webhook trigger
   */
  async trackWebhookTrigger(
    tenantId: string,
    billingAccountId: string,
    webhookCount: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.trackUsage({
      tenantId,
      billingAccountId,
      eventType: 'webhook_trigger',
      quantity: webhookCount,
      unit: 'webhook',
      metadata,
    });
  }

  /**
   * Core usage tracking method
   */
  private async trackUsage(event: UsageEvent): Promise<void> {
    try {
      await this.prisma.usageEvent.create({
        data: {
          billingAccountId: event.billingAccountId,
          tenantId: event.tenantId,
          eventType: event.eventType,
          quantity: event.quantity,
          unit: event.unit,
          metadata: event.metadata || {},
          timestamp: new Date(),
        },
      });
    } catch (error) {
      logError('Failed to track usage', { error, event });
      // Don't throw - usage tracking failures shouldn't break the main flow
    }
  }

  /**
   * Get usage summary for a billing account
   */
  async getUsageSummary(
    billingAccountId: string,
    startDate: Date,
    endDate: Date
  ) {
    const events = await this.prisma.usageEvent.findMany({
      where: {
        billingAccountId,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
        aggregated: false,
      },
    });

    const summary: Record<string, { quantity: number; unit: string }> = {};

    for (const event of events) {
      if (!summary[event.eventType]) {
        summary[event.eventType] = {
          quantity: 0,
          unit: event.unit || 'unit',
        };
      }
      summary[event.eventType].quantity += Number(event.quantity);
    }

    return summary;
  }
}
