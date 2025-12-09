/**
 * Console Feature Flags Domain
 * 
 * Manages feature flags for the Developer Console.
 */

import { prisma } from '@/shared/db/prismaClient';
import { evaluateFlag } from '@/domain/featureFlags/evaluator';
import { Environment } from '@/domain/featureFlags/types';

export interface FeatureFlagListItem {
  id: string;
  key: string;
  name: string;
  description: string | null;
  type: string;
  isGlobal: boolean;
  defaultValue: unknown;
  environments: Array<{
    environment: string;
    enabled: boolean;
    variant?: unknown;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateFlagEnvironmentInput {
  enabled?: boolean;
  variant?: unknown;
}

/**
 * List feature flags for a billing account
 */
export async function listFeatureFlags(
  billingAccountId: string,
  projectId?: string
): Promise<FeatureFlagListItem[]> {
  const flags = await prisma.featureFlag.findMany({
    where: {
      billingAccountId,
      projectId: projectId || undefined,
      deletedAt: null,
    },
    include: {
      environments: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return flags.map((flag) => ({
    id: flag.id,
    key: flag.key,
    name: flag.name,
    description: flag.description,
    type: flag.type,
    isGlobal: flag.isGlobal,
    defaultValue: flag.defaultValue,
    environments: flag.environments.map((env) => ({
      environment: env.environment,
      enabled: env.enabled,
      variant: env.variant as unknown,
    })),
    createdAt: flag.createdAt,
    updatedAt: flag.updatedAt,
  }));
}

/**
 * Update a feature flag environment setting
 */
export async function updateFlagEnvironment(
  flagId: string,
  environment: Environment,
  billingAccountId: string,
  input: UpdateFlagEnvironmentInput
): Promise<void> {
  // Verify flag belongs to billing account
  const flag = await prisma.featureFlag.findFirst({
    where: {
      id: flagId,
      billingAccountId,
    },
  });

  if (!flag) {
    throw new Error('Feature flag not found');
  }

  // Update or create environment setting
  await prisma.featureFlagEnvironment.upsert({
    where: {
      flagId_environment: {
        flagId,
        environment,
      },
    },
    update: {
      enabled: input.enabled ?? undefined,
      variant: input.variant ? JSON.parse(JSON.stringify(input.variant)) : undefined,
    },
    create: {
      flagId,
      environment,
      enabled: input.enabled ?? false,
      variant: input.variant ? JSON.parse(JSON.stringify(input.variant)) : undefined,
      config: {},
    },
  });
}

/**
 * Get flag evaluation for preview
 */
export async function previewFlagEvaluation(
  flagKey: string,
  environment: Environment,
  billingAccountId: string,
  projectId?: string
): Promise<{ value: unknown; source: string }> {
  const result = await evaluateFlag({
    flagKey,
    environment,
    billingAccountId,
    projectId,
  });

  return {
    value: result.value,
    source: result.source,
  };
}
