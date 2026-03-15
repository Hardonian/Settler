export type RouteFamily = "console" | "app" | "dashboard" | "admin" | "operator";

export type RouteMaturityClass =
  | "runtime-operational"
  | "runtime-degraded-without-env"
  | "runtime-degraded-without-tenant"
  | "runtime-degraded-without-provider"
  | "informational"
  | "thin"
  | "admin-only";

export type RuntimeDependencyClass = "none" | "supabase" | "stripe" | "providers" | "hybrid";

export interface OperationalRouteEntry {
  family: RouteFamily;
  routePrefix: string;
  routeGroupLabel: string;
  domain:
    | "control-plane"
    | "reconciliation"
    | "evidence"
    | "governance"
    | "integrations"
    | "billing"
    | "operations"
    | "admin";
  maturity: RouteMaturityClass;
  runtimeDependency: RuntimeDependencyClass;
  authRequired: boolean;
  tenantScopeRequired: boolean;
  roleRestriction: "none" | "super-admin";
  providerRequirement: "none" | "optional" | "required";
  billingRequirement: "none" | "optional" | "required";
  databaseRequired: boolean;
  supabaseRequired: boolean;
  stripeRequired: boolean;
  operationalClass: "operational" | "informational" | "synthetic" | "partial" | "restricted";
  degradedBehavior: string;
  disclosureRequired: boolean;
  navTreatment: "primary" | "secondary" | "restricted";
  ctaRestrictions: "none" | "read-only" | "disabled";
  dataMode: "operational" | "informational" | "synthetic" | "restricted";
  syntheticDataAllowed: boolean;
  scopeSignal: "tenant" | "global";
}

export const OPERATIONAL_ROUTE_REGISTRY: readonly OperationalRouteEntry[] = [
  {
    family: "console",
    routePrefix: "/console",
    routeGroupLabel: "Console control plane",
    domain: "control-plane",
    maturity: "runtime-degraded-without-env",
    runtimeDependency: "hybrid",
    authRequired: true,
    tenantScopeRequired: true,
    roleRestriction: "none",
    providerRequirement: "optional",
    billingRequirement: "optional",
    databaseRequired: true,
    supabaseRequired: true,
    stripeRequired: false,
    operationalClass: "partial",
    degradedBehavior:
      "Routes stay reachable but disclose when tenant, provider, or env dependencies are missing.",
    disclosureRequired: true,
    navTreatment: "primary",
    ctaRestrictions: "read-only",
    dataMode: "operational",
    syntheticDataAllowed: false,
    scopeSignal: "tenant",
  },
  {
    family: "console",
    routePrefix: "/console/replay",
    routeGroupLabel: "Console replay surfaces",
    domain: "reconciliation",
    maturity: "thin",
    runtimeDependency: "providers",
    authRequired: true,
    tenantScopeRequired: true,
    roleRestriction: "none",
    providerRequirement: "required",
    billingRequirement: "none",
    databaseRequired: true,
    supabaseRequired: true,
    stripeRequired: false,
    operationalClass: "synthetic",
    degradedBehavior:
      "Replay views are explicitly labeled synthetic when providers or history are missing.",
    disclosureRequired: true,
    navTreatment: "secondary",
    ctaRestrictions: "disabled",
    dataMode: "synthetic",
    syntheticDataAllowed: true,
    scopeSignal: "tenant",
  },
  {
    family: "app",
    routePrefix: "/app",
    routeGroupLabel: "Authenticated app shell",
    domain: "operations",
    maturity: "runtime-degraded-without-tenant",
    runtimeDependency: "supabase",
    authRequired: true,
    tenantScopeRequired: true,
    roleRestriction: "none",
    providerRequirement: "optional",
    billingRequirement: "none",
    databaseRequired: true,
    supabaseRequired: true,
    stripeRequired: false,
    operationalClass: "partial",
    degradedBehavior:
      "Shell renders with explicit tenant-scope messaging when tenant metadata is absent.",
    disclosureRequired: true,
    navTreatment: "primary",
    ctaRestrictions: "read-only",
    dataMode: "operational",
    syntheticDataAllowed: false,
    scopeSignal: "tenant",
  },
  {
    family: "app",
    routePrefix: "/app/replay",
    routeGroupLabel: "Authenticated replay lab",
    domain: "reconciliation",
    maturity: "thin",
    runtimeDependency: "providers",
    authRequired: true,
    tenantScopeRequired: true,
    roleRestriction: "none",
    providerRequirement: "required",
    billingRequirement: "none",
    databaseRequired: true,
    supabaseRequired: true,
    stripeRequired: false,
    operationalClass: "synthetic",
    degradedBehavior: "Replay lab remains available but makes synthetic constraints explicit.",
    disclosureRequired: true,
    navTreatment: "secondary",
    ctaRestrictions: "disabled",
    dataMode: "synthetic",
    syntheticDataAllowed: true,
    scopeSignal: "tenant",
  },
  {
    family: "dashboard",
    routePrefix: "/dashboard",
    routeGroupLabel: "Customer dashboard",
    domain: "billing",
    maturity: "runtime-degraded-without-provider",
    runtimeDependency: "hybrid",
    authRequired: true,
    tenantScopeRequired: true,
    roleRestriction: "none",
    providerRequirement: "optional",
    billingRequirement: "optional",
    databaseRequired: true,
    supabaseRequired: true,
    stripeRequired: true,
    operationalClass: "partial",
    degradedBehavior:
      "Dashboard links remain stable and disclose unavailable billing/provider telemetry.",
    disclosureRequired: true,
    navTreatment: "secondary",
    ctaRestrictions: "read-only",
    dataMode: "operational",
    syntheticDataAllowed: false,
    scopeSignal: "tenant",
  },
  {
    family: "admin",
    routePrefix: "/admin",
    routeGroupLabel: "Super admin control surfaces",
    domain: "admin",
    maturity: "admin-only",
    runtimeDependency: "hybrid",
    authRequired: true,
    tenantScopeRequired: false,
    roleRestriction: "super-admin",
    providerRequirement: "optional",
    billingRequirement: "none",
    databaseRequired: true,
    supabaseRequired: true,
    stripeRequired: false,
    operationalClass: "restricted",
    degradedBehavior:
      "Access is denied for non-super-admin sessions with explicit scope messaging.",
    disclosureRequired: true,
    navTreatment: "restricted",
    ctaRestrictions: "disabled",
    dataMode: "restricted",
    syntheticDataAllowed: false,
    scopeSignal: "global",
  },
  {
    family: "operator",
    routePrefix: "/operator/incidents",
    routeGroupLabel: "Operator incidents",
    domain: "operations",
    maturity: "runtime-degraded-without-env",
    runtimeDependency: "hybrid",
    authRequired: true,
    tenantScopeRequired: false,
    roleRestriction: "super-admin",
    providerRequirement: "optional",
    billingRequirement: "none",
    databaseRequired: true,
    supabaseRequired: true,
    stripeRequired: false,
    operationalClass: "restricted",
    degradedBehavior:
      "Incident management is visible only to operators and declares backend dependency gaps.",
    disclosureRequired: true,
    navTreatment: "restricted",
    ctaRestrictions: "read-only",
    dataMode: "restricted",
    syntheticDataAllowed: false,
    scopeSignal: "global",
  },
] as const;

const byPrefixLengthDesc = [...OPERATIONAL_ROUTE_REGISTRY].sort(
  (a, b) => b.routePrefix.length - a.routePrefix.length
);

export function getOperationalRouteMeta(pathname: string): OperationalRouteEntry | null {
  const match = byPrefixLengthDesc.find(
    (entry) => pathname === entry.routePrefix || pathname.startsWith(`${entry.routePrefix}/`)
  );
  return match ?? null;
}
