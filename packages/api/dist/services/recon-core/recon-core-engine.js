"use strict";
/**
 * Recon Core Engine
 *
 * Unified, deterministic reconciliation engine serving as the philosophical
 * and architectural core of Settler.dev's Data Operations OS.
 *
 * This engine orchestrates:
 * - Ingestion → Transform → Validate → Recon → Map → Audit → Report
 *
 * Part of Phase I: Platform Audit + Recon Core Foundation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReconCoreEngine = void 0;
const logger_1 = require("../../utils/logger");
const webhook_service_1 = require("../webhooks/webhook-service");
const recon_usage_tracker_1 = require("../usage/recon-usage-tracker");
const event_bus_1 = require("../events/event-bus");
class ReconCoreEngine {
    prisma;
    webhookService;
    usageTracker;
    constructor(prisma) {
        this.prisma = prisma;
        this.webhookService = new webhook_service_1.WebhookService(prisma);
        this.usageTracker = new recon_usage_tracker_1.ReconUsageTracker(prisma);
    }
    /**
     * Create a new reconciliation job
     */
    async createReconJob(tenantId, userId, input) {
        try {
            const reconJob = await this.prisma.reconJob.create({
                data: {
                    tenantId,
                    userId,
                    name: input.name,
                    description: input.description,
                    templateId: input.templateId,
                    sourceAdapter: input.sourceAdapter,
                    sourceConfigEncrypted: input.sourceConfigEncrypted,
                    targetAdapter: input.targetAdapter,
                    targetConfigEncrypted: input.targetConfigEncrypted,
                    mappingTemplateId: input.mappingTemplateId,
                    transformRecipeId: input.transformRecipeId,
                    validationRules: input.validationRules || [],
                    reconStrategy: input.reconStrategy || 'deterministic',
                    scheduleCron: input.scheduleCron,
                    scheduleTimezone: input.scheduleTimezone || 'UTC',
                    status: 'active',
                    metadata: input.metadata || {},
                },
            });
            // Log audit event
            await this.logAudit({
                tenantId,
                userId,
                reconJobId: reconJob.id,
                auditType: 'job_created',
                action: 'create',
                entityType: 'recon_job',
                entityId: reconJob.id,
                afterState: reconJob,
            });
            return reconJob;
        }
        catch (error) {
            (0, logger_1.logError)('Failed to create recon job', { error, tenantId, userId, input });
            throw error;
        }
    }
    /**
     * Execute a reconciliation job
     */
    async executeReconJob(reconJobId, tenantId, _options) {
        const startTime = Date.now();
        // Get the recon job
        const reconJob = await this.prisma.reconJob.findFirst({
            where: {
                id: reconJobId,
                tenantId,
                status: 'active',
                deletedAt: null,
            },
        });
        if (!reconJob) {
            throw new Error(`Recon job not found: ${reconJobId}`);
        }
        // Create recon result record
        const reconResult = await this.prisma.reconResult.create({
            data: {
                reconJobId,
                tenantId,
                status: 'running',
                startedAt: new Date(),
            },
        });
        try {
            // Step 1: Ingest data from source and target
            const { sourceData, targetData } = await this.ingestData(reconJob);
            // Step 2: Transform data if transform recipe is specified
            const transformedSource = reconJob.transformRecipeId
                ? await this.transformData(sourceData, reconJob.transformRecipeId, tenantId)
                : sourceData;
            const transformedTarget = reconJob.transformRecipeId
                ? await this.transformData(targetData, reconJob.transformRecipeId, tenantId)
                : targetData;
            // Step 3: Validate data
            const _validationResults = await this.validateData(transformedSource, transformedTarget, reconJob.validationRules || [], tenantId);
            // Reserved for future validation feedback
            void _validationResults;
            // Step 4: Apply mapping if mapping template is specified
            const mappedSource = reconJob.mappingTemplateId
                ? await this.applyMapping(transformedSource, reconJob.mappingTemplateId, tenantId)
                : transformedSource;
            const mappedTarget = reconJob.mappingTemplateId
                ? await this.applyMapping(transformedTarget, reconJob.mappingTemplateId, tenantId)
                : transformedTarget;
            // Step 5: Perform reconciliation
            const reconMatches = await this.performReconciliation(mappedSource, mappedTarget, reconJob.reconStrategy, reconJob);
            // Step 6: Calculate results
            const results = this.calculateResults(reconMatches, mappedSource, mappedTarget);
            // Step 7: Update recon result
            const durationMs = Date.now() - startTime;
            const updatedResult = await this.prisma.reconResult.update({
                where: { id: reconResult.id },
                data: {
                    status: 'completed',
                    completedAt: new Date(),
                    sourceCount: mappedSource.length,
                    targetCount: mappedTarget.length,
                    matchedCount: results.matchedCount,
                    unmatchedSourceCount: results.unmatchedSourceCount,
                    unmatchedTargetCount: results.unmatchedTargetCount,
                    conflictCount: results.conflictCount,
                    totalAmountSource: results.totalAmountSource,
                    totalAmountTarget: results.totalAmountTarget,
                    totalAmountMatched: results.totalAmountMatched,
                    totalAmountUnmatched: results.totalAmountUnmatched,
                    currency: results.currency,
                    confidenceAvg: results.confidenceAvg,
                    confidenceMin: results.confidenceMin,
                    confidenceMax: results.confidenceMax,
                    durationMs: BigInt(durationMs),
                    summary: results.summary,
                },
            });
            // Step 8: Log audit
            await this.logAudit({
                tenantId,
                reconJobId,
                reconResultId: updatedResult.id,
                auditType: 'recon_completed',
                action: 'execute',
                entityType: 'recon_result',
                entityId: updatedResult.id,
                afterState: updatedResult,
            });
            // Step 9: Track usage
            const billingAccount = await this.getBillingAccount(tenantId);
            if (billingAccount) {
                await this.usageTracker.trackReconComparison(tenantId, billingAccount.id, results.matchedCount + results.unmatchedSourceCount + results.unmatchedTargetCount, { reconJobId, reconResultId: updatedResult.id });
            }
            // Step 10: Fire webhook
            await this.webhookService.queueWebhook(tenantId, 'recon.completed', {
                reconJobId,
                reconResultId: updatedResult.id,
                status: 'completed',
                summary: results.summary,
            });
            // Step 11: Emit event
            await event_bus_1.eventBus.emitEvent('recon.completed', tenantId, {
                reconJobId,
                reconResultId: updatedResult.id,
                summary: results.summary,
            });
            return updatedResult;
        }
        catch (error) {
            const durationMs = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const errorStack = error instanceof Error ? error.stack : undefined;
            // Update result with error
            const failedResult = await this.prisma.reconResult.update({
                where: { id: reconResult.id },
                data: {
                    status: 'failed',
                    completedAt: new Date(),
                    durationMs: BigInt(durationMs),
                    errorMessage,
                    errorStack,
                },
            });
            // Log audit
            await this.logAudit({
                tenantId,
                reconJobId,
                reconResultId: failedResult.id,
                auditType: 'recon_failed',
                action: 'execute',
                entityType: 'recon_result',
                entityId: failedResult.id,
                metadata: { error: errorMessage },
            });
            // Fire webhook for failure
            await this.webhookService.queueWebhook(tenantId, 'recon.failed', {
                reconJobId,
                reconResultId: failedResult.id,
                status: 'failed',
                error: errorMessage,
            });
            // Emit event
            await event_bus_1.eventBus.emitEvent('recon.failed', tenantId, {
                reconJobId,
                reconResultId: failedResult.id,
                error: errorMessage,
            });
            (0, logger_1.logError)('Recon job execution failed', { error, reconJobId, tenantId });
            throw error;
        }
    }
    /**
     * Ingest data from source and target adapters
     */
    async ingestData(_reconJob) {
        // TODO: Integrate with adapter system
        // For now, return empty arrays
        // This will be implemented to call the adapter system
        return {
            sourceData: [],
            targetData: [],
        };
    }
    /**
     * Transform data using a transform recipe
     */
    async transformData(data, transformRecipeId, tenantId) {
        const recipe = await this.prisma.transformRecipe.findFirst({
            where: {
                id: transformRecipeId,
                OR: [
                    { tenantId },
                    { isPublic: true, deletedAt: null },
                ],
            },
        });
        if (!recipe) {
            throw new Error(`Transform recipe not found: ${transformRecipeId}`);
        }
        // TODO: Implement transformation logic
        // Apply transformationSteps from recipe
        return data;
    }
    /**
     * Validate data using validation rules
     */
    async validateData(_sourceData, _targetData, _validationRules, _tenantId) {
        // TODO: Implement validation logic
        // Apply validation rules
        return [];
    }
    /**
     * Apply mapping template to data
     */
    async applyMapping(data, mappingTemplateId, tenantId) {
        const template = await this.prisma.mappingTemplate.findFirst({
            where: {
                id: mappingTemplateId,
                OR: [
                    { tenantId },
                    { isPublic: true, deletedAt: null },
                ],
            },
        });
        if (!template) {
            throw new Error(`Mapping template not found: ${mappingTemplateId}`);
        }
        // TODO: Implement mapping logic
        // Apply fieldMappings from template
        return data;
    }
    /**
     * Perform reconciliation matching
     */
    async performReconciliation(_sourceData, _targetData, _strategy, _reconJob) {
        // TODO: Integrate with existing MatchingEngine
        // For now, return empty matches
        return [];
    }
    /**
     * Calculate reconciliation results
     */
    calculateResults(matches, sourceData, targetData) {
        const matchedCount = matches.length;
        const matchedSourceIds = new Set(matches.map(m => m.sourceId));
        const matchedTargetIds = new Set(matches.map(m => m.targetId));
        const unmatchedSourceCount = sourceData.length - matchedSourceIds.size;
        const unmatchedTargetCount = targetData.length - matchedTargetIds.size;
        const conflictCount = matches.filter(m => m.confidence < 0.8).length;
        // Calculate amounts (assuming amount field exists)
        const totalAmountSource = this.calculateTotalAmount(sourceData);
        const totalAmountTarget = this.calculateTotalAmount(targetData);
        const totalAmountMatched = matches.reduce((sum, m) => sum + (m.amount || 0), 0);
        const totalAmountUnmatched = (totalAmountSource || 0) + (totalAmountTarget || 0) - totalAmountMatched;
        // Calculate confidence metrics
        const confidences = matches.map(m => m.confidence).filter(c => c !== null && c !== undefined);
        const confidenceAvg = confidences.length > 0
            ? confidences.reduce((sum, c) => sum + c, 0) / confidences.length
            : null;
        const confidenceMin = confidences.length > 0 ? Math.min(...confidences) : null;
        const confidenceMax = confidences.length > 0 ? Math.max(...confidences) : null;
        // Extract currency from data
        const currency = (sourceData[0]?.currency || targetData[0]?.currency || matches[0]?.currency);
        const currencyValue = currency ? String(currency) : null;
        return {
            matchedCount,
            unmatchedSourceCount,
            unmatchedTargetCount,
            conflictCount,
            totalAmountSource,
            totalAmountTarget,
            totalAmountMatched,
            totalAmountUnmatched,
            currency: currencyValue,
            confidenceAvg,
            confidenceMin,
            confidenceMax,
            summary: {
                totalRecords: sourceData.length + targetData.length,
                matchedRecords: matchedCount,
                unmatchedRecords: unmatchedSourceCount + unmatchedTargetCount,
                confidenceDistribution: {
                    high: matches.filter(m => m.confidence >= 0.9).length,
                    medium: matches.filter(m => m.confidence >= 0.7 && m.confidence < 0.9).length,
                    low: matches.filter(m => m.confidence < 0.7).length,
                },
                amountBreakdown: {
                    matched: totalAmountMatched,
                    unmatched: totalAmountUnmatched,
                    total: totalAmountSource || totalAmountTarget || null,
                },
                ...(currencyValue ? { currency: currencyValue } : {}),
            },
        };
    }
    /**
     * Calculate total amount from data array
     */
    calculateTotalAmount(data) {
        if (data.length === 0)
            return null;
        const amounts = data
            .map((item) => {
            const amount = item.amount ?? item.total ?? item.value;
            return typeof amount === 'number' ? amount : null;
        })
            .filter((amount) => amount !== null);
        if (amounts.length === 0)
            return null;
        return amounts.reduce((sum, amount) => sum + amount, 0);
    }
    /**
     * Log audit event
     */
    async logAudit(params) {
        try {
            await this.prisma.reconAudit.create({
                data: {
                    tenantId: params.tenantId,
                    userId: params.userId,
                    reconJobId: params.reconJobId,
                    reconResultId: params.reconResultId,
                    auditType: params.auditType,
                    action: params.action,
                    entityType: params.entityType,
                    entityId: params.entityId,
                    beforeState: params.beforeState,
                    afterState: params.afterState,
                    changes: params.changes,
                    metadata: params.metadata || {},
                },
            });
        }
        catch (error) {
            (0, logger_1.logError)('Failed to log audit event', { error, params });
            // Don't throw - audit failures shouldn't break the main flow
        }
    }
    /**
     * Get recon job by ID
     */
    async getReconJob(reconJobId, tenantId) {
        return this.prisma.reconJob.findFirst({
            where: {
                id: reconJobId,
                tenantId,
                deletedAt: null,
            },
            include: {
                template: true,
                mappingTemplate: true,
                transformRecipe: true,
            },
        });
    }
    /**
     * List recon jobs for a tenant
     */
    async listReconJobs(tenantId, options) {
        return this.prisma.reconJob.findMany({
            where: {
                tenantId,
                deletedAt: null,
                ...(options?.status && { status: options.status }),
            },
            take: options?.limit || 100,
            skip: options?.offset || 0,
            orderBy: { createdAt: 'desc' },
        });
    }
    /**
     * Get recon result by ID
     */
    async getReconResult(reconResultId, tenantId) {
        return this.prisma.reconResult.findFirst({
            where: {
                id: reconResultId,
                tenantId,
            },
            include: {
                reconJob: true,
            },
        });
    }
    /**
     * List recon results for a job
     */
    async listReconResults(reconJobId, tenantId, options) {
        return this.prisma.reconResult.findMany({
            where: {
                reconJobId,
                tenantId,
            },
            take: options?.limit || 100,
            skip: options?.offset || 0,
            orderBy: { startedAt: 'desc' },
        });
    }
    /**
     * Get billing account for tenant
     */
    async getBillingAccount(tenantId) {
        return this.prisma.billingAccount.findFirst({
            where: {
                tenantId,
                status: 'active',
            },
        });
    }
}
exports.ReconCoreEngine = ReconCoreEngine;
//# sourceMappingURL=recon-core-engine.js.map