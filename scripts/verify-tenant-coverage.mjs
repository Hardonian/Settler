#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TENANT_CONTROL_TOKENS = [
  "tenantId",
  "tenant_id",
  "ctx.tenantId",
  "req.tenantId",
  "req.tenantId!",
  "buildContext(",
  "set_tenant_context",
  "get_user_tenant_ids",
  "authenticateApiKey(",
  "withSecurity(",
  "withUniversalBillingGate(",
  "resolveTenantMembershipScope(",
  "resolveTenantForMutation(",
  "requirePermission(",
  "requireTenantContext(",
  "authorizeTenantActionOr403(",
  "tenantMiddleware",
  "resolveOperatorRunDetailForTenants(",
  "validateExceptionAccess(",
  "RLS",
  "row level security",
  "authorizeTenant",
  "requireTenant",
  "requireAuth(",
  "withTrustRun(",
  "isSuperAdmin(",
  "withApiWrapper(",
  "supabase.auth.getUser()",
  '.eq("user_id", user.id)',
];

const EXEMPT_ROUTE_RULES = [
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
  { prefix: "/api/v1/openapi.json", reason: "OpenAPI spec endpoint" },
  { prefix: "/api/v1/docs", reason: "OpenAPI docs endpoint" },
  { prefix: "/api/v1/playground", reason: "public playground endpoint" },
  { prefix: "/api/v2/playground", reason: "public playground endpoint" },
  { prefix: "/api/v2/health", reason: "health endpoint" },
  { prefix: "/api/v1/auth/login", reason: "public auth login endpoint" },
  { prefix: "/api/v1/auth/refresh", reason: "public token refresh endpoint" },
  { prefix: "/api/v2/auth/login", reason: "public auth login endpoint" },
  { prefix: "/api/v2/auth/refresh", reason: "public token refresh endpoint" },
  { prefix: "/api/v1/auth/api-keys", reason: "authenticated user credential management" },
  { prefix: "/api/v2/auth/api-keys", reason: "authenticated user credential management" },
  { prefix: "/api/csrf-token", reason: "csrf token bootstrap endpoint" },
  { prefix: "/api/builder/revalidate", reason: "signed revalidation endpoint" },
  { prefix: "/edge/", reason: "edge function: verified via Supabase function controls" },
  { prefix: "rpc:", reason: "RPC/internal surface: separately reviewed" },
];

function matchExemption(route) {
  for (const rule of EXEMPT_ROUTE_RULES) {
    if (route === rule.prefix || route.startsWith(rule.prefix)) {
      return rule;
    }
  }
  return null;
}

export function isTenantBoundRoute(route) {
  if (!route.route.startsWith("/api")) {
    return { tenantBound: false, exemption: { prefix: route.route, reason: "non-api route" } };
  }

  const exemption = matchExemption(route.route);
  if (exemption) {
    return { tenantBound: false, exemption };
  }

  return { tenantBound: true, exemption: null };
}

export function evaluateRoute(repoRoot, route) {
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

export function loadRouteRegistry(repoRoot = process.cwd()) {
  const registryPath = path.join(repoRoot, "artifacts", "security", "route-registry.json");
  if (!existsSync(registryPath)) {
    return {
      ok: false,
      registryPath,
      reason:
        "Route registry artifact missing. Run `pnpm run security:routes` first so tenant coverage can evaluate the current surface inventory.",
    };
  }

  return {
    ok: true,
    registryPath,
    registry: JSON.parse(readFileSync(registryPath, "utf8")),
  };
}

export function generateTenantCoverageArtifact(repoRoot = process.cwd()) {
  const registryResult = loadRouteRegistry(repoRoot);
  const outputPath = path.join(repoRoot, "artifacts", "security", "tenant-coverage-latest.json");
  mkdirSync(path.dirname(outputPath), { recursive: true });

  if (!registryResult.ok) {
    const artifact = {
      generatedAt: new Date().toISOString(),
      verifierVersion: "2026-04-01.1",
      verificationMode: "static-token-presence",
      proofBoundary:
        "Static control-presence verification only. Runtime denial behavior is proven by test:cross-tenant and runtime smoke suites.",
      totalRoutes: 0,
      tenantScopedRoutes: 0,
      verifiedRoutes: 0,
      exemptRoutes: [],
      missingRoutes: [],
      unreadableRoutes: [],
      coveragePct: 0,
      degraded: true,
      degradedReasons: ["route_registry_missing"],
      error: registryResult.reason,
      registryPath: path.relative(repoRoot, registryResult.registryPath),
    };
    writeFileSync(outputPath, JSON.stringify(artifact, null, 2) + "\n", "utf8");
    return { artifact, outputPath, missing: [], unreadable: [] };
  }

  const registry = registryResult.registry;
  const results = registry.routes
    .filter(
      (route) =>
        route.kind === "next-app-router" ||
        route.kind === "internal-service-endpoint" ||
        route.kind === "express-router"
    )
    .map((route) => ({
      ...route,
      ...evaluateRoute(repoRoot, route),
    }));

  const exempt = results.filter((entry) => entry.status === "exempt");
  const tenantScopedRoutes = results.filter(
    (entry) => entry.status !== "exempt" && entry.status !== "unreadable"
  );
  const unreadable = results.filter((entry) => entry.status === "unreadable");
  const verified = tenantScopedRoutes.filter((entry) => entry.status === "verified");
  const missing = tenantScopedRoutes.filter((entry) => entry.status === "missing");

  const coverage =
    tenantScopedRoutes.length === 0 ? 100 : (verified.length / tenantScopedRoutes.length) * 100;

  const artifact = {
    generatedAt: new Date().toISOString(),
    verifierVersion: "2026-04-01.1",
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
    degradedReasons: unreadable.length > 0 ? ["route_file_unreadable"] : [],
  };

  writeFileSync(outputPath, JSON.stringify(artifact, null, 2) + "\n", "utf8");
  return { artifact, outputPath, missing, unreadable };
}

function printSummary(result) {
  const { artifact, missing, unreadable } = result;

  console.log("ROUTE COVERAGE REPORT");
  console.log("---------------------");
  console.log(`routes discovered: ${artifact.totalRoutes}`);
  console.log(`tenant-scoped routes: ${artifact.tenantScopedRoutes}`);
  console.log(`routes verified: ${artifact.verifiedRoutes}`);
  console.log(`routes exempt: ${artifact.exemptRoutes.length}`);
  console.log(`routes unreadable: ${artifact.unreadableRoutes.length}`);
  console.log(`coverage: ${artifact.coveragePct.toFixed(2)}%`);

  if (artifact.error) {
    console.log(`\nTenant coverage verification degraded: ${artifact.error}`);
    process.exit(1);
  }

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

function isMain() {
  return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}

if (isMain()) {
  printSummary(generateTenantCoverageArtifact(process.cwd()));
}
