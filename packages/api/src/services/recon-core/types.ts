/**
 * Recon Core Engine Types
 * 
 * Type definitions for the unified Recon Core Engine
 */

import type { ReconJob as PrismaReconJob, ReconResult as PrismaReconResult } from '@prisma/client';

export type ReconStrategy = 
  | 'deterministic'
  | 'fuzzy'
  | 'ml_based'
  | 'hybrid';

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
  validationRules?: any[];
  reconStrategy?: ReconStrategy;
  scheduleCron?: string;
  scheduleTimezone?: string;
  metadata?: Record<string, any>;
}

export interface ReconExecutionOptions {
  dryRun?: boolean;
  skipValidation?: boolean;
  skipTransformation?: boolean;
  customRules?: any[];
}

export interface ReconMatch {
  id: string;
  sourceId: string;
  targetId: string;
  confidence: number;
  amount?: number;
  currency?: string;
  matchedFields: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface ReconUnmatched {
  id: string;
  sourceId?: string;
  targetId?: string;
  type: 'source' | 'target';
  amount?: number;
  currency?: string;
  reason?: string;
  metadata?: Record<string, any>;
}

export interface ReconConflict {
  id: string;
  sourceId: string;
  targetId: string;
  field: string;
  sourceValue: any;
  targetValue: any;
  severity: 'warning' | 'error';
  metadata?: Record<string, any>;
}

export type ReconJob = PrismaReconJob;
export type ReconResult = PrismaReconResult;
