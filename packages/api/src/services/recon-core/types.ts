/**
 * Recon Core Engine Types
 *
 * Type definitions for the unified Recon Core Engine
 */

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error - Prisma types are generated at build time
import type { ReconJob as PrismaReconJob, ReconResult as PrismaReconResult } from "@prisma/client";

export type ReconStrategy = "deterministic" | "fuzzy" | "ml_based" | "hybrid";

export interface ValidationRule {
  field: string;
  operator: "equals" | "not_equals" | "greater_than" | "less_than" | "contains" | "regex";
  value: unknown;
  severity?: "warning" | "error";
}

export interface ReconJobInput {
  name: string;
  description?: string;
  templateId?: string;
  sourceAdapter: string;
  sourceConfigEncrypted: string;
  targetAdapter: string;
  targetConfigEncrypted: string;
  mappingTemplateId?: string;
  transformRecipeId?: string;
  validationRules?: ValidationRule[];
  reconStrategy?: ReconStrategy;
  scheduleCron?: string;
  scheduleTimezone?: string;
  metadata?: Record<string, unknown>;
}

export interface ReconExecutionOptions {
  dryRun?: boolean;
  skipValidation?: boolean;
  skipTransformation?: boolean;
  customRules?: ValidationRule[];
}

export interface ReconMatch {
  id: string;
  sourceId: string;
  targetId: string;
  confidence: number;
  amount?: number;
  currency?: string;
  matchedFields: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface ReconUnmatched {
  id: string;
  sourceId?: string;
  targetId?: string;
  type: "source" | "target";
  amount?: number;
  currency?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface ReconConflict {
  id: string;
  sourceId: string;
  targetId: string;
  field: string;
  sourceValue: unknown;
  targetValue: unknown;
  severity: "warning" | "error";
  metadata?: Record<string, unknown>;
}

export type ReconJob = PrismaReconJob;
export type ReconResult = PrismaReconResult;

// Data record type for reconciliation
export type ReconDataRecord = Record<string, unknown>;

// Summary type for reconciliation results
export interface ReconSummary {
  totalRecords: number;
  matchedRecords: number;
  unmatchedRecords: number;
  confidenceDistribution: {
    high: number; // >= 0.9
    medium: number; // >= 0.7
    low: number; // < 0.7
  };
  amountBreakdown: {
    matched: number | null;
    unmatched: number | null;
    total: number | null;
  };
  currency?: string;
}
