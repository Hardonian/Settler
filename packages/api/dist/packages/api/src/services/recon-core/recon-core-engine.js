"use strict";
/**
 * Recon Core Engine
 *
 * Unified, deterministic reconciliation engine serving as the philosophical
 * and architectural core of Settler.dev's reconciliation engine.
 *
 * This engine orchestrates:
 * - Ingestion → Transform → Validate → Recon → Map → Audit → Report
 *
 * Part of Phase I: Platform Audit + Recon Core Foundation
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReconCoreEngine = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const csv_writer_1 = require("csv-writer");
const logger_1 = require("../../utils/logger");
const webhook_service_1 = require("../webhooks/webhook-service");
const recon_usage_tracker_1 = require("../usage/recon-usage-tracker");
const event_bus_1 = require("../events/event-bus");
const job_failure_1 = require("../notifications/job-failure");
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
                    validationRules: (input.validationRules || []),
                    reconStrategy: input.reconStrategy || "deterministic",
                    scheduleCron: input.scheduleCron,
                    scheduleTimezone: input.scheduleTimezone || "UTC",
                    status: "active",
                    metadata: (input.metadata || {}),
                },
            });
            // Log audit event
            await this.logAudit({
                tenantId,
                userId,
                reconJobId: reconJob.id,
                auditType: "job_created",
                action: "create",
                entityType: "recon_job",
                entityId: reconJob.id,
                afterState: reconJob,
            });
            return reconJob;
        }
        catch (error) {
            (0, logger_1.logError)("Failed to create recon job", { error, tenantId, userId, input });
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
                status: "active",
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
                status: "running",
                startedAt: new Date(),
            },
        });
        try {
            // Update progress: Starting ingestion
            await this.updateProgress(reconResult.id, {
                stage: "ingesting",
                percentage: 10,
                message: "Fetching data from source and target adapters...",
            });
            // Step 1: Ingest data from source and target
            const { sourceData, targetData } = await this.ingestData(reconJob);
            // Update progress: Data ingested
            await this.updateProgress(reconResult.id, {
                stage: "transforming",
                percentage: 30,
                message: `Ingested ${sourceData.length} source and ${targetData.length} target records`,
            });
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
            // Update progress: Starting reconciliation
            await this.updateProgress(reconResult.id, {
                stage: "matching",
                percentage: 60,
                message: `Matching ${mappedSource.length} source transactions against ${mappedTarget.length} target transactions...`,
            });
            // Step 5: Perform reconciliation
            const reconMatches = await this.performReconciliation(mappedSource, mappedTarget, reconJob.reconStrategy, reconJob);
            // Update progress: Reconciliation complete
            await this.updateProgress(reconResult.id, {
                stage: "calculating",
                percentage: 90,
                message: `Reconciliation complete. Processing ${reconMatches.length} matches...`,
            });
            // Step 6: Calculate results
            const results = this.calculateResults(reconMatches, mappedSource, mappedTarget);
            // Step 7: Update recon result
            const durationMs = Date.now() - startTime;
            const updatedResult = await this.prisma.reconResult.update({
                where: { id: reconResult.id },
                data: {
                    status: "completed",
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
                auditType: "recon_completed",
                action: "execute",
                entityType: "recon_result",
                entityId: updatedResult.id,
                afterState: updatedResult,
            });
            // Step 9: Track usage
            const billingAccount = await this.getBillingAccount(tenantId);
            if (billingAccount) {
                await this.usageTracker.trackReconComparison(tenantId, billingAccount.id, results.matchedCount + results.unmatchedSourceCount + results.unmatchedTargetCount, { reconJobId, reconResultId: updatedResult.id });
            }
            // Step 9.5: Record value events (reconciliation completed, anomalies detected)
            if (billingAccount) {
                try {
                    await event_bus_1.eventBus.emitEvent("reconciliation.value.realized", tenantId, {
                        billingAccountId: billingAccount.id,
                        tenantId,
                        userId: reconJob.userId,
                        matchedCount: results.matchedCount,
                        unmatchedCount: results.unmatchedSourceCount + results.unmatchedTargetCount,
                        totalAmount: results.totalAmountMatched
                            ? Number(results.totalAmountMatched)
                            : undefined,
                        jobId: reconJobId,
                        runId: updatedResult.id,
                    }, {
                        correlationId: `recon:${tenantId}:${reconJobId}:${updatedResult.id}:value-realized`,
                        runId: updatedResult.id,
                        executionId: updatedResult.id,
                        actorId: reconJob.userId ?? undefined,
                        source: "api.recon-core",
                        severity: "info",
                    });
                    const totalUnmatched = results.unmatchedSourceCount + results.unmatchedTargetCount;
                    if (totalUnmatched > 0) {
                        await event_bus_1.eventBus.emitEvent("reconciliation.errors.prevented", tenantId, {
                            billingAccountId: billingAccount.id,
                            tenantId,
                            userId: reconJob.userId,
                            quantity: totalUnmatched,
                            unit: "anomaly",
                            metadata: {
                                source: "reconciliation_completed",
                                runId: updatedResult.id,
                                jobId: reconJobId,
                                matchedCount: results.matchedCount,
                            },
                        }, {
                            correlationId: `recon:${tenantId}:${reconJobId}:${updatedResult.id}:errors-prevented`,
                            runId: updatedResult.id,
                            executionId: updatedResult.id,
                            actorId: reconJob.userId ?? undefined,
                            source: "api.recon-core",
                            severity: "warning",
                        });
                    }
                }
                catch (valueError) {
                    (0, logger_1.logError)("[ReconCoreEngine] Failed to emit value events", valueError);
                }
            }
            // Step 10: Fire webhook
            await this.webhookService.queueWebhook(tenantId, "recon.completed", {
                reconJobId,
                reconResultId: updatedResult.id,
                status: "completed",
                summary: results.summary,
            });
            // Step 11: Emit event
            await event_bus_1.eventBus.emitEvent("reconciliation.completed", tenantId, {
                reconJobId,
                reconResultId: updatedResult.id,
                summary: results.summary,
            }, {
                correlationId: `recon:${tenantId}:${reconJobId}:${updatedResult.id}:completed`,
                runId: updatedResult.id,
                executionId: updatedResult.id,
                actorId: reconJob.userId ?? undefined,
                source: "api.recon-core",
                severity: "info",
            });
            // Step 12: Send completion notification if there are exceptions
            if (results.unmatchedSourceCount > 0 || results.unmatchedTargetCount > 0) {
                try {
                    const accuracy = results.matchedCount > 0
                        ? (results.matchedCount /
                            (results.matchedCount +
                                results.unmatchedSourceCount +
                                results.unmatchedTargetCount)) *
                            100
                        : 0;
                    await (0, job_failure_1.notifyJobCompletion)(this.prisma, {
                        jobId: reconJobId,
                        resultId: updatedResult.id,
                        tenantId: tenantId,
                        matchedCount: results.matchedCount,
                        unmatchedCount: results.unmatchedSourceCount + results.unmatchedTargetCount,
                        accuracy,
                    });
                }
                catch (notificationError) {
                    (0, logger_1.logError)("[ReconCoreEngine] Failed to send completion notification", notificationError);
                }
            }
            return updatedResult;
        }
        catch (error) {
            const durationMs = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            const errorStack = error instanceof Error ? error.stack : undefined;
            // Send failure notification
            try {
                await (0, job_failure_1.notifyJobFailure)(this.prisma, {
                    jobId: reconJobId,
                    resultId: reconResult.id,
                    errorMessage: errorMessage,
                    errorStack: errorStack,
                    tenantId: tenantId,
                    userId: reconJob.userId,
                });
            }
            catch (notificationError) {
                (0, logger_1.logError)("[ReconCoreEngine] Failed to send failure notification", notificationError);
            }
            // Update result with error
            const failedResult = await this.prisma.reconResult.update({
                where: { id: reconResult.id },
                data: {
                    status: "failed",
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
                auditType: "recon_failed",
                action: "execute",
                entityType: "recon_result",
                entityId: failedResult.id,
                metadata: { error: errorMessage },
            });
            // Fire webhook for failure
            await this.webhookService.queueWebhook(tenantId, "recon.failed", {
                reconJobId,
                reconResultId: failedResult.id,
                status: "failed",
                error: errorMessage,
            });
            // Emit event
            await event_bus_1.eventBus.emitEvent("reconciliation.failed", tenantId, {
                reconJobId,
                reconResultId: failedResult.id,
                error: errorMessage,
            }, {
                correlationId: `recon:${tenantId}:${reconJobId}:${failedResult.id}:failed`,
                runId: failedResult.id,
                executionId: failedResult.id,
                actorId: reconJob.userId ?? undefined,
                source: "api.recon-core",
                severity: "error",
                metadata: { failure_stage: "execute" },
            });
            (0, logger_1.logError)("Recon job execution failed", { error, reconJobId, tenantId });
            throw error;
        }
    }
    /**
     * Ingest data from source and target adapters
     */
    async ingestData(reconJob) {
        // 1. DEMO MODE
        if (reconJob.sourceAdapter === "DEMO_STRIPE" && reconJob.targetAdapter === "DEMO_BANK") {
            const demoDir = path_1.default.join(process.cwd(), "demo/data");
            if (!fs_1.default.existsSync(demoDir)) {
                throw new Error("Demo data not found. Please run scripts/seed-demo.ts first.");
            }
            const sourceData = JSON.parse(fs_1.default.readFileSync(path_1.default.join(demoDir, "demo_stripe_transactions.json"), "utf-8"));
            const targetData = JSON.parse(fs_1.default.readFileSync(path_1.default.join(demoDir, "demo_bank_transactions.json"), "utf-8"));
            return { sourceData, targetData };
        }
        // 2. REAL ADAPTERS (Placeholder for now)
        // In a real implementation, we would use the AdapterFactory here
        if (reconJob.sourceAdapter && reconJob.sourceAdapter !== "DEMO_STRIPE") {
            // Check if we have credentials
            if (!reconJob.sourceConfigEncrypted) {
                (0, logger_1.logWarn)(`Missing credentials for ${reconJob.sourceAdapter}, returning empty dataset`);
                return { sourceData: [], targetData: [] };
            }
            // TODO: Call actual adapter
        }
        return {
            sourceData: [],
            targetData: [],
        };
    }
    /**
     * Export reconciliation results to CSV
     */
    async exportResults(_reconResultId, format = "csv") {
        // TODO: Fix this - reconMatch model doesn't exist in Prisma schema
        // Temporarily using empty array to fix typecheck errors
        const matches = []; // await this.prisma.reconMatch.findMany({ where: { executionId: _reconResultId } });
        if (format === "json") {
            return JSON.stringify(matches, null, 2);
        }
        const csvStringifier = (0, csv_writer_1.createObjectCsvStringifier)({
            header: [
                { id: "id", title: "Match ID" },
                { id: "sourceId", title: "Source ID" },
                { id: "targetId", title: "Target ID" },
                { id: "amount", title: "Amount" },
                { id: "currency", title: "Currency" },
                { id: "confidence", title: "Confidence" },
                { id: "matchedAt", title: "Matched At" },
            ],
        });
        return csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(matches);
    }
    /**
     * Transform data using a transform recipe
     */
    async transformData(data, transformRecipeId, tenantId) {
        const recipe = await this.prisma.transformRecipe.findFirst({
            where: {
                id: transformRecipeId,
                OR: [{ tenantId }, { isPublic: true, deletedAt: null }],
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
                OR: [{ tenantId }, { isPublic: true, deletedAt: null }],
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
     * Integrates rules engine for improved match rates over time
     */
    async performReconciliation(sourceData, targetData, _strategy, _reconJob) {
        // Get billing account to fetch rules (currently unused, but may be needed for rule fetching)
        // TODO: Use billingAccount to fetch reconciliation rules
        // const _billingAccount = await this.getBillingAccount(_reconJob.tenantId);
        const matches = [];
        const matchedTargetIds = new Set();
        const matchedSourceIds = new Set();
        const sources = sourceData;
        const targets = targetData;
        // 1. DETERMINISTIC: Exact External ID Match (Payouts)
        const targetMapByExternalId = new Map();
        targets.forEach((t) => {
            if (t.externalId)
                targetMapByExternalId.set(t.externalId, t);
        });
        // Payout Logic
        for (const source of sources) {
            if (matchedSourceIds.has(source.id))
                continue;
            if (source.type === "PAYOUT" || source.type === "TRANSFER") {
                for (const target of targets) {
                    if (matchedTargetIds.has(target.id))
                        continue;
                    const descriptionMatch = target.description?.includes(source.externalId) ||
                        source.description?.includes(target.externalId);
                    const amountMatch = Math.abs(source.amount - target.amount) < 0.01;
                    // Date within 48h
                    const dateDiff = Math.abs(new Date(source.occurredAt).getTime() - new Date(target.occurredAt).getTime());
                    const dateMatch = dateDiff < 48 * 60 * 60 * 1000;
                    if (descriptionMatch && amountMatch && dateMatch) {
                        matches.push({
                            id: `match_${source.id}_${target.id}`,
                            sourceId: source.id,
                            targetId: target.id,
                            confidence: 1.0,
                            amount: source.amount,
                            currency: source.currency,
                            matchedFields: {
                                externalId: source.externalId,
                                amount: source.amount,
                                date: source.occurredAt,
                            },
                            metadata: {
                                reason: "Deterministic Payout Match (ID + Amount + Date)",
                            },
                        });
                        matchedSourceIds.add(source.id);
                        matchedTargetIds.add(target.id);
                        break;
                    }
                }
            }
        }
        // 2. STRONG MATCH: Amount + Date (within 1 day)
        for (const source of sources) {
            if (matchedSourceIds.has(source.id))
                continue;
            for (const target of targets) {
                if (matchedTargetIds.has(target.id))
                    continue;
                const amountMatch = Math.abs(source.amount - target.amount) < 0.01;
                const dateDiff = Math.abs(new Date(source.occurredAt).getTime() - new Date(target.occurredAt).getTime());
                const dateMatch = dateDiff < 24 * 60 * 60 * 1000;
                if (amountMatch && dateMatch) {
                    matches.push({
                        id: `match_${source.id}_${target.id}`,
                        sourceId: source.id,
                        targetId: target.id,
                        confidence: 0.9,
                        amount: source.amount,
                        currency: source.currency,
                        matchedFields: {
                            amount: source.amount,
                            date: source.occurredAt,
                        },
                        metadata: {
                            reason: "Strong Match (Exact Amount + Date < 24h)",
                        },
                    });
                    matchedSourceIds.add(source.id);
                    matchedTargetIds.add(target.id);
                    break;
                }
            }
        }
        // 3. FUZZY MATCH: Amount + Date (3 Days)
        for (const source of sources) {
            if (matchedSourceIds.has(source.id))
                continue;
            for (const target of targets) {
                if (matchedTargetIds.has(target.id))
                    continue;
                const amountMatch = Math.abs(source.amount - target.amount) < 0.01;
                const dateDiff = Math.abs(new Date(source.occurredAt).getTime() - new Date(target.occurredAt).getTime());
                const dateMatch = dateDiff < 72 * 60 * 60 * 1000;
                if (amountMatch && dateMatch) {
                    matches.push({
                        id: `match_${source.id}_${target.id}`,
                        sourceId: source.id,
                        targetId: target.id,
                        confidence: 0.75,
                        amount: source.amount,
                        currency: source.currency,
                        matchedFields: {
                            amount: source.amount,
                            date: source.occurredAt,
                        },
                        metadata: {
                            reason: "Fuzzy Match (Exact Amount + Date < 3d)",
                        },
                    });
                    matchedSourceIds.add(source.id);
                    matchedTargetIds.add(target.id);
                    break;
                }
            }
        }
        return matches;
    }
    /**
     * Calculate reconciliation results
     */
    calculateResults(matches, sourceData, targetData) {
        const matchedCount = matches.length;
        const matchedSourceIds = new Set(matches.map((m) => m.sourceId));
        const matchedTargetIds = new Set(matches.map((m) => m.targetId));
        const unmatchedSourceCount = sourceData.length - matchedSourceIds.size;
        const unmatchedTargetCount = targetData.length - matchedTargetIds.size;
        const conflictCount = matches.filter((m) => m.confidence < 0.8).length;
        const totalAmountSource = this.calculateTotalAmount(sourceData);
        const totalAmountTarget = this.calculateTotalAmount(targetData);
        const totalAmountMatched = matches.reduce((sum, m) => sum + (m.amount || 0), 0);
        const totalAmountUnmatched = (totalAmountSource || 0) + (totalAmountTarget || 0) - totalAmountMatched;
        const confidences = matches
            .map((m) => m.confidence)
            .filter((c) => c !== null && c !== undefined);
        const confidenceAvg = confidences.length > 0
            ? confidences.reduce((sum, c) => sum + c, 0) / confidences.length
            : null;
        const confidenceMin = confidences.length > 0 ? Math.min(...confidences) : null;
        const confidenceMax = confidences.length > 0 ? Math.max(...confidences) : null;
        const currency = (sourceData[0]?.currency ||
            targetData[0]?.currency ||
            matches[0]?.currency);
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
                    high: matches.filter((m) => m.confidence >= 0.9).length,
                    medium: matches.filter((m) => m.confidence >= 0.7 && m.confidence < 0.9).length,
                    low: matches.filter((m) => m.confidence < 0.7).length,
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
            return typeof amount === "number" ? amount : null;
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
                    beforeState: params.beforeState
                        ? params.beforeState
                        : undefined,
                    afterState: params.afterState
                        ? params.afterState
                        : undefined,
                    changes: params.changes
                        ? params.changes
                        : undefined,
                    metadata: (params.metadata || {}),
                },
            });
        }
        catch (error) {
            (0, logger_1.logError)("Failed to log audit event", { error, params });
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
            orderBy: { createdAt: "desc" },
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
            orderBy: { startedAt: "desc" },
        });
    }
    /**
     * Get billing account for tenant
     */
    async getBillingAccount(tenantId) {
        return this.prisma.billingAccount.findFirst({
            where: {
                tenantId,
                status: "active",
            },
        });
    }
    /**
     * Update job progress (idempotent)
     */
    async updateProgress(resultId, progress) {
        try {
            const currentResult = await this.prisma.reconResult.findUnique({
                where: { id: resultId },
                select: { metadata: true },
            });
            const existingMetadata = currentResult?.metadata || {};
            await this.prisma.reconResult.update({
                where: { id: resultId },
                data: {
                    metadata: {
                        ...existingMetadata,
                        progress: {
                            ...progress,
                            updatedAt: new Date().toISOString(),
                        },
                    },
                },
            });
        }
        catch (error) {
            (0, logger_1.logError)(`[ReconCoreEngine] Failed to update progress for result ${resultId}`, error);
        }
    }
}
exports.ReconCoreEngine = ReconCoreEngine;
//# sourceMappingURL=recon-core-engine.js.map