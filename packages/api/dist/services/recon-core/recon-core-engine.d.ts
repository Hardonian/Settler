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
import { PrismaClient } from '@prisma/client';
import type { ReconJobInput, ReconJob, ReconResult, ReconStrategy, ReconExecutionOptions, ReconMatch, ReconDataRecord } from './types';
export declare class ReconCoreEngine {
    private prisma;
    private webhookService;
    private usageTracker;
    constructor(prisma: PrismaClient);
    /**
     * Create a new reconciliation job
     */
    createReconJob(tenantId: string, userId: string, input: ReconJobInput): Promise<ReconJob>;
    /**
     * Execute a reconciliation job
     */
    executeReconJob(reconJobId: string, tenantId: string, _options?: ReconExecutionOptions): Promise<ReconResult>;
    /**
     * Ingest data from source and target adapters
     */
    private ingestData;
    /**
     * Export reconciliation results to CSV
     */
    exportResults(_reconResultId: string, format?: 'csv' | 'json'): Promise<string>;
    /**
     * Transform data using a transform recipe
     */
    private transformData;
    /**
     * Validate data using validation rules
     */
    private validateData;
    /**
     * Apply mapping template to data
     */
    private applyMapping;
    /**
     * Perform reconciliation matching
     * Integrates rules engine for improved match rates over time
     */
    performReconciliation(sourceData: ReconDataRecord[], targetData: ReconDataRecord[], _strategy: ReconStrategy, _reconJob: ReconJob): Promise<ReconMatch[]>;
    /**
     * Calculate reconciliation results
     */
    private calculateResults;
    /**
     * Calculate total amount from data array
     */
    private calculateTotalAmount;
    /**
     * Log audit event
     */
    private logAudit;
    /**
     * Get recon job by ID
     */
    getReconJob(reconJobId: string, tenantId: string): Promise<ReconJob | null>;
    /**
     * List recon jobs for a tenant
     */
    listReconJobs(tenantId: string, options?: {
        status?: string;
        limit?: number;
        offset?: number;
    }): Promise<ReconJob[]>;
    /**
     * Get recon result by ID
     */
    getReconResult(reconResultId: string, tenantId: string): Promise<ReconResult | null>;
    /**
     * List recon results for a job
     */
    listReconResults(reconJobId: string, tenantId: string, options?: {
        limit?: number;
        offset?: number;
    }): Promise<ReconResult[]>;
    /**
     * Get billing account for tenant
     */
    private getBillingAccount;
    /**
     * Update job progress (idempotent)
     */
    private updateProgress;
}
//# sourceMappingURL=recon-core-engine.d.ts.map