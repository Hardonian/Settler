/**
 * Legacy Express quota helpers — backed by the canonical commercial spine in @settler/types.
 */

import {
  getApiLegacyPlanFeatures,
  getApiLegacyPlanLimits,
  mapLegacyPlanTypeToPlanCode,
  type ApiLegacyPlanFeatures,
  type LegacyPlanType,
} from "@settler/types";

export type PlanType = LegacyPlanType;

export type PlanLimits = ReturnType<typeof getApiLegacyPlanLimits>;

export type PlanFeatures = ApiLegacyPlanFeatures;

export function getPlanLimits(planType: PlanType): PlanLimits {
  const code = mapLegacyPlanTypeToPlanCode(planType);
  return getApiLegacyPlanLimits(code);
}

export function getPlanFeatures(planType: PlanType): PlanFeatures {
  const code = mapLegacyPlanTypeToPlanCode(planType);
  return getApiLegacyPlanFeatures(code);
}
