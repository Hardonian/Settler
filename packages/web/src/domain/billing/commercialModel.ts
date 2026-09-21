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
    description:
      "Self-hosted engine for developers building verifiable financial matching pipelines.",
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
    headlinePrice: `$${planConfigs.pro.monthlyPrice.toLocaleString()}`,
    period: "/mo",
    description:
      "Hosted evaluation path with metered volume, evidence storage, and exception review surfaces.",
    ctaLabel: "Evaluate Cloud",
    ctaHref: "/signup",
    evidencePosture: "Hosted run evidence, replay detail, and usage telemetry",
    deployment: "Multi-tenant cloud",
    supportModel: "Email",
    planCode: "pro",
  },
  {
    code: "managed",
    name: "Managed Operations",
    headlinePrice: `$${planConfigs.scale.monthlyPrice.toLocaleString()}+`,
    period: "/mo",
    description:
      "Engagement-scoped operator assistance for runs, exceptions, and evidence-package preparation.",
    ctaLabel: "See what's included",
    ctaHref: "/managed",
    evidencePosture: "Shared operator proofpacks, escalation ledger, and monthly close evidence",
    deployment: "Hosted with human-in-the-loop",
    supportModel: "Named support scope by agreement",
    planCode: "scale",
  },
  {
    code: "enterprise",
    name: "Enterprise Dedicated",
    headlinePrice: "Custom",
    description:
      "Architecture-scoped deployment, retention, identity, and evidence controls for enterprise evaluation.",
    ctaLabel: "Contact Enterprise",
    ctaHref: "/contact",
    evidencePosture: "Export and retention controls reviewed during diligence",
    deployment: "Dedicated options subject to architecture review",
    supportModel: "Contract-defined support and security review",
    planCode: "enterprise",
  },
];
