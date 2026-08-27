/**
 * Plan configuration — thin projection of the canonical commercial spine (`@settler/types`).
 *
 * Stripe price IDs remain environment-backed; numeric limits and descriptors live in the spine.
 */

import {
  PLAN_SPINE,
  calculatePlanMonthlyCostUsd,
  getExceptionThreshold as spineGetExceptionThreshold,
  getReconciliationVolumeLimit as spineGetReconciliationVolumeLimit,
  mapLegacySubscriptionPlanId,
  type PlanCode,
  type ServiceLimits,
} from "@settler/types";

export type { PlanCode, ServiceLimits };
export type ServiceCode = "reconcile" | "exceptions";

export interface PlanConfig {
  code: PlanCode;
  name: string;
  description: string;
  stripePriceId?: string;
  monthlyPrice: number;
  limits: ServiceLimits;
}

const FALLBACK_PLAN_SPINE: Record<PlanCode, Omit<PlanConfig, "stripePriceId">> = {
  starter: {
    code: "starter",
    name: "Starter",
    description: "First 10,000 reconciliations free",
    monthlyPrice: 0,
    limits: {
      reconcile: { monthlyVolume: 10_000, pricePerReconciliation: 0.01 },
      exceptions: { includedRate: 0.01, pricePerException: 0.1 },
    },
  },
  pro: {
    code: "pro",
    name: "Pro",
    description: "For growing businesses",
    monthlyPrice: 99,
    limits: {
      reconcile: { monthlyVolume: 100_000, pricePerReconciliation: 0.01 },
      exceptions: { includedRate: 0.01, pricePerException: 0.1 },
    },
  },
  scale: {
    code: "scale",
    name: "Scale",
    description: "For high-volume operations",
    monthlyPrice: 399,
    limits: {
      reconcile: { monthlyVolume: 1_000_000, pricePerReconciliation: 0.01 },
      exceptions: { includedRate: 0.01, pricePerException: 0.1 },
    },
  },
  enterprise: {
    code: "enterprise",
    name: "Enterprise",
    description: "Dedicated deployment, custom controls, and enterprise support",
    monthlyPrice: 0,
    limits: {
      reconcile: { monthlyVolume: 1_000_000, pricePerReconciliation: 0.01 },
      exceptions: { includedRate: 0.01, pricePerException: 0.1 },
    },
  },
};

const runtimePlanSpine =
  (PLAN_SPINE as Record<PlanCode, Omit<PlanConfig, "stripePriceId">>) ?? FALLBACK_PLAN_SPINE;

function planRow(code: PlanCode, stripePriceId?: string): PlanConfig {
  const row = runtimePlanSpine[code];
  return {
    code: row.code,
    name: row.name,
    description: row.description,
    monthlyPrice: row.monthlyPrice,
    limits: row.limits,
    ...(stripePriceId ? { stripePriceId } : {}),
  };
}

export const planConfigs: Record<PlanCode, PlanConfig> = {
  starter: planRow("starter"),
  pro: planRow("pro", process.env.STRIPE_PRICE_ID_PRO || undefined),
  scale: planRow("scale", process.env.STRIPE_PRICE_ID_SCALE || undefined),
  enterprise: planRow("enterprise"),
};

export function getPlanConfig(planCode: string): PlanConfig | null {
  const code = planCode as PlanCode;
  if (code in planConfigs) {
    return planConfigs[code];
  }
  return null;
}

export function getDefaultPlan(): PlanConfig {
  return planConfigs.starter;
}

/** Map Stripe/subscription `plan_id` strings to canonical {@link PlanCode}. */
export function mapLegacyPlanId(planId: string): PlanCode {
  return mapLegacySubscriptionPlanId(planId);
}

export function getReconciliationVolumeLimit(planCode: PlanCode): number {
  return spineGetReconciliationVolumeLimit(planCode);
}

export function getExceptionThreshold(planCode: PlanCode, reconciliationVolume: number): number {
  return spineGetExceptionThreshold(planCode, reconciliationVolume);
}

export function calculateMonthlyCost(
  planCode: PlanCode,
  reconciliationVolume: number,
  exceptionsRequiringReview: number
): number {
  return calculatePlanMonthlyCostUsd(planCode, reconciliationVolume, exceptionsRequiringReview);
}
