export type SettlerPlan = "free" | "pro" | "enterprise";

export type EntitlementFeature =
  | "proofpack_exports"
  | "delta_intelligence"
  | "audit_logs"
  | "workflows"
  | "api_access";

export type EntitlementVerificationState = "VERIFIED" | "DEGRADED" | "UNAVAILABLE";

export type BillingLookupState = "verified" | "degraded" | "unavailable";

export interface EntitlementInput {
  feature: EntitlementFeature;
  planId?: string | null;
  subscriptionStatus?: string | null;
  billingLookupState?: BillingLookupState;
}

export interface EntitlementDecision {
  allowed: boolean;
  state: EntitlementVerificationState;
  plan: SettlerPlan;
  feature: EntitlementFeature;
  reason: string;
  requiredPlan: SettlerPlan;
  upgradeRequired: boolean;
}

const PLAN_RANK: Record<SettlerPlan, number> = {
  free: 0,
  pro: 1,
  enterprise: 2,
};

const FEATURE_MINIMUM_PLAN: Record<EntitlementFeature, SettlerPlan> = {
  proofpack_exports: "pro",
  delta_intelligence: "pro",
  audit_logs: "enterprise",
  workflows: "pro",
  api_access: "pro",
};

const ACTIVE_SUBSCRIPTION_STATES = new Set(["active", "trialing"]);

export function normalizeSettlerPlan(planId?: string | null): SettlerPlan {
  const normalized = (planId ?? "free")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-");

  if (normalized.includes("enterprise")) {
    return "enterprise";
  }

  if (
    normalized === "pro" ||
    normalized === "professional" ||
    normalized === "starter" ||
    normalized === "base" ||
    normalized === "growth" ||
    normalized === "scale" ||
    normalized === "paid"
  ) {
    return "pro";
  }

  return "free";
}

export function evaluateEntitlement(input: EntitlementInput): EntitlementDecision {
  const lookupState = input.billingLookupState ?? "verified";
  const plan = normalizeSettlerPlan(input.planId);
  const requiredPlan = FEATURE_MINIMUM_PLAN[input.feature];

  if (lookupState === "unavailable") {
    return {
      allowed: false,
      state: "UNAVAILABLE",
      plan,
      feature: input.feature,
      reason: "billing_lookup_unavailable",
      requiredPlan,
      upgradeRequired: false,
    };
  }

  if (lookupState === "degraded") {
    return {
      allowed: false,
      state: "DEGRADED",
      plan,
      feature: input.feature,
      reason: "billing_lookup_degraded",
      requiredPlan,
      upgradeRequired: false,
    };
  }

  if (
    input.subscriptionStatus &&
    !ACTIVE_SUBSCRIPTION_STATES.has(input.subscriptionStatus.toLowerCase())
  ) {
    return {
      allowed: false,
      state: "VERIFIED",
      plan: "free",
      feature: input.feature,
      reason: "subscription_not_active",
      requiredPlan,
      upgradeRequired: true,
    };
  }

  if (PLAN_RANK[plan] < PLAN_RANK[requiredPlan]) {
    return {
      allowed: false,
      state: "VERIFIED",
      plan,
      feature: input.feature,
      reason: "plan_upgrade_required",
      requiredPlan,
      upgradeRequired: true,
    };
  }

  return {
    allowed: true,
    state: "VERIFIED",
    plan,
    feature: input.feature,
    reason: "entitlement_verified",
    requiredPlan,
    upgradeRequired: false,
  };
}

export function entitlementResponseCapability(decision: EntitlementDecision): {
  state: EntitlementVerificationState;
  feature: EntitlementFeature;
  plan: SettlerPlan;
  requiredPlan: SettlerPlan;
  reason: string;
} {
  return {
    state: decision.state,
    feature: decision.feature,
    plan: decision.plan,
    requiredPlan: decision.requiredPlan,
    reason: decision.reason,
  };
}
