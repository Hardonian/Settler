"use strict";
/**
 * Recon Usage Tracker
 *
 * Tracks metered usage for reconciliation operations
 * Part of Phase II: Billing Expansion
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReconUsageTracker = void 0;
const logger_1 = require("../../utils/logger");
class ReconUsageTracker {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Track reconciliation comparison usage
     */
    async trackReconComparison(tenantId, billingAccountId, comparisonCount, metadata) {
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
    async trackValidation(tenantId, billingAccountId, validationCount, metadata) {
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
    async trackTransformation(tenantId, billingAccountId, transformationCount, metadata) {
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
    async trackMapping(tenantId, billingAccountId, mappingCount, metadata) {
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
    async trackWorkflowStep(tenantId, billingAccountId, stepCount, metadata) {
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
    async trackAITokens(tenantId, billingAccountId, tokenCount, model, metadata) {
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
    async trackAuditReport(tenantId, billingAccountId, reportCount, metadata) {
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
    async trackStorage(tenantId, billingAccountId, bytes, metadata) {
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
    async trackWebhookTrigger(tenantId, billingAccountId, webhookCount, metadata) {
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
    async trackUsage(event) {
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
        }
        catch (error) {
            (0, logger_1.logError)('Failed to track usage', { error, event });
            // Don't throw - usage tracking failures shouldn't break the main flow
        }
    }
    /**
     * Get usage summary for a billing account
     */
    async getUsageSummary(billingAccountId, startDate, endDate) {
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
        const summary = {};
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
exports.ReconUsageTracker = ReconUsageTracker;
//# sourceMappingURL=recon-usage-tracker.js.map