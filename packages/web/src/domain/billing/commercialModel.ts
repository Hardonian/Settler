import { PlanCode, planConfigs } from "@/domain/billing/planConfig";

export type OfferCode = "oss" | "cloud" | "managed" | "enterprise";

export interface CommercialOffer {
  code: OfferCode;
  name: string;
  headlinePrice: string;
  period?: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  evidencePosture: string;
  deployment: string;
  supportModel: string;
  planCode?: PlanCode;
}

/**
 * Canonical commercial model: OSS → Cloud API → Managed Ops → Enterprise Dedicated.
 *
 * Keep all marketing and console-adjacent pricing surfaces aligned to this owner.
 */
export const COMMERCIAL_OFFERS: CommercialOffer[] = [
  {
    code: "oss",
    name: "Open Source",
    headlinePrice: "$0",
    description: "Self-hosted engine for teams validating deterministic reconciliation flows.",
    ctaLabel: "Run OSS",
    ctaHref: "/docs/getting-started",
    evidencePosture: "Local evidence artifacts and replay traces",
    deployment: "Self-managed",
    supportModel: "Community",
    planCode: "starter",
  },
  {
    code: "cloud",
    name: "Cloud API",
    headlinePrice: `$${planConfigs.growth.monthlyPrice.toLocaleString()}`,
    period: "/mo",
    description: "Usage-based control plane with metered reconciliation volume and exception supervision.",
    ctaLabel: "Start Cloud",
    ctaHref: "/signup",
    evidencePosture: "Hosted run evidence, replay detail, and usage telemetry",
    deployment: "Multi-tenant cloud",
    supportModel: "Email",
    planCode: "growth",
  },
  {
    code: "managed",
    name: "Managed Operations",
    headlinePrice: `$${planConfigs.scale.monthlyPrice.toLocaleString()}+`,
    period: "/mo",
    description:
      "Operator-assisted reconciliation operations: onboarding, exception triage, monthly close, and audit packet prep.",
    ctaLabel: "Discuss Managed Ops",
    ctaHref: "/contact",
    evidencePosture: "Shared operator proofpacks, escalation ledger, and monthly close evidence",
    deployment: "Hosted with human-in-the-loop",
    supportModel: "Named operator + escalation",
    planCode: "scale",
  },
  {
    code: "enterprise",
    name: "Enterprise Dedicated",
    headlinePrice: "Custom",
    description: "Dedicated/VPC/on-prem deployment with contractual controls and custom policy envelope.",
    ctaLabel: "Contact Enterprise",
    ctaHref: "/contact",
    evidencePosture: "Audit export controls, retention controls, and architecture review",
    deployment: "Dedicated, VPC, or on-prem",
    supportModel: "SLA + security review",
    planCode: "enterprise",
  },
];

