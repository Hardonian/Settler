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

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - PrismaClient is generated at build time
import { PrismaClient, Prisma } from '@prisma/client';
import { logError, logWarn } from '../../utils/logger';
import { WebhookService } from '../webhooks/webhook-service';
import { ReconUsageTracker } from '../usage/recon-usage-tracker';
import { eventBus } from '../events/event-bus';
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
} from './types';

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
  async createReconJob(
    tenantId: string,
    userId: string,
    input: ReconJobInput
  ): Promise<ReconJob> {
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
          reconStrategy: input.reconStrategy || 'deterministic',
          scheduleCron: input.scheduleCron,
          scheduleTimezone: input.scheduleTimezone || 'UTC',
          status: 'active',
          metadata: (input.metadata || {}) as Prisma.InputJsonValue,
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
    } catch (error) {
      logError('Failed to create recon job', { error, tenantId, userId, input });
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
      // Update progress: Starting ingestion
      await this.updateProgress(reconResult.id, {
        stage: 'ingesting',
        percentage: 10,
        message: 'Fetching data from source and target adapters...',
      });

      // Step 1: Ingest data from source and target
      const { sourceData, targetData } = await this.ingestData(reconJob);

      // Update progress: Data ingested
      await this.updateProgress(reconResult.id, {
        stage: 'transforming',
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
        stage: 'matching',
        percentage: 60,
        message: `Matching ${mappedSource.length} source transactions against ${mappedTarget.length} target transactions...`,
      });

      // Step 5: Perform reconciliation
      const reconMatches = await this.performReconciliation(
        mappedSource,
        mappedTarget,
        reconJob.reconStrategy as ReconStrategy,
        reconJob
      );

      // Update progress: Reconciliation complete
      await this.updateProgress(reconResult.id, {
        stage: 'calculating',
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
          summary: results.summary as unknown as Prisma.InputJsonValue,
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
        await this.usageTracker.trackReconComparison(
          tenantId,
          billingAccount.id,
          results.matchedCount + results.unmatchedSourceCount + results.unmatchedTargetCount,
          { reconJobId, reconResultId: updatedResult.id }
        );
      }

      // Step 9.5: Record value events (reconciliation completed, anomalies detected)
      // Note: Value ledger is in packages/web, so we'll record via API call or event
      // For now, emit event that web package can listen to
      if (billingAccount) {
        try {
          // Emit value event via event bus (web package can subscribe)
          await eventBus.emitEvent('value.reconciliation_completed', tenantId, {
            billingAccountId: billingAccount.id,
            tenantId,
            userId: reconJob.userId,
            matchedCount: results.matchedCount,
            unmatchedCount: results.unmatchedSourceCount + results.unmatchedTargetCount,
            totalAmount: results.totalAmountMatched ? Number(results.totalAmountMatched) : undefined,
            jobId: reconJobId,
            runId: updatedResult.id,
          });

          // Record anomalies detected (unmatched transactions)
          const totalUnmatched = results.unmatchedSourceCount + results.unmatchedTargetCount;
          if (totalUnmatched > 0) {
            await eventBus.emitEvent('value.errors_prevented', tenantId, {
              billingAccountId: billingAccount.id,
              tenantId,
              userId: reconJob.userId,
              quantity: totalUnmatched,
              unit: 'anomaly',
              metadata: {
                source: 'reconciliation_completed',
                runId: updatedResult.id,
                jobId: reconJobId,
                matchedCount: results.matchedCount,
              },
            });
          }
        } catch (valueError) {
          // Log but don't throw - value tracking should never break reconciliation
          logError('[ReconCoreEngine] Failed to emit value events', valueError);
        }
      }

      // Step 10: Fire webhook
      await this.webhookService.queueWebhook(tenantId, 'recon.completed', {
        reconJobId,
        reconResultId: updatedResult.id,
        status: 'completed',
        summary: results.summary,
      });

      // Step 11: Emit event
      await eventBus.emitEvent('recon.completed', tenantId, {
        reconJobId,
        reconResultId: updatedResult.id,
        summary: results.summary,
      });

      // Step 12: Send completion notification if there are exceptions
      if (results.unmatchedSourceCount > 0 || results.unmatchedTargetCount > 0) {
        try {
          const { notifyJobCompletion } = await import('../notifications/job-failure');
          const accuracy = results.matchedCount > 0
            ? (results.matchedCount / (results.matchedCount + results.unmatchedSourceCount + results.unmatchedTargetCount)) * 100
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
          // Don't fail job execution if notification fails
          logError('[ReconCoreEngine] Failed to send completion notification', notificationError);
        }
      }

      return updatedResult;
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      // Send failure notification
      try {
        const { notifyJobFailure } = await import('../notifications/job-failure');
        await notifyJobFailure(this.prisma, {
          jobId: reconJobId,
          resultId: reconResult.id,
          errorMessage: errorMessage,
          errorStack: errorStack,
          tenantId: tenantId,
          userId: reconJob.userId,
        });
      } catch (notificationError) {
        // Don't fail if notification fails
        logError('[ReconCoreEngine] Failed to send failure notification', notificationError);
      }

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
      await eventBus.emitEvent('recon.failed', tenantId, {
        reconJobId,
        reconResultId: failedResult.id,
        error: errorMessage,
      });

      logError('Recon job execution failed', { error, reconJobId, tenantId });
      throw error;
    }
  }

  /**
   * Ingest data from source and target adapters
   */
  private async ingestData(_reconJob: ReconJob): Promise<{
    sourceData: ReconDataRecord[];
    targetData: ReconDataRecord[];
  }> {
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
  private async transformData(
    data: ReconDataRecord[],
    transformRecipeId: string,
    tenantId: string
  ): Promise<ReconDataRecord[]> {
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
  private async validateData(
    _sourceData: ReconDataRecord[],
    _targetData: ReconDataRecord[],
    _validationRules: ValidationRule[],
    _tenantId: string
  ): Promise<ReconDataRecord[]> {
    // TODO: Implement validation logic
    // Apply validation rules
    return [];
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
   * Integrates rules engine for improved match rates over time
   */
  private async performReconciliation(
    sourceData: ReconDataRecord[],
    targetData: ReconDataRecord[],
    _strategy: ReconStrategy,
    reconJob: ReconJob
  ): Promise<ReconMatch[]> {
    // Get billing account to fetch rules
    const billingAccount = await this.getBillingAccount(reconJob.tenantId);
    
    // Get active rules for this billing account
    // Rules are stored in reconciliation_rules table
    let activeRules: Array<{
      id: string;
      ruleType: string;
      sourceField?: string;
      targetField?: string;
      ruleConfig: Record<string, unknown>;
      successRate: number;
    }> = [];

    if (billingAccount) {
      try {
        // Query rules directly from database (rules engine is in web package)
        const rules = await this.prisma.$queryRaw<Array<{
          id: string;
          rule_type: string;
          source_field: string | null;
          target_field: string | null;
          rule_config: unknown;
          success_rate: number;
        }>>`
          SELECT id, rule_type, source_field, target_field, rule_config, success_rate
          FROM reconciliation_rules
          WHERE billing_account_id = ${billingAccount.id}::uuid
            AND is_active = true
          ORDER BY success_rate DESC, match_count DESC
        `;

        activeRules = rules.map((r: {
          id: string;
          rule_type: string;
          source_field: string | null;
          target_field: string | null;
          rule_config: unknown;
          success_rate: number;
        }) => ({
          id: r.id,
          ruleType: r.rule_type,
          sourceField: r.source_field || undefined,
          targetField: r.target_field || undefined,
          ruleConfig: (r.rule_config as Record<string, unknown>) || {},
          successRate: Number(r.success_rate) || 0,
        }));
      } catch (rulesError) {
        // Log but continue - rules are optional
        logWarn('[ReconCoreEngine] Failed to load rules, continuing without rules', { error: rulesError });
      }
    }

    const matches: ReconMatch[] = [];
    const matchedTargetIds = new Set<string>();

    // Apply rules-based matching first (higher success rate rules first)
    const sortedRules = activeRules.sort((a, b) => b.successRate - a.successRate);
    
    for (const rule of sortedRules) {
      if (rule.ruleType === 'field_mapping' && rule.sourceField && rule.targetField) {
        // Apply field mapping rule
        for (const sourceRecord of sourceData) {
          const sourceId = String(sourceRecord.id || '');
          if (matchedTargetIds.has(sourceId)) continue;
          
          const sourceValue = (sourceRecord as Record<string, unknown>)[rule.sourceField];
          if (sourceValue === undefined || sourceValue === null) continue;

          // Find matching target record
          for (const targetRecord of targetData) {
            const targetId = String(targetRecord.id || '');
            if (matchedTargetIds.has(targetId)) continue;
            
            const targetValue = (targetRecord as Record<string, unknown>)[rule.targetField];
            if (sourceValue === targetValue) {
              // Match found - record rule usage in database
              try {
                await this.prisma.$executeRaw`
                  INSERT INTO rule_usage_events (
                    rule_id,
                    reconciliation_run_id,
                    matched,
                    confidence,
                    metadata,
                    created_at
                  ) VALUES (
                    ${rule.id}::uuid,
                    ${reconJob.id}::uuid,
                    true::boolean,
                    0.9::decimal,
                    ${JSON.stringify({
                      sourceField: rule.sourceField,
                      targetField: rule.targetField,
                    })}::jsonb,
                    NOW()
                  )
                `;
              } catch (ruleError) {
                logWarn('[ReconCoreEngine] Failed to record rule usage', { error: ruleError });
              }

              matches.push({
                id: `match_${sourceId}_${targetId}_${Date.now()}`,
                sourceId,
                targetId,
                confidence: 0.9,
                amount: (sourceRecord.amount || targetRecord.amount || 0) as number,
                currency: (sourceRecord.currency || targetRecord.currency || 'USD') as string,
                matchedFields: {
                  [rule.sourceField]: sourceValue,
                  [rule.targetField]: targetValue,
                },
                metadata: {
                  matchReason: `Rule: ${rule.sourceField} → ${rule.targetField}`,
                  ruleId: rule.id,
                },
              });
              
              matchedTargetIds.add(targetId);
              break;
            }
          }
        }
      }
    }

    // Fallback to strategy-based matching for unmatched records
    // TODO: Integrate with existing MatchingEngine for remaining records
    // For now, basic matching logic
    for (const sourceRecord of sourceData) {
      const sourceId = String(sourceRecord.id || '');
      if (matches.some(m => m.sourceId === sourceId)) continue;
      
      // Try to find match by amount and date
      for (const targetRecord of targetData) {
        const targetId = String(targetRecord.id || '');
        if (matchedTargetIds.has(targetId)) continue;
        
        const sourceAmount = (sourceRecord.amount || 0) as number;
        const targetAmount = (targetRecord.amount || 0) as number;
        const amountDiff = Math.abs(sourceAmount - targetAmount);
        
        // Match if amounts are close (within 1% or $0.01)
        if (amountDiff < Math.max(sourceAmount * 0.01, 0.01)) {
          matches.push({
            id: `match_${sourceId}_${targetId}_${Date.now()}`,
            sourceId,
            targetId,
            confidence: 0.8,
            amount: sourceAmount,
            currency: (sourceRecord.currency || 'USD') as string,
            matchedFields: {
              amount: sourceAmount,
            },
            metadata: {
              matchReason: 'Amount match',
            },
          });
          
          matchedTargetIds.add(targetId);
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
    const currency = (sourceData[0]?.currency || targetData[0]?.currency || matches[0]?.currency) as string | undefined;
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
  private calculateTotalAmount(data: ReconDataRecord[]): number | null {
    if (data.length === 0) return null;
    
    const amounts = data
      .map((item) => {
        const amount = item.amount ?? item.total ?? item.value;
        return typeof amount === 'number' ? amount : null;
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
          beforeState: params.beforeState ? (params.beforeState as unknown as Prisma.InputJsonValue) : undefined,
          afterState: params.afterState ? (params.afterState as unknown as Prisma.InputJsonValue) : undefined,
          changes: params.changes ? (params.changes as unknown as Prisma.InputJsonValue) : undefined,
          metadata: (params.metadata || {}) as Prisma.InputJsonValue,
        },
      });
    } catch (error) {
      logError('Failed to log audit event', { error, params });
      // Don't throw - audit failures shouldn't break the main flow
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
      orderBy: { createdAt: 'desc' },
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
      orderBy: { startedAt: 'desc' },
    });
  }

  /**
   * Get billing account for tenant
   */
  private async getBillingAccount(tenantId: string) {
    return this.prisma.billingAccount.findFirst({
      where: {
        tenantId,
        status: 'active',
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
      // Fetch current result to preserve existing metadata
      const currentResult = await this.prisma.reconResult.findUnique({
        where: { id: resultId },
        select: { metadata: true },
      });

      const existingMetadata = (currentResult?.metadata as Record<string, unknown>) || {};

      // Update progress in metadata (idempotent - can be called multiple times)
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
      // Don't fail job execution if progress update fails
      logError(`[ReconCoreEngine] Failed to update progress for result ${resultId}`, error);
    }
  }
}
