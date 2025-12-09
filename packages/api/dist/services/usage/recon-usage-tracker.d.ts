/**
 * Recon Usage Tracker
 *
 * Tracks metered usage for reconciliation operations
 * Part of Phase II: Billing Expansion
 */
import { PrismaClient } from '@prisma/client';
export interface UsageEvent {
    tenantId: string;
    billingAccountId: string;
    eventType: string;
    quantity: number;
    unit: string;
    metadata?: Record<string, unknown>;
}
export declare class ReconUsageTracker {
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * Track reconciliation comparison usage
     */
    trackReconComparison(tenantId: string, billingAccountId: string, comparisonCount: number, metadata?: Record<string, unknown>): Promise<void>;
    /**
     * Track validation usage
     */
    trackValidation(tenantId: string, billingAccountId: string, validationCount: number, metadata?: Record<string, unknown>): Promise<void>;
    /**
     * Track transformation usage
     */
    trackTransformation(tenantId: string, billingAccountId: string, transformationCount: number, metadata?: Record<string, unknown>): Promise<void>;
    /**
     * Track mapping usage
     */
    trackMapping(tenantId: string, billingAccountId: string, mappingCount: number, metadata?: Record<string, unknown>): Promise<void>;
    /**
     * Track workflow chain step usage
     */
    trackWorkflowStep(tenantId: string, billingAccountId: string, stepCount: number, metadata?: Record<string, unknown>): Promise<void>;
    /**
     * Track AI token usage
     */
    trackAITokens(tenantId: string, billingAccountId: string, tokenCount: number, model?: string, metadata?: Record<string, unknown>): Promise<void>;
    /**
     * Track audit report generation
     */
    trackAuditReport(tenantId: string, billingAccountId: string, reportCount: number, metadata?: Record<string, unknown>): Promise<void>;
    /**
     * Track storage usage
     */
    trackStorage(tenantId: string, billingAccountId: string, bytes: number, metadata?: Record<string, unknown>): Promise<void>;
    /**
     * Track webhook trigger
     */
    trackWebhookTrigger(tenantId: string, billingAccountId: string, webhookCount: number, metadata?: Record<string, unknown>): Promise<void>;
    /**
     * Core usage tracking method
     */
    private trackUsage;
    /**
     * Get usage summary for a billing account
     */
    getUsageSummary(billingAccountId: string, startDate: Date, endDate: Date): Promise<Record<string, {
        quantity: number;
        unit: string;
    }>>;
}
//# sourceMappingURL=recon-usage-tracker.d.ts.map