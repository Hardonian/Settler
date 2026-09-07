/**
 * Canonical commercial spine for Settler (plans, packs, meters, legacy mappings).
 *
 * Single source of truth for product/billing surfaces. Runtime code may still read
 * Stripe price IDs and secrets from environment variables; this module owns numeric
 * limits, descriptors, and taxonomy — not secrets.
 */
export const USAGE_METERS = [
    {
        id: "reconciliation_run",
        label: "Reconciliation runs",
        unit: "run",
        billable: true,
        notes: "Primary reliance meter; aligns to plan included volume.",
    },
    {
        id: "records_processed",
        label: "Records processed",
        unit: "record",
        billable: true,
        notes: "Row/record throughput inside runs; used for capacity and cost attribution.",
    },
    {
        id: "replay_job",
        label: "Replay jobs",
        unit: "job",
        billable: false,
        notes: "Deterministic replay of prior runs; not a curiosity tax.",
    },
    {
        id: "export_job",
        label: "Export jobs",
        unit: "job",
        billable: false,
        notes: "Evidence / data export pipelines.",
    },
    {
        id: "proof_generation",
        label: "Proof / evidence generation",
        unit: "artifact",
        billable: false,
        notes: "Proof packages and evidence bundles.",
    },
    {
        id: "automation_execution",
        label: "Automation executions",
        unit: "execution",
        billable: false,
        notes: "Scheduled workflows and automation triggers.",
    },
    {
        id: "webhook_event",
        label: "Webhook / inbound events",
        unit: "event",
        billable: false,
        notes: "Ingress throughput for connectors.",
    },
    {
        id: "api_request",
        label: "API requests (meaningful)",
        unit: "request",
        billable: false,
        notes: "Control-plane API calls where metered; excludes read-only truth surfaces.",
    },
    {
        id: "ai_augmentation_event",
        label: "AI augmentation events",
        unit: "event",
        billable: false,
        notes: "Optional augmentation; must not gate access to customer-owned deterministic truth.",
    },
    {
        id: "storage_retention_gb_day",
        label: "Storage × retention",
        unit: "gb_day",
        billable: false,
        notes: "Evidence retention dimension for enterprise quotes.",
    },
];
export const PLAN_SPINE = {
    starter: {
        code: "starter",
        name: "Starter",
        description: "First 10,000 reconciliations free",
        monthlyPrice: 0,
        limits: {
            reconcile: {
                monthlyVolume: 10_000,
                pricePerReconciliation: 0.01,
            },
            exceptions: {
                includedRate: 0.01,
                pricePerException: 0.1,
            },
        },
        marketing: {
            publicLine: "Free tier for validation; volume + exception supervision beyond included limits.",
            internalBillingDescriptor: "starter_volume_exception_supervision",
        },
        capabilities: {
            managedServiceDefault: false,
            enterpriseDeployment: false,
            aiAugmentationEligible: true,
            dedicatedSupport: false,
        },
        legacyQuotas: {
            reconciliationsPerMonth: 10_000,
            logRetentionDays: 7,
            platformAdapters: 2,
            playground: { runsPerDay: 3, advancedFeatures: false },
            support: "community",
        },
    },
    pro: {
        code: "pro",
        name: "Pro",
        description: "For growing businesses",
        monthlyPrice: 99,
        limits: {
            reconcile: {
                monthlyVolume: 100_000,
                pricePerReconciliation: 0.01,
            },
            exceptions: {
                includedRate: 0.01,
                pricePerException: 0.1,
            },
        },
        marketing: {
            publicLine: "Usage-based cloud control plane with metered reconciliation and exception supervision.",
            internalBillingDescriptor: "pro_volume_exception_supervision",
        },
        capabilities: {
            managedServiceDefault: false,
            enterpriseDeployment: false,
            aiAugmentationEligible: true,
            dedicatedSupport: false,
        },
        legacyQuotas: {
            reconciliationsPerMonth: 100_000,
            logRetentionDays: 30,
            platformAdapters: "unlimited",
            playground: { runsPerDay: "unlimited", advancedFeatures: true },
            support: "email",
        },
    },
    scale: {
        code: "scale",
        name: "Scale",
        description: "For high-volume operations",
        monthlyPrice: 399,
        limits: {
            reconcile: {
                monthlyVolume: 1_000_000,
                pricePerReconciliation: 0.01,
            },
            exceptions: {
                includedRate: 0.01,
                pricePerException: 0.1,
            },
        },
        marketing: {
            publicLine: "High-volume operations; optional managed operations engagement.",
            internalBillingDescriptor: "scale_volume_exception_supervision",
        },
        capabilities: {
            managedServiceDefault: true,
            enterpriseDeployment: false,
            aiAugmentationEligible: true,
            dedicatedSupport: true,
        },
        legacyQuotas: {
            reconciliationsPerMonth: 1_000_000,
            logRetentionDays: 90,
            platformAdapters: "unlimited",
            playground: { runsPerDay: "unlimited", advancedFeatures: true },
            support: "priority",
        },
    },
    enterprise: {
        code: "enterprise",
        name: "Enterprise",
        description: "Custom volume and exception thresholds",
        monthlyPrice: 0,
        limits: {
            reconcile: {
                monthlyVolume: 0,
                pricePerReconciliation: 0.008,
            },
            exceptions: {
                includedRate: 0.015,
                pricePerException: 0.08,
            },
        },
        marketing: {
            publicLine: "Dedicated / VPC / on-prem with contractual controls and custom metering.",
            internalBillingDescriptor: "enterprise_contract_custom",
        },
        capabilities: {
            managedServiceDefault: false,
            enterpriseDeployment: true,
            aiAugmentationEligible: true,
            dedicatedSupport: true,
        },
        legacyQuotas: {
            reconciliationsPerMonth: "unlimited",
            logRetentionDays: "unlimited",
            platformAdapters: "unlimited",
            playground: { runsPerDay: "unlimited", advancedFeatures: true },
            support: "dedicated",
        },
    },
};
/** Default MRR when subscription metadata does not carry explicit revenue (USD). */
export const PLAN_DEFAULT_MRR_USD = {
    starter: 0,
    pro: 99,
    scale: 399,
    enterprise: 0,
};
export const LEGACY_SUBSCRIPTION_PLAN_ID_MAP = {
    base: "starter",
    free: "starter",
    starter: "starter",
    pro: "pro",
    commercial: "pro",
    growth: "pro",
    scale: "scale",
    enterprise: "enterprise",
};
export const PREMIUM_PACKS = {
    exceptionIntelligence: {
        id: "exception_intelligence",
        integrationId: "exception-intelligence-pack",
        name: "Exception Intelligence Pack",
        publicDescriptor: "Cross-run recurring family view, evidence-backed prioritization, and bounded next-action prompts from adjudication history.",
        ownedCapabilities: [
            "cross_run_family_ranking",
            "adjudication_backed_prioritization",
            "recurrence_posture",
            "bounded_next_actions",
        ],
        requiresAddOnRow: true,
    },
};
export function mapLegacySubscriptionPlanId(planId) {
    const normalized = planId.trim().toLowerCase();
    return LEGACY_SUBSCRIPTION_PLAN_ID_MAP[normalized] ?? "starter";
}
export function getPlanSpine(planCode) {
    const code = planCode;
    return code in PLAN_SPINE ? PLAN_SPINE[code] : null;
}
export function getDefaultPlanCode() {
    return "starter";
}
/**
 * Map API/user legacy plan_type string to canonical {@link PlanCode}.
 */
export function mapLegacyPlanTypeToPlanCode(planType) {
    const t = planType.trim().toLowerCase();
    if (t === "starter" || t === "pro" || t === "scale" || t === "enterprise") {
        return t;
    }
    // Stripe/subscription-era plan IDs that predate the canonical PlanCode taxonomy.
    // These must stay here so billing-gating middleware aligns with the canonical hierarchy.
    const extendedMap = {
        free: "starter", // free tier → starter capability level
        trial: "pro",
        commercial: "pro",
        base: "starter", // legacy "base" plan → starter
        growth: "pro", // legacy "growth" plan → pro
    };
    return extendedMap[t] ?? "starter";
}
export function getLegacyQuotaProfile(planCode) {
    return PLAN_SPINE[planCode].legacyQuotas;
}
export function getReconciliationVolumeLimit(planCode) {
    const vol = PLAN_SPINE[planCode].limits.reconcile.monthlyVolume;
    return vol;
}
export function getExceptionThreshold(planCode, reconciliationVolume) {
    const rate = PLAN_SPINE[planCode].limits.exceptions.includedRate;
    return Math.floor(reconciliationVolume * rate);
}
const STARTER_API_FEATURES = {
    cookbooks: ["ecommerce-shopify-stripe", "scheduled-reconciliations", "error-handling"],
    docs: ["getting-started", "installation", "api-reference-basic"],
    playground: { runsPerDay: 3, advancedFeatures: false },
    consulting: false,
    emailAnalysis: { enabled: true, reportsPerMonth: 5 },
    workflows: { maxWorkflows: 2, advancedWorkflows: false },
    support: "community",
};
const PRO_API_FEATURES = {
    cookbooks: "all",
    docs: "all",
    playground: { runsPerDay: "unlimited", advancedFeatures: true },
    consulting: false,
    emailAnalysis: { enabled: true, reportsPerMonth: "unlimited" },
    workflows: { maxWorkflows: "unlimited", advancedWorkflows: true },
    support: "email",
};
const SCALE_API_FEATURES = {
    ...PRO_API_FEATURES,
    support: "priority",
    consulting: false,
};
const ENTERPRISE_API_FEATURES = {
    cookbooks: "all",
    docs: "all",
    playground: { runsPerDay: "unlimited", advancedFeatures: true },
    consulting: true,
    emailAnalysis: { enabled: true, reportsPerMonth: "unlimited" },
    workflows: { maxWorkflows: "unlimited", advancedWorkflows: true },
    support: "dedicated",
};
export const API_LEGACY_PLAN_FEATURES = {
    starter: STARTER_API_FEATURES,
    pro: PRO_API_FEATURES,
    scale: SCALE_API_FEATURES,
    enterprise: ENTERPRISE_API_FEATURES,
};
export function getApiLegacyPlanLimits(planCode) {
    const q = PLAN_SPINE[planCode].legacyQuotas;
    return {
        reconciliationsPerMonth: q.reconciliationsPerMonth,
        logRetentionDays: q.logRetentionDays,
        platformAdapters: q.platformAdapters,
    };
}
export function getApiLegacyPlanFeatures(planCode) {
    return API_LEGACY_PLAN_FEATURES[planCode];
}
export function calculatePlanMonthlyCostUsd(planCode, reconciliationVolume, exceptionsRequiringReview) {
    const plan = PLAN_SPINE[planCode];
    let cost = plan.monthlyPrice;
    const includedVolume = plan.limits.reconcile.monthlyVolume;
    if (includedVolume > 0 && reconciliationVolume > includedVolume) {
        cost += (reconciliationVolume - includedVolume) * plan.limits.reconcile.pricePerReconciliation;
    }
    const includedExceptions = getExceptionThreshold(planCode, reconciliationVolume);
    if (exceptionsRequiringReview > includedExceptions) {
        cost +=
            (exceptionsRequiringReview - includedExceptions) * plan.limits.exceptions.pricePerException;
    }
    return cost;
}
//# sourceMappingURL=commercial-spine.js.map