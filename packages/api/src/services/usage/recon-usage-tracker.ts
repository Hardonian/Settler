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
  metadata?: Record<string, unknown>;
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
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.trackUsage({
      tenantId,
      billingAccountId,
      eventType: 'recon_comparison',
      quantity: comparisonCount,
      unit: 'comparison',
      ...(metadata !== undefined && { metadata }),
    });
  }

  /**
   * Track validation usage
   */
  async trackValidation(
    tenantId: string,
    billingAccountId: string,
    validationCount: number,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.trackUsage({
      tenantId,
      billingAccountId,
      eventType: 'validation',
      quantity: validationCount,
      unit: 'validation',
      ...(metadata !== undefined && { metadata }),
    });
  }

  /**
   * Track transformation usage
   */
  async trackTransformation(
    tenantId: string,
    billingAccountId: string,
    transformationCount: number,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.trackUsage({
      tenantId,
      billingAccountId,
      eventType: 'transformation',
      quantity: transformationCount,
      unit: 'transformation',
      ...(metadata !== undefined && { metadata }),
    });
  }

  /**
   * Track mapping usage
   */
  async trackMapping(
    tenantId: string,
    billingAccountId: string,
    mappingCount: number,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.trackUsage({
      tenantId,
      billingAccountId,
      eventType: 'mapping',
      quantity: mappingCount,
      unit: 'mapping',
      ...(metadata !== undefined && { metadata }),
    });
  }

  /**
   * Track workflow chain step usage
   */
  async trackWorkflowStep(
    tenantId: string,
    billingAccountId: string,
    stepCount: number,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.trackUsage({
      tenantId,
      billingAccountId,
      eventType: 'workflow_step',
      quantity: stepCount,
      unit: 'step',
      ...(metadata !== undefined && { metadata }),
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
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.trackUsage({
      tenantId,
      billingAccountId,
      eventType: 'ai_tokens',
      quantity: tokenCount,
      unit: 'token',
      metadata: {
        ...(metadata !== undefined ? metadata : {}),
        ...(model !== undefined && { model }),
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
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.trackUsage({
      tenantId,
      billingAccountId,
      eventType: 'audit_report',
      quantity: reportCount,
      unit: 'report',
      ...(metadata !== undefined && { metadata }),
    });
  }

  /**
   * Track storage usage
   */
  async trackStorage(
    tenantId: string,
    billingAccountId: string,
    bytes: number,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.trackUsage({
      tenantId,
      billingAccountId,
      eventType: 'storage',
      quantity: bytes,
      unit: 'byte',
      ...(metadata !== undefined && { metadata }),
    });
  }

  /**
   * Track webhook trigger
   */
  async trackWebhookTrigger(
    tenantId: string,
    billingAccountId: string,
    webhookCount: number,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.trackUsage({
      tenantId,
      billingAccountId,
      eventType: 'webhook_trigger',
      quantity: webhookCount,
      unit: 'webhook',
      ...(metadata !== undefined && { metadata }),
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
      const eventType = event.eventType;
      if (!summary[eventType]) {
        summary[eventType] = {
          quantity: 0,
          unit: event.unit || 'unit',
        };
      }
      // TypeScript now knows summary[eventType] is defined after the check
      const summaryEntry = summary[eventType];
      if (summaryEntry) {
        summaryEntry.quantity += Number(event.quantity);
      }
    }

    return summary;
  }
}
