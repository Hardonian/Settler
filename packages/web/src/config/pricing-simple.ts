/**
 * Simplified pricing helpers for legacy usage-tracking paths.
 * Canonical numeric truth: `@settler/types` commercial spine → {@link planConfigs} in planConfig.
 */

import { PLAN_SPINE, type PlanCode } from "@settler/types";

export interface PricingPlan {
  id: string;
  name: string;
  basePriceMonthly: number;
  pricePerTransaction: number;
  includedTransactions: number;
  description: string;
}

function row(id: PlanCode): PricingPlan {
  const spine = PLAN_SPINE[id];
  return {
    id: spine.code,
    name: spine.name,
    basePriceMonthly: spine.monthlyPrice,
    pricePerTransaction: spine.limits.reconcile.pricePerReconciliation,
    includedTransactions: spine.limits.reconcile.monthlyVolume,
    description: spine.marketing.publicLine,
  };
}

export const PRICING_PLANS: Record<string, PricingPlan> = {
  free: {
    id: "free",
    name: "Free (legacy alias)",
    basePriceMonthly: 0,
    pricePerTransaction: PLAN_SPINE.starter.limits.reconcile.pricePerReconciliation,
    includedTransactions: PLAN_SPINE.starter.limits.reconcile.monthlyVolume,
    description: "Alias of starter for legacy callers; same included reconciliation volume as Starter.",
  },
  starter: row("starter"),
  growth: row("growth"),
  scale: row("scale"),
  enterprise: row("enterprise"),
};

export function calculateMonthlyCost(planId: string, transactionCount: number): number {
  const plan = PRICING_PLANS[planId] ?? PRICING_PLANS.starter;
  if (!plan) {
    throw new Error(`Unknown plan: ${planId}`);
  }
  const basePrice = plan.basePriceMonthly;
  const overage = Math.max(0, transactionCount - plan.includedTransactions);
  const usageCost = overage * plan.pricePerTransaction;
  return basePrice + usageCost;
}

export function getPlan(planId: string): PricingPlan {
  return PRICING_PLANS[planId] ?? PRICING_PLANS.free!;
}

export function exceedsPlanLimit(planId: string, transactionCount: number): boolean {
  const plan = getPlan(planId);
  if (planId === "free" || planId === "starter") {
    return transactionCount > plan.includedTransactions;
  }
  return false;
}

export function getPricingExplanation(planId: string): string {
  return getPlan(planId).description;
}
