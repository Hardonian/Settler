/**
 * Feature Flag Evaluator
 *
 * Evaluates feature flags based on environment, overrides, and context.
 */

import { prisma } from "@/shared/db/prismaClient";
import { EvaluationContext, EvaluationResult, Environment } from "./types";

/**
 * Evaluate a feature flag
 */
export async function evaluateFlag(params: {
  flagKey: string;
  environment: Environment;
  billingAccountId?: string;
  projectId?: string;
  context?: EvaluationContext;
}): Promise<EvaluationResult> {
  const { flagKey, environment, billingAccountId, projectId, context } = params;

  // Find the flag
  const flag = await prisma.featureFlag.findFirst({
    where: {
      key: flagKey,
      billingAccountId: billingAccountId || undefined,
      projectId: projectId || undefined,
      deletedAt: null,
    },
  });

  if (!flag) {
    // Return default value if flag doesn't exist
    return {
      value: false,
      source: "default",
      metadata: { reason: "flag_not_found" },
    };
  }

  // Check for user/tenant-specific override
  if (context) {
    const override = await prisma.featureFlagOverride.findFirst({
      where: {
        flagId: flag.id,
        environment,
        targetKey: context.userId || context.tenantId || "",
        expiresAt: context.userId ? { gt: new Date() } : undefined,
      },
    });

    if (override && (!override.expiresAt || override.expiresAt > new Date())) {
      return {
        value: override.value,
        source: "override",
        environment,
        metadata: {
          overrideId: override.id,
          targetKey: override.targetKey,
          targetType: override.targetType,
        },
      };
    }
  }

  // Check environment-specific setting
  const envSetting = await prisma.featureFlagEnvironment.findUnique({
    where: {
      flagId_environment: {
        flagId: flag.id,
        environment,
      },
    },
  });

  if (envSetting) {
    if (flag.type === "boolean") {
      return {
        value: envSetting.enabled,
        source: "environment",
        environment,
        metadata: { enabled: envSetting.enabled },
      };
    } else {
      return {
        value: envSetting.variant ?? flag.defaultValue,
        source: "environment",
        environment,
        metadata: { enabled: envSetting.enabled },
      };
    }
  }

  // Return default value
  return {
    value: flag.defaultValue ?? (flag.type === "boolean" ? false : null),
    source: "default",
    metadata: { reason: "no_environment_setting" },
  };
}
