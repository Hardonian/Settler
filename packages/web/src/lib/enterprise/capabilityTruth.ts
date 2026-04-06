export type CapabilityState = "verified" | "implemented_unverified" | "staged" | "missing";

export interface EnterpriseCapabilityTruth {
  capability: string;
  state: CapabilityState;
  customerLabel: string;
  operatorBoundary: string;
  verificationPath: readonly string[];
}

/**
 * Canonical enterprise capability truth map.
 *
 * Purpose: keep pricing/enterprise/security pages aligned with runtime evidence.
 */
export const ENTERPRISE_CAPABILITY_TRUTH: readonly EnterpriseCapabilityTruth[] = [
  {
    capability: "Tenant-scoped RBAC",
    state: "verified",
    customerLabel: "Available",
    operatorBoundary: "Role + tenant-scoped authorization is active in API/web paths.",
    verificationPath: ["pnpm run verify:tenant", "pnpm run test:cross-tenant"],
  },
  {
    capability: "SSO (SAML/OIDC)",
    state: "implemented_unverified",
    customerLabel: "Config-gated",
    operatorBoundary:
      "Configuration flags exist, but general IdP interoperability is not marked GA without per-IdP evidence.",
    verificationPath: ["SUPABASE_ENTERPRISE_SSO_* env contract", "IdP-specific smoke tests (required before GA claim)"],
  },
  {
    capability: "SCIM lifecycle provisioning",
    state: "staged",
    customerLabel: "Staged",
    operatorBoundary:
      "Enterprise lifecycle is documented, but route-level provisioning verification is not yet complete.",
    verificationPath: ["Route + fixture lifecycle tests (pending)", "Deprovisioning evidence bundle (pending)"],
  },
  {
    capability: "Audit export / SIEM handoff",
    state: "implemented_unverified",
    customerLabel: "Available with validation scope",
    operatorBoundary:
      "Export routes exist; downstream SIEM mappings vary by deployment and require buyer validation.",
    verificationPath: ["pnpm run verify:security:evidence", "tenant-scoped export contract tests"],
  },
];

export function getCapabilityStateBadgeClass(state: CapabilityState): string {
  switch (state) {
    case "verified":
      return "bg-emerald-500/10 text-emerald-700 border-emerald-600/30";
    case "implemented_unverified":
      return "bg-amber-500/10 text-amber-700 border-amber-600/30";
    case "staged":
      return "bg-slate-500/10 text-slate-700 border-slate-500/30";
    case "missing":
      return "bg-rose-500/10 text-rose-700 border-rose-500/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

export function getCapabilityStateLabel(state: CapabilityState): string {
  switch (state) {
    case "verified":
      return "Verified";
    case "implemented_unverified":
      return "Implemented / unverified";
    case "staged":
      return "Staged";
    case "missing":
      return "Missing";
    default:
      return "Unknown";
  }
}
