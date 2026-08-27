import type { PlanCode } from "@/domain/billing/planConfig";

/**
 * Premium capability packs — additive overlays on top of base plans (`planConfig`).
 * Each pack maps to real console surfaces; do not claim features without a route or API contract.
 */
export type PremiumPackCode =
  | "exception_intelligence"
  | "evidence_audit"
  | "api_automation"
  | "ai_augmentation"
  | "managed_reliability";

export interface PremiumPack {
  code: PremiumPackCode;
  name: string;
  summary: string;
  /** Console routes that materially deliver this pack today */
  consoleRoutes: readonly string[];
  /** Typical base plan this pack stacks on (not a hard entitlement gate here) */
  suggestedBasePlan: PlanCode;
}

export const PREMIUM_PACKS: readonly PremiumPack[] = [
  {
    code: "exception_intelligence",
    name: "Exception Intelligence",
    summary:
      "Exception queues, severity triage, analytics rollups, and bounded AI insights with explicit degraded states when providers are absent.",
    consoleRoutes: ["/console/exceptions", "/console/analytics", "/console/insights"],
    suggestedBasePlan: "pro",
  },
  {
    code: "evidence_audit",
    name: "Evidence & audit",
    summary:
      "Proof explorer, audit trail, and export-oriented surfaces for replayable, reviewable artifacts.",
    consoleRoutes: ["/console/proof-explorer", "/console/audit-trail", "/console/audits"],
    suggestedBasePlan: "pro",
  },
  {
    code: "api_automation",
    name: "API & automation",
    summary:
      "Programmatic execution, keys, webhooks, and workflow scaffolding (where marked thin/restricted in route maturity).",
    consoleRoutes: ["/console/api-keys", "/console/developers/webhooks", "/console/workflows"],
    suggestedBasePlan: "pro",
  },
  {
    code: "ai_augmentation",
    name: "AI augmentation",
    summary:
      "Advisory summarization and insight surfaces only; never a substitute for deterministic run truth.",
    consoleRoutes: ["/console/insights"],
    suggestedBasePlan: "pro",
  },
  {
    code: "managed_reliability",
    name: "Managed reliability",
    summary:
      "Human-in-the-loop operations and named-operator coverage — sold as Managed / Enterprise offers, not a console toggle.",
    consoleRoutes: [],
    suggestedBasePlan: "scale",
  },
] as const;

export function getPremiumPack(code: PremiumPackCode): PremiumPack | undefined {
  return PREMIUM_PACKS.find((p) => p.code === code);
}
