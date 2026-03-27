#!/usr/bin/env tsx
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

type RegistryRoute = {
  route: string;
  kind: "next-app-router" | "edge-function" | "rpc-endpoint" | "internal-service-endpoint";
  file: string;
};

type Status = "verified" | "exempt" | "missing" | "unreadable";

type ExemptionRule = {
  prefix: string;
  reason: string;
};

const repoRoot = process.cwd();
const registryPath = path.join(repoRoot, "security", "route-registry.json");

const TENANT_CONTROL_TOKENS = [
  "tenantId",
  "tenant_id",
  "ctx.tenantId",
  "buildContext(",
  "set_tenant_context",
  "get_user_tenant_ids",
  "authenticateApiKey(",
  "withSecurity(",
  "RLS",
  "row level security",
  "authorizeTenant",
  "requireTenant",
  "requireAuth(",
  "withTrustRun(",
  "isSuperAdmin(",
  "withUniversalBillingGate(",
  "withApiWrapper(",
  "supabase.auth.getUser()",
  '.eq("user_id", user.id)',
];

const EXEMPT_ROUTE_RULES: ExemptionRule[] = [
  { prefix: "/api/health", reason: "health endpoint (no tenant data contract)" },
  { prefix: "/api/status", reason: "status endpoint (no tenant data contract)" },
  { prefix: "/api/docs", reason: "docs endpoint (public by design)" },
  { prefix: "/api/public", reason: "public endpoint namespace" },
  { prefix: "/api/demo/", reason: "public demo dataset (read-only showcase; not tenant-scoped)" },
  { prefix: "/api/seo", reason: "SEO/public metadata route" },
  { prefix: "/api/stripe/webhook", reason: "signed webhook endpoint" },
  { prefix: "/api/cron/", reason: "scheduled system endpoint" },
  { prefix: "/api/admin/", reason: "admin endpoint with separate admin auth model" },
  { prefix: "/api/internal/health", reason: "internal health endpoint" },
  { prefix: "/api/gtm/", reason: "public analytics endpoint" },
  { prefix: "/api/legal/", reason: "public legal endpoint" },
  { prefix: "/api/vercel-example", reason: "non-production example endpoint" },
  { prefix: "/api/v1/health", reason: "health endpoint" },
  { prefix: "/api/v1/meta", reason: "metadata endpoint" },
  { prefix: "/api/v1/ready", reason: "readiness endpoint" },
  { prefix: "/api/builder/revalidate", reason: "signed revalidation endpoint" },
  { prefix: "/edge/", reason: "edge function: verified via Supabase function controls" },
  { prefix: "rpc:", reason: "RPC/internal surface: separately reviewed" },
];

function matchExemption(route: string): ExemptionRule | null {
  for (const rule of EXEMPT_ROUTE_RULES) {
    if (route === rule.prefix || route.startsWith(rule.prefix)) {
      return rule;
    }
  }
  return null;
}

function isTenantBoundRoute(route: RegistryRoute): {
  tenantBound: boolean;
  exemption: ExemptionRule | null;
} {
  if (!route.route.startsWith("/api")) {
    return { tenantBound: false, exemption: { prefix: route.route, reason: "non-api route" } };
  }

  const exemption = matchExemption(route.route);
  if (exemption) {
    return { tenantBound: false, exemption };
  }

  return { tenantBound: true, exemption: null };
}

function evaluateRoute(route: RegistryRoute): {
  status: Status;
  reason: string;
  matchedToken?: string;
} {
  const { tenantBound, exemption } = isTenantBoundRoute(route);
  if (!tenantBound) {
    return { status: "exempt", reason: exemption?.reason || "explicit exemption" };
  }

  let content = "";
  try {
    content = readFileSync(path.join(repoRoot, route.file), "utf8");
  } catch (error) {
    return {
      status: "unreadable",
      reason: `route file unreadable: ${error instanceof Error ? error.message : String(error)}`,
    };
  }

  const matchedToken = TENANT_CONTROL_TOKENS.find((token) => content.includes(token));
  if (matchedToken) {
    return {
      status: "verified",
      reason: `tenant control token detected: ${matchedToken}`,
      matchedToken,
    };
  }

  return {
    status: "missing",
    reason: "no tenant isolation control token matched for tenant-bound route",
  };
}

function main(): void {
  const registry = JSON.parse(readFileSync(registryPath, "utf8")) as {
    routes: RegistryRoute[];
  };

  const results = registry.routes
    .filter(
      (route) => route.kind === "next-app-router" || route.kind === "internal-service-endpoint"
    )
    .map((route) => {
      const evaluation = evaluateRoute(route);
      return {
        ...route,
        ...evaluation,
      };
    });

  const exempt = results.filter((entry) => entry.status === "exempt");
  const tenantScopedRoutes = results.filter(
    (entry) => entry.status !== "exempt" && entry.status !== "unreadable"
  );
  const unreadable = results.filter((entry) => entry.status === "unreadable");
  const verified = tenantScopedRoutes.filter((entry) => entry.status === "verified");
  const missing = tenantScopedRoutes.filter((entry) => entry.status === "missing");

  const coverage =
    tenantScopedRoutes.length === 0 ? 100 : (verified.length / tenantScopedRoutes.length) * 100;

  console.log("ROUTE COVERAGE REPORT");
  console.log("---------------------");
  console.log(`routes discovered: ${registry.routes.length}`);
  console.log(`tenant-scoped routes: ${tenantScopedRoutes.length}`);
  console.log(`routes verified: ${verified.length}`);
  console.log(`routes exempt: ${exempt.length}`);
  console.log(`routes unreadable: ${unreadable.length}`);
  console.log(`coverage: ${coverage.toFixed(2)}%`);

  const outputPath = path.join(repoRoot, "artifacts", "security", "tenant-coverage-latest.json");
  mkdirSync(path.dirname(outputPath), { recursive: true });

  const artifact = {
    generatedAt: new Date().toISOString(),
    verifierVersion: "2026-03-07.2",
    verificationMode: "static-token-presence",
    proofBoundary:
      "Static control-presence verification only. Runtime denial behavior is proven by test:cross-tenant and runtime smoke suites.",
    totalRoutes: registry.routes.length,
    tenantScopedRoutes: tenantScopedRoutes.length,
    verifiedRoutes: verified.length,
    exemptRoutes: exempt.map((route) => ({
      route: route.route,
      file: route.file,
      reason: route.reason,
    })),
    missingRoutes: missing.map((route) => ({
      route: route.route,
      file: route.file,
      reason: route.reason,
    })),
    unreadableRoutes: unreadable.map((route) => ({
      route: route.route,
      file: route.file,
      reason: route.reason,
    })),
    coveragePct: Number(coverage.toFixed(2)),
    degraded: unreadable.length > 0,
  };

  writeFileSync(outputPath, JSON.stringify(artifact, null, 2) + "\n", "utf8");

  if (missing.length > 0 || unreadable.length > 0) {
    console.log("\nTenant coverage verification failures:");
    for (const route of missing) {
      console.log(`- missing: ${route.route} (${route.file}) -> ${route.reason}`);
    }
    for (const route of unreadable) {
      console.log(`- unreadable: ${route.route} (${route.file}) -> ${route.reason}`);
    }
    process.exit(1);
  }
}

main();
