/**
 * Feature Flags Domain Types
 *
 * Type definitions for feature flag management and evaluation.
 */

export type FlagType = "boolean" | "string" | "number";

export type Environment = "production" | "staging" | "development" | string;

export interface FeatureFlag {
  id: string;
  billingAccountId?: string;
  projectId?: string;
  key: string;
  name: string;
  description?: string;
  type: FlagType;
  isGlobal: boolean;
  defaultValue?: unknown;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeatureFlagEnvironment {
  id: string;
  flagId: string;
  environment: Environment;
  enabled: boolean;
  variant?: unknown;
  config?: Record<string, unknown>;
  updatedAt: Date;
}

export interface FeatureFlagOverride {
  id: string;
  flagId: string;
  environment: Environment;
  targetKey: string;
  targetType: string;
  value: unknown;
  expiresAt?: Date;
}

export interface EvaluationContext {
  userId?: string;
  tenantId?: string;
  projectId?: string;
  [key: string]: unknown;
}

export interface EvaluationResult {
  value: unknown;
  source: "default" | "environment" | "override";
  environment?: Environment;
  metadata?: Record<string, unknown>;
}
