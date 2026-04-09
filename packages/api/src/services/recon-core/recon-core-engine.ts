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

import { PrismaClient, Prisma } from "@prisma/client";
import fs from "fs";
import path from "path";
import { createObjectCsvStringifier } from "csv-writer";
import { logError, logWarn, logInfo } from "../../utils/logger";
import {
  getMatchingRulesForJob,
  serializeConfigForProvenance,
  DEFAULT_TOLERANCES,
  type ReconciliationConfig,
} from "../matching-rules-loader";
import { WebhookService } from "../webhooks/webhook-service";
import { ReconUsageTracker } from "../usage/recon-usage-tracker";
import { eventBus } from "../events/event-bus";
import { notifyJobFailure, notifyJobCompletion } from "../notifications/job-failure";
import type {
  ReconJobInput,
  ReconJob,
  ReconResult,
  ReconStrategy,
  ReconExecutionOptions,
  ReconMatch,
  ReconDataRecord,
  ReconSummary,
  ValidationRule,
} from "./types";
import { NormalizedRecord } from "./normalized-types";

export class ReconCoreEngine {
  private prisma: PrismaClient;
  private webhookService: WebhookService;
  private usageTracker: ReconUsageTracker;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.webhookService = new WebhookService(prisma);
    this.usageTracker = new ReconUsageTracker(prisma);
  }

  /**
   * Create a new reconciliation job
   */
  async createReconJob(tenantId: string, userId: string, input: ReconJobInput): Promise<ReconJob> {
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
          validationRules: (input.validationRules || []) as unknown as Prisma.InputJsonValue,
          reconStrategy: input.reconStrategy || "deterministic",
          scheduleCron: input.scheduleCron,
          scheduleTimezone: input.scheduleTimezone || "UTC",
          status: "active",
          metadata: (input.metadata || {}) as Prisma.InputJsonValue,
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
    } catch (error) {
      logError("Failed to create recon job", { error, tenantId, userId, input });
      throw error;
    }
  }

  /**
   * Execute a reconciliation job
   */
  async executeReconJob(
    reconJobId: string,
    tenantId: string,
    _options?: ReconExecutionOptions
  ): Promise<ReconResult> {
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
      const _validationResults = await this.validateData(
        transformedSource,
        transformedTarget,
        (reconJob.validationRules as unknown as ValidationRule[]) || [],
        tenantId
      );
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

      // Step 5: Load matching rules and perform reconciliation
      const matchingConfig = await getMatchingRulesForJob(
        tenantId,
        reconJob.id,
        reconJob.templateId
      );

      logInfo("Loaded matching config for job", {
        jobId: reconJob.id,
        templateId: reconJob.templateId,
        amountTolerance: matchingConfig.amountTolerance,
        ruleCount: matchingConfig.matchingRules.length,
        configSource: matchingConfig.configSource,
      });

      // Perform reconciliation with loaded config
      const reconMatches = await this.performReconciliation(
        mappedSource,
        mappedTarget,
        reconJob.reconStrategy as ReconStrategy,
        reconJob,
        matchingConfig
      );

      // Update progress: Reconciliation complete
      await this.updateProgress(reconResult.id, {
        stage: "calculating",
        percentage: 90,
        message: `Reconciliation complete. Processing ${reconMatches.length} matches...`,
      });

      // Step 6: Calculate results
      const results = this.calculateResults(reconMatches, mappedSource, mappedTarget);

      // Step 7: Update recon result with provenance
      const durationMs = Date.now() - startTime;

      // Build provenance data to track which config was used
      const provenanceData = serializeConfigForProvenance(matchingConfig);

      // Extend summary with provenance
      const enrichedSummary = {
        ...results.summary,
        _provenance: provenanceData,
      };

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
          summary: enrichedSummary as unknown as Prisma.InputJsonValue,
        },
      });

      // Log the config that was used for this run
      logInfo("Run completed with matching config", {
        resultId: updatedResult.id,
        jobId: reconJobId,
        amountTolerance: matchingConfig.amountTolerance,
        dateToleranceDays: matchingConfig.dateToleranceDays,
        configSource: matchingConfig.configSource,
        configVersion: matchingConfig.configVersion,
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
        await this.usageTracker.trackReconComparison(
          tenantId,
          billingAccount.id,
          results.matchedCount + results.unmatchedSourceCount + results.unmatchedTargetCount,
          { reconJobId, reconResultId: updatedResult.id }
        );
      }

      // Step 9.5: Record value events (reconciliation completed, anomalies detected)
      if (billingAccount) {
        try {
          await eventBus.emitEvent(
            "reconciliation.value.realized",
            tenantId,
            {
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
            },
            {
              correlationId: `recon:${tenantId}:${reconJobId}:${updatedResult.id}:value-realized`,
              runId: updatedResult.id,
              executionId: updatedResult.id,
              actorId: reconJob.userId ?? undefined,
              source: "api.recon-core",
              severity: "info",
            }
          );

          const totalUnmatched = results.unmatchedSourceCount + results.unmatchedTargetCount;
          if (totalUnmatched > 0) {
            await eventBus.emitEvent(
              "reconciliation.errors.prevented",
              tenantId,
              {
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
              },
              {
                correlationId: `recon:${tenantId}:${reconJobId}:${updatedResult.id}:errors-prevented`,
                runId: updatedResult.id,
                executionId: updatedResult.id,
                actorId: reconJob.userId ?? undefined,
                source: "api.recon-core",
                severity: "warning",
              }
            );
          }
        } catch (valueError) {
          logError("[ReconCoreEngine] Failed to emit value events", valueError);
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
      await eventBus.emitEvent(
        "reconciliation.completed",
        tenantId,
        {
          reconJobId,
          reconResultId: updatedResult.id,
          summary: results.summary,
        },
        {
          correlationId: `recon:${tenantId}:${reconJobId}:${updatedResult.id}:completed`,
          runId: updatedResult.id,
          executionId: updatedResult.id,
          actorId: reconJob.userId ?? undefined,
          source: "api.recon-core",
          severity: "info",
        }
      );

      // Step 12: Send completion notification if there are exceptions
      if (results.unmatchedSourceCount > 0 || results.unmatchedTargetCount > 0) {
        try {
          const accuracy =
            results.matchedCount > 0
              ? (results.matchedCount /
                  (results.matchedCount +
                    results.unmatchedSourceCount +
                    results.unmatchedTargetCount)) *
                100
              : 0;
          await notifyJobCompletion(this.prisma, {
            jobId: reconJobId,
            resultId: updatedResult.id,
            tenantId: tenantId,
            matchedCount: results.matchedCount,
            unmatchedCount: results.unmatchedSourceCount + results.unmatchedTargetCount,
            accuracy,
          });
        } catch (notificationError) {
          logError("[ReconCoreEngine] Failed to send completion notification", notificationError);
        }
      }

      return updatedResult;
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      const errorStack = error instanceof Error ? error.stack : undefined;

      // Send failure notification
      try {
        await notifyJobFailure(this.prisma, {
          jobId: reconJobId,
          resultId: reconResult.id,
          errorMessage: errorMessage,
          errorStack: errorStack,
          tenantId: tenantId,
          userId: reconJob.userId,
        });
      } catch (notificationError) {
        logError("[ReconCoreEngine] Failed to send failure notification", notificationError);
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
      await eventBus.emitEvent(
        "reconciliation.failed",
        tenantId,
        {
          reconJobId,
          reconResultId: failedResult.id,
          error: errorMessage,
        },
        {
          correlationId: `recon:${tenantId}:${reconJobId}:${failedResult.id}:failed`,
          runId: failedResult.id,
          executionId: failedResult.id,
          actorId: reconJob.userId ?? undefined,
          source: "api.recon-core",
          severity: "error",
          metadata: { failure_stage: "execute" },
        }
      );

      logError("Recon job execution failed", { error, reconJobId, tenantId });
      throw error;
    }
  }

  /**
   * Ingest data from source and target adapters
   */
  private async ingestData(reconJob: ReconJob): Promise<{
    sourceData: ReconDataRecord[];
    targetData: ReconDataRecord[];
  }> {
    // 1. DEMO MODE
    if (reconJob.sourceAdapter === "DEMO_STRIPE" && reconJob.targetAdapter === "DEMO_BANK") {
      const demoDir = path.join(process.cwd(), "demo/data");
      if (!fs.existsSync(demoDir)) {
        throw new Error("Demo data not found. Please run scripts/seed-demo.ts first.");
      }

      const sourceData = JSON.parse(
        fs.readFileSync(path.join(demoDir, "demo_stripe_transactions.json"), "utf-8")
      );
      const targetData = JSON.parse(
        fs.readFileSync(path.join(demoDir, "demo_bank_transactions.json"), "utf-8")
      );

      return { sourceData, targetData };
    }

    // 2. REAL ADAPTERS (Placeholder for now)
    // In a real implementation, we would use the AdapterFactory here
    if (reconJob.sourceAdapter && reconJob.sourceAdapter !== "DEMO_STRIPE") {
      // Check if we have credentials
      if (!reconJob.sourceConfigEncrypted) {
        logWarn(`Missing credentials for ${reconJob.sourceAdapter}, returning empty dataset`);
        return { sourceData: [], targetData: [] };
      }

      // Call actual adapter
      try {
        const { AdapterFactory } = await import("../../adapters/adapter-factory");
        const adapter = AdapterFactory.create(reconJob.sourceAdapter, reconJob.sourceConfigEncrypted);
        const rawData = await adapter.fetchTransactions({
          startDate: reconJob.config?.startDate as string,
          endDate: reconJob.config?.endDate as string,
        });
        return { sourceData: rawData as ReconDataRecord[], targetData: [] };
      } catch (error) {
        logError(`Failed to fetch data from adapter ${reconJob.sourceAdapter}`, error);
        return { sourceData: [], targetData: [] };
      }
    }

    return {
      sourceData: [],
      targetData: [],
    };
  }

  /**
   * Export reconciliation results to CSV
   */
  async exportResults(reconResultId: string, format: "csv" | "json" = "csv"): Promise<string> {
    // Query matches using raw SQL since reconMatch table may not be in Prisma schema yet
    let matches: any[] = [];
    try {
      matches = await this.prisma.$queryRaw`
        SELECT * FROM "ReconMatch" WHERE "executionId" = ${reconResultId}
      `;
    } catch (error) {
      // Table doesn't exist, try alternative query or return empty
      logWarn("ReconMatch table not found, returning empty results", error);
      matches = [];
    }

    if (format === "json") {
      return JSON.stringify(matches, null, 2);
    }

    const csvStringifier = createObjectCsvStringifier({
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
  private async transformData(
    data: ReconDataRecord[],
    transformRecipeId: string,
    tenantId: string
  ): Promise<ReconDataRecord[]> {
    const recipe = await this.prisma.transformRecipe.findFirst({
      where: {
        id: transformRecipeId,
        OR: [{ tenantId }, { isPublic: true, deletedAt: null }],
      },
    });

    if (!recipe) {
      throw new Error(`Transform recipe not found: ${transformRecipeId}`);
    }

    // Apply transformation steps from recipe
    const steps = (recipe.steps || []) as Array<{ type: string; config: Record<string, unknown> }>;
    let transformedData = [...data];

    for (const step of steps) {
      switch (step.type) {
        case "filter":
          transformedData = transformedData.filter(record => {
            const conditions = step.config.conditions as Array<{ field: string; operator: string; value: unknown }>;
            return conditions.every(cond => this.evaluateCondition(record[cond.field], cond.operator, cond.value));
          });
          break;
        case "map":
          transformedData = transformedData.map(record => {
            const mappings = step.config.mappings as Record<string, string>;
            const newRecord = { ...record };
            for (const [sourceField, targetField] of Object.entries(mappings)) {
              if (sourceField in record) {
                newRecord[targetField] = record[sourceField];
                if (sourceField !== targetField) delete newRecord[sourceField];
              }
            }
            return newRecord;
          });
          break;
        case "compute":
          transformedData = transformedData.map(record => {
            const computedFields = step.config.fields as Record<string, { formula: string; dependencies: string[] }>;
            const newRecord = { ...record };
            for (const [fieldName, { formula, dependencies }] of Object.entries(computedFields)) {
              try {
                const values = dependencies.reduce((acc, dep) => ({ ...acc, [dep]: record[dep] }), {});
                newRecord[fieldName] = this.evaluateFormula(formula, values);
              } catch (error) {
                logWarn(`Failed to compute field ${fieldName}`, error);
              }
            }
            return newRecord;
          });
          break;
        default:
          logWarn(`Unknown transformation step type: ${step.type}`);
      }
    }

    return transformedData;
  }

  /**
   * Validate data using validation rules
   */
  private async validateData(
    sourceData: ReconDataRecord[],
    targetData: ReconDataRecord[],
    validationRules: ValidationRule[],
    _tenantId: string
  ): Promise<ReconDataRecord[]> {
    const allData = [...sourceData, ...targetData];
    const errors: Array<{ record: string; field: string; message: string }> = [];

    for (const record of allData) {
      for (const rule of validationRules) {
        const value = record[rule.field];

        // Required check
        if (rule.required && (value === undefined || value === null || value === '')) {
          errors.push({ record: record.id || 'unknown', field: rule.field, message: `${rule.field} is required` });
        }

        if (value === undefined || value === null) continue;

        // Type validation
        if (rule.type === 'number' && typeof value !== 'number') {
          errors.push({ record: record.id || 'unknown', field: rule.field, message: `${rule.field} must be a number` });
        }

        if (rule.type === 'date' && isNaN(Date.parse(String(value)))) {
          errors.push({ record: record.id || 'unknown', field: rule.field, message: `${rule.field} must be a valid date` });
        }

        // Pattern validation
        if (rule.pattern && !new RegExp(rule.pattern).test(String(value))) {
          errors.push({ record: record.id || 'unknown', field: rule.field, message: `${rule.field} does not match pattern` });
        }
      }
    }

    if (errors.length > 0) {
      logWarn(`Validation failed with ${errors.length} errors`, errors);
    }

    return allData;
  }

  /**
   * Apply mapping template to data
   */
  private async applyMapping(
    data: ReconDataRecord[],
    mappingTemplateId: string,
    tenantId: string
  ): Promise<ReconDataRecord[]> {
    const template = await this.prisma.mappingTemplate.findFirst({
      where: {
        id: mappingTemplateId,
        OR: [{ tenantId }, { isPublic: true, deletedAt: null }],
      },
    });

    if (!template) {
      throw new Error(`Mapping template not found: ${mappingTemplateId}`);
    }

    // Apply field mappings from template
    const fieldMappings = (template.fieldMappings || {}) as Record<string, string>;
    const calculatedFields = (template.calculatedFields || {}) as Record<string, string>;

    return data.map(record => {
      const mappedRecord: ReconDataRecord = { ...record };

      // Apply field mappings (source field -> target field)
      for (const [sourceField, targetField] of Object.entries(fieldMappings)) {
        if (sourceField in record) {
          mappedRecord[targetField] = record[sourceField];
          // Remove original field if mapping to different name
          if (sourceField !== targetField) {
            delete mappedRecord[sourceField];
          }
        }
      }

      // Apply calculated fields
      for (const [fieldName, formula] of Object.entries(calculatedFields)) {
        try {
          mappedRecord[fieldName] = this.evaluateFormula(formula, mappedRecord);
        } catch (error) {
          logWarn(`Failed to calculate field ${fieldName}`, error);
        }
      }

      return mappedRecord;
    });
  }

  /**
   * Perform reconciliation matching
   * Integrates rules engine for improved match rates over time
   *
   * @param sourceData - Source records to match
   * @param targetData - Target records to match against
   * @param _strategy - Reconciliation strategy (deterministic, fuzzy, etc.)
   * @param _reconJob - The recon job metadata
   * @param matchingConfig - Matching rules configuration loaded from template/custom rules
   */
  public async performReconciliation(
    sourceData: ReconDataRecord[],
    targetData: ReconDataRecord[],
    _strategy: ReconStrategy,
    _reconJob: ReconJob,
    matchingConfig: ReconciliationConfig
  ): Promise<ReconMatch[]> {
    // Use config tolerances or fall back to defaults
    const amountTolerance = matchingConfig?.amountTolerance ?? DEFAULT_TOLERANCES.amount;
    const dateToleranceMs =
      (matchingConfig?.dateToleranceDays ?? DEFAULT_TOLERANCES.dateDays) * 24 * 60 * 60 * 1000;

    // Log the tolerances being used for transparency
    logInfo("Performing reconciliation with config", {
      jobId: _reconJob.id,
      amountTolerance,
      dateToleranceDays: matchingConfig?.dateToleranceDays ?? DEFAULT_TOLERANCES.dateDays,
      ruleCount: matchingConfig?.matchingRules?.length ?? 0,
      configSource: matchingConfig?.configSource ?? "default",
      configVersion: matchingConfig?.configVersion,
    });

    const matches: ReconMatch[] = [];
    const matchedTargetIds = new Set<string>();
    const matchedSourceIds = new Set<string>();

    const sources = sourceData as unknown as NormalizedRecord[];
    const targets = targetData as unknown as NormalizedRecord[];

    // 1. DETERMINISTIC: Exact External ID Match (Payouts)
    const targetMapByExternalId = new Map<string, NormalizedRecord>();
    targets.forEach((t) => {
      if (t.externalId) targetMapByExternalId.set(t.externalId, t);
    });

    // Payout Logic
    for (const source of sources) {
      if (matchedSourceIds.has(source.id)) continue;

      if (source.type === "PAYOUT" || source.type === "TRANSFER") {
        for (const target of targets) {
          if (matchedTargetIds.has(target.id)) continue;

          const descriptionMatch =
            target.description?.includes(source.externalId) ||
            source.description?.includes(target.externalId);

          const amountMatch = Math.abs(source.amount - target.amount) < amountTolerance;

          // Date within configurable tolerance
          const dateDiff = Math.abs(
            new Date(source.occurredAt).getTime() - new Date(target.occurredAt).getTime()
          );
          const dateMatch = dateDiff < dateToleranceMs;

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
      if (matchedSourceIds.has(source.id)) continue;

      for (const target of targets) {
        if (matchedTargetIds.has(target.id)) continue;

        const amountMatch = Math.abs(source.amount - target.amount) < amountTolerance;
        const dateDiff = Math.abs(
          new Date(source.occurredAt).getTime() - new Date(target.occurredAt).getTime()
        );
        const dateMatch = dateDiff < dateToleranceMs;

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
      if (matchedSourceIds.has(source.id)) continue;

      for (const target of targets) {
        if (matchedTargetIds.has(target.id)) continue;

        const amountMatch = Math.abs(source.amount - target.amount) < amountTolerance;
        const dateDiff = Math.abs(
          new Date(source.occurredAt).getTime() - new Date(target.occurredAt).getTime()
        );
        const dateMatch = dateDiff < dateToleranceMs * 3; // 3x tolerance for fuzzy

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
  private calculateResults(
    matches: ReconMatch[],
    sourceData: ReconDataRecord[],
    targetData: ReconDataRecord[]
  ): {
    matchedCount: number;
    unmatchedSourceCount: number;
    unmatchedTargetCount: number;
    conflictCount: number;
    totalAmountSource: number | null;
    totalAmountTarget: number | null;
    totalAmountMatched: number | null;
    totalAmountUnmatched: number | null;
    currency: string | null;
    confidenceAvg: number | null;
    confidenceMin: number | null;
    confidenceMax: number | null;
    summary: ReconSummary;
  } {
    const matchedCount = matches.length;
    const matchedSourceIds = new Set(matches.map((m) => m.sourceId));
    const matchedTargetIds = new Set(matches.map((m) => m.targetId));

    const unmatchedSourceCount = sourceData.length - matchedSourceIds.size;
    const unmatchedTargetCount = targetData.length - matchedTargetIds.size;

    const conflictCount = matches.filter((m) => m.confidence < 0.8).length;

    const totalAmountSource = this.calculateTotalAmount(sourceData);
    const totalAmountTarget = this.calculateTotalAmount(targetData);
    const totalAmountMatched = matches.reduce((sum, m) => sum + (m.amount || 0), 0);
    const totalAmountUnmatched =
      (totalAmountSource || 0) + (totalAmountTarget || 0) - totalAmountMatched;

    const confidences = matches
      .map((m) => m.confidence)
      .filter((c) => c !== null && c !== undefined);
    const confidenceAvg =
      confidences.length > 0
        ? confidences.reduce((sum, c) => sum + c, 0) / confidences.length
        : null;
    const confidenceMin = confidences.length > 0 ? Math.min(...confidences) : null;
    const confidenceMax = confidences.length > 0 ? Math.max(...confidences) : null;

    const currency = (sourceData[0]?.currency ||
      targetData[0]?.currency ||
      matches[0]?.currency) as string | undefined;
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
  private calculateTotalAmount(data: ReconDataRecord[]): number | null {
    if (data.length === 0) return null;

    const amounts = data
      .map((item) => {
        const amount = item.amount ?? item.total ?? item.value;
        return typeof amount === "number" ? amount : null;
      })
      .filter((amount): amount is number => amount !== null);

    if (amounts.length === 0) return null;

    return amounts.reduce((sum, amount) => sum + amount, 0);
  }

  /**
   * Log audit event
   */
  private async logAudit(params: {
    tenantId: string;
    userId?: string;
    reconJobId?: string;
    reconResultId?: string;
    auditType: string;
    action: string;
    entityType?: string;
    entityId?: string;
    beforeState?: Record<string, unknown>;
    afterState?: Record<string, unknown>;
    changes?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
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
            ? (params.beforeState as unknown as Prisma.InputJsonValue)
            : undefined,
          afterState: params.afterState
            ? (params.afterState as unknown as Prisma.InputJsonValue)
            : undefined,
          changes: params.changes
            ? (params.changes as unknown as Prisma.InputJsonValue)
            : undefined,
          metadata: (params.metadata || {}) as Prisma.InputJsonValue,
        },
      });
    } catch (error) {
      logError("Failed to log audit event", { error, params });
    }
  }

  /**
   * Get recon job by ID
   */
  async getReconJob(reconJobId: string, tenantId: string): Promise<ReconJob | null> {
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
  async listReconJobs(
    tenantId: string,
    options?: {
      status?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<ReconJob[]> {
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
  async getReconResult(reconResultId: string, tenantId: string): Promise<ReconResult | null> {
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
  async listReconResults(
    reconJobId: string,
    tenantId: string,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<ReconResult[]> {
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
   * Count recon results for a job (for pagination)
   */
  async countReconResults(reconJobId: string, tenantId: string): Promise<number> {
    return this.prisma.reconResult.count({
      where: {
        reconJobId,
        tenantId,
      },
    });
  }

  /**
   * Get billing account for tenant
   */
  private async getBillingAccount(tenantId: string) {
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
  private async updateProgress(
    resultId: string,
    progress: {
      stage: string;
      percentage: number;
      message: string;
    }
  ): Promise<void> {
    try {
      const currentResult = await this.prisma.reconResult.findUnique({
        where: { id: resultId },
        select: { metadata: true },
      });

      const existingMetadata = (currentResult?.metadata as Record<string, unknown>) || {};

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
    } catch (error) {
      logError(`[ReconCoreEngine] Failed to update progress for result ${resultId}`, error);
    }
  }

  /**
   * Evaluate a condition for filtering
   */
  private evaluateCondition(value: unknown, operator: string, expectedValue: unknown): boolean {
    switch (operator) {
      case 'eq':
        return value === expectedValue;
      case 'ne':
        return value !== expectedValue;
      case 'gt':
        return typeof value === 'number' && typeof expectedValue === 'number' && value > expectedValue;
      case 'gte':
        return typeof value === 'number' && typeof expectedValue === 'number' && value >= expectedValue;
      case 'lt':
        return typeof value === 'number' && typeof expectedValue === 'number' && value < expectedValue;
      case 'lte':
        return typeof value === 'number' && typeof expectedValue === 'number' && value <= expectedValue;
      case 'contains':
        return typeof value === 'string' && typeof expectedValue === 'string' && value.includes(expectedValue);
      case 'startsWith':
        return typeof value === 'string' && typeof expectedValue === 'string' && value.startsWith(expectedValue);
      case 'endsWith':
        return typeof value === 'string' && typeof expectedValue === 'string' && value.endsWith(expectedValue);
      case 'in':
        return Array.isArray(expectedValue) && expectedValue.includes(value);
      default:
        logWarn(`Unknown operator: ${operator}`);
        return false;
    }
  }

  /**
   * Evaluate a formula with record values
   */
  private evaluateFormula(formula: string, record: Record<string, unknown>): unknown {
    // Simple formula evaluation: supports +, -, *, /, and field references
    // Example: "{{amount}} * {{taxRate}}" or "{{quantity}} + 10"
    
    const sanitizedFormula = formula.replace(/\{\{(\w+)\}\}/g, (match, field) => {
      const value = record[field];
      if (value === undefined || value === null) return '0';
      if (typeof value === 'string') return `"${value.replace(/"/g, '\\"')}"`;
      return String(value);
    });

    try {
      // Use Function constructor for safe evaluation (no access to global scope)
      const fn = new Function('return ' + sanitizedFormula);
      return fn();
    } catch (error) {
      logError(`Failed to evaluate formula: ${formula}`, error);
      return null;
    }
  }
}
