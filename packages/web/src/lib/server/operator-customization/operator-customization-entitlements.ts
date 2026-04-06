/**
 * Server-truth capability boundaries for Operator Customization Studio.
 * Additive to billing/reconciliation; does not gate reconciliation-core APIs.
 */

import { getAccountPlanCode } from "@/domain/billing/entitlements";
import type { PlanCode } from "@/domain/billing/planConfig";
import { prisma } from "@/shared/db/prismaClient";

export type OperatorCustomizationCapability =
  | "baseline_studio"
  | "advanced_presets"
  | "premium_proposal_lane"
  | "llm_assisted_suggestions";

const PREMIUM_PRESET_IDS = new Set(["buyer_demo", "exception_ops"]);

/** Plans that unlock advanced preset packs (non-default layouts beyond baseline). */
function planAllowsAdvancedPresets(plan: PlanCode): boolean {
  return plan === "growth" || plan === "scale" || plan === "enterprise";
}

/** Future: enterprise + explicit flag; today always false until LLM lane ships. */
function planAllowsPremiumProposalLane(_plan: PlanCode): boolean {
  return false;
}

export type OperatorCustomizationEntitlements = {
  planCode: PlanCode;
  capabilities: Record<OperatorCustomizationCapability, boolean>;
};

export async function getOperatorCustomizationEntitlementsForTenant(
  tenantId: string
): Promise<OperatorCustomizationEntitlements> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { billingAccountId: true },
  });

  const planCode: PlanCode =
    tenant?.billingAccountId != null
      ? await getAccountPlanCode(tenant.billingAccountId)
      : "starter";

  const advancedPresets = planAllowsAdvancedPresets(planCode);
  const premiumLane = planAllowsPremiumProposalLane(planCode);

  return {
    planCode,
    capabilities: {
      baseline_studio: true,
      advanced_presets: advancedPresets,
      premium_proposal_lane: premiumLane,
      llm_assisted_suggestions: premiumLane,
    },
  };
}

export function isPresetIdEntitled(
  presetId: string,
  entitlements: OperatorCustomizationEntitlements
): boolean {
  if (!PREMIUM_PRESET_IDS.has(presetId)) return true;
  return entitlements.capabilities.advanced_presets === true;
}

export function assertPremiumProposalLaneAllowed(entitlements: OperatorCustomizationEntitlements): {
  ok: true;
} | { ok: false; code: "premium_lane_not_entitled" } {
  if (entitlements.capabilities.premium_proposal_lane) return { ok: true };
  return { ok: false, code: "premium_lane_not_entitled" };
}
