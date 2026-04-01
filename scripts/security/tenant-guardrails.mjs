import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

export const highRiskRouteRules = [
  {
    route: "/api/v1/runs",
    classification: "tenant-bound",
    file: "packages/web/src/app/api/v1/runs/route.ts",
    mustInclude: [
      { token: "buildContext(request)", reason: "auth + tenant context required" },
      {
        token: 'applyRateLimit(ctx, "read")',
        reason: "read limiter required for tenant-bound route",
      },
      {
        token: 'applyRateLimit(ctx, "write")',
        reason: "write limiter required for tenant-bound mutations",
      },
      { token: "tenantId: ctx.tenantId", reason: "query must scope by tenantId" },
    ],
    manualValidation:
      "Requires runtime/API-key test to validate cross-tenant denial semantics end-to-end.",
  },
  {
    route: "/api/v1/runs/[id]",
    classification: "tenant-bound",
    file: "packages/web/src/app/api/v1/runs/[id]/route.ts",
    mustInclude: [
      { token: "buildContext(request)", reason: "auth + tenant context required" },
      { token: 'applyRateLimit(ctx, "read")', reason: "read limiter required" },
      { token: "getRun(ctx, id)", reason: "lookup must flow through tenant-scoped accessor" },
    ],
    manualValidation:
      "Requires authenticated call with mismatched tenant key to prove negative path.",
  },
  {
    route: "/api/v1/runs/[id]/evidence",
    classification: "tenant-bound",
    file: "packages/web/src/app/api/v1/runs/[id]/evidence/route.ts",
    mustInclude: [
      { token: "buildContext(request)", reason: "auth + tenant context required" },
      { token: "ctx.tenantId", reason: "evidence path/graph must stay tenant scoped" },
      { token: "getLatestResult(ctx, id)", reason: "tenant-scoped result retrieval required" },
    ],
    manualValidation:
      "Requires runtime probe with cross-tenant run id fixture for strict isolation assurance.",
  },
  {
    route: "/api/v1/runs/[id]/results",
    classification: "tenant-bound",
    file: "packages/web/src/app/api/v1/runs/[id]/results/route.ts",
    mustInclude: [
      { token: "buildContext(request)", reason: "auth + tenant context required" },
      { token: 'applyRateLimit(ctx, "read")', reason: "read limiter required" },
      { token: "getLatestResult(ctx, id)", reason: "tenant-scoped result retrieval required" },
    ],
    manualValidation:
      "Requires runtime fixture with mismatched tenant ownership to prove no leakage.",
  },
  {
    route: "/api/v1/recon/jobs",
    classification: "auth-optional / tenant-bound-when-authenticated",
    file: "packages/web/src/app/api/v1/recon/jobs/route.ts",
    mustInclude: [
      { token: "withSecurity(", reason: "route must stay behind security wrapper" },
      { token: "authenticateApiKey(request)", reason: "authenticated path must derive identity" },
      {
        token: "billingAccount?.tenantId",
        reason: "tenant should come from billing account lookup",
      },
      {
        token: "tenantId: billingAccount.tenantId",
        reason: "job creation must persist tenant scope",
      },
    ],
    manualValidation:
      "Public/demo path is intentional; runtime checks must verify it does not leak tenant data.",
  },
  {
    route: "/api/v1/runs (express)",
    classification: "tenant-bound",
    file: "packages/api/src/routes/runs.ts",
    mustInclude: [
      { token: "requirePermission(Permission.JOBS_READ)", reason: "read authz required" },
      { token: "req.tenantId!", reason: "tenant scope must come from authenticated request" },
      {
        token: "resolveOperatorRunDetailForTenants(",
        reason: "detail route must stay on canonical shared resolver",
      },
      {
        token: "where: { id: runId2, tenantId }",
        reason: "retry mutation must stay tenant-scoped",
      },
    ],
    manualValidation:
      "Requires authenticated API request with a foreign-tenant run id to prove denial end-to-end.",
  },
  {
    route: "/api/v1/exceptions (express)",
    classification: "tenant-bound",
    file: "packages/api/src/routes/exceptions.ts",
    mustInclude: [
      { token: "requirePermission(Permission.REPORTS_READ)", reason: "read authz required" },
      { token: "ExceptionReviewService", reason: "mutations must flow through shared review service" },
      { token: "tenantId = req.tenantId!", reason: "tenant scope must come from authenticated request" },
      { token: "validateExceptionAccess(", reason: "object-level access guard required" },
    ],
    manualValidation:
      "Requires runtime checks for cross-tenant exception ids across list, detail, and mutation flows.",
  },
  {
    route: "/api/v1/intelligence/exceptions/:exceptionId/similar (express)",
    classification: "tenant-bound",
    file: "packages/api/src/routes/exception-intelligence.ts",
    mustInclude: [
      { token: "requirePermission(Permission.OPERATOR_READ)", reason: "read authz required" },
      { token: "const tenantId = req.tenantId!", reason: "tenant scope must come from authenticated request" },
      {
        token: "where: { id: exceptionId, tenantId }",
        reason: "lookup must stay tenant-scoped before intelligence reads",
      },
      { token: "findSimilarCases({", reason: "similarity read must flow through memory service" },
    ],
    manualValidation:
      "Requires runtime probe using a foreign-tenant exception id to prove no similar-case leakage.",
  },
  {
    route: "/api/v1/tenant/* (express mount)",
    classification: "tenant-bound",
    file: "packages/api/src/index.ts",
    mustInclude: [
      { token: 'router.use(authMiddleware);', reason: "protected router must authenticate before tenant mounts" },
      {
        token: 'router.use("/tenant", tenantMiddleware, tenantDataRouter);',
        reason: "tenant data routes must keep explicit tenant middleware",
      },
      {
        token: 'router.use("/tenant", tenantMiddleware, platformControlPlaneRouter);',
        reason: "tenant control-plane routes must keep explicit tenant middleware",
      },
    ],
    manualValidation:
      "Requires runtime verification that missing or mismatched tenant context is rejected before tenant routes execute.",
  },
];

const classificationRules = [
  {
    prefix: "packages/web/src/app/api/admin/",
    class: "admin",
    reason: "Admin route namespace; covered by dedicated admin auth verification.",
  },
  {
    prefix: "packages/web/src/app/api/internal/",
    class: "internal",
    reason: "Internal integration surface.",
  },
  {
    prefix: "packages/web/src/app/api/cron/",
    class: "system",
    reason: "Scheduled job route; validated via signed scheduler secrets.",
  },
  {
    prefix: "packages/web/src/app/api/stripe/",
    class: "webhook",
    reason: "Stripe webhook namespace uses signature validation.",
  },
  {
    prefix: "packages/web/src/app/api/connectors/webhook/",
    class: "webhook",
    reason: "Connector webhook endpoint; provider signature/event validation expected.",
  },
  {
    prefix: "packages/web/src/app/api/public/",
    class: "public",
    reason: "Explicit public namespace.",
  },
  {
    prefix: "packages/web/src/app/api/docs/",
    class: "public",
    reason: "Documentation endpoint namespace.",
  },
  {
    prefix: "packages/web/src/app/api/health",
    class: "public",
    reason: "Health endpoint.",
  },
  {
    prefix: "packages/web/src/app/api/status",
    class: "public",
    reason: "Status/readiness endpoint.",
  },
  {
    prefix: "packages/web/src/app/api/builder/revalidate/",
    class: "system",
    reason: "Signed revalidation endpoint.",
  },
  {
    prefix: "packages/web/src/app/api/v1/health",
    class: "public",
    reason: "Versioned health endpoint.",
  },
  {
    prefix: "packages/web/src/app/api/v1/ready",
    class: "public",
    reason: "Versioned readiness endpoint.",
  },
  {
    prefix: "packages/web/src/app/api/v1/meta",
    class: "public",
    reason: "Versioned metadata endpoint.",
  },
  {
    prefix: "packages/web/src/app/api/v1/",
    class: "tenant",
    reason: "Versioned API namespace defaults to tenant/app-auth bound.",
  },
  {
    prefix: "packages/web/src/app/api/console/",
    class: "tenant",
    reason: "Console namespace operates on tenant/user scoped data.",
  },
  {
    prefix: "packages/web/src/app/api/jobs/",
    class: "tenant",
    reason: "Job APIs are tenant-scoped operational data.",
  },
  {
    prefix: "packages/web/src/app/api/exports",
    class: "tenant",
    reason: "Export endpoints expose tenant-bound artifacts.",
  },
  {
    prefix: "packages/web/src/app/api/imports",
    class: "tenant",
    reason: "Import endpoints modify tenant-bound data.",
  },
  {
    prefix: "packages/web/src/app/api/runs",
    class: "tenant",
    reason: "Run endpoints are tenant-bound.",
  },
  {
    prefix: "packages/web/src/app/api/workspaces",
    class: "tenant",
    reason: "Workspace APIs are tenant/user-bound.",
  },
  {
    prefix: "packages/web/src/app/api/ai/",
    class: "authenticated-user",
    reason: "AI endpoints require authenticated user session.",
  },
  {
    prefix: "packages/web/src/app/api/billing/",
    class: "authenticated-user",
    reason: "Billing endpoints require authenticated user session.",
  },
  {
    prefix: "packages/web/src/app/api/connectors/",
    class: "tenant",
    reason: "Connector endpoints are tenant-scoped integration data.",
  },
  {
    prefix: "packages/web/src/app/api/control-plane/",
    class: "admin-internal",
    reason: "Control-plane endpoints are restricted to super-admin operators.",
  },
  {
    prefix: "packages/web/src/app/api/data/",
    class: "tenant",
    reason: "Data endpoints expose or mutate tenant-scoped records.",
  },
  {
    prefix: "packages/web/src/app/api/enterprise/",
    class: "admin-internal",
    reason: "Enterprise management endpoints require admin authorization.",
  },
  {
    prefix: "packages/web/src/app/api/explorer/",
    class: "tenant",
    reason: "Explorer endpoints query tenant-scoped data sets.",
  },
  {
    prefix: "packages/web/src/app/api/feedback-loops/",
    class: "tenant",
    reason: "Feedback-loop endpoints operate on tenant-bound pipeline state.",
  },
  {
    prefix: "packages/web/src/app/api/foundry/",
    class: "tenant",
    reason: "Foundry endpoints manage tenant-scoped pipeline definitions.",
  },
  {
    prefix: "packages/web/src/app/api/gtm/",
    class: "authenticated-user",
    reason: "GTM/growth endpoints require authenticated user context.",
  },
  {
    prefix: "packages/web/src/app/api/image-optimize/",
    class: "authenticated-user",
    reason: "Image optimization endpoints require authenticated user session.",
  },
  {
    prefix: "packages/web/src/app/api/integrations/",
    class: "tenant",
    reason: "Integration endpoints are tenant-scoped credential/config data.",
  },
  {
    prefix: "packages/web/src/app/api/invite/",
    class: "public-write",
    reason: "Invite acceptance endpoints are intentionally public write paths.",
  },
  {
    prefix: "packages/web/src/app/api/metrics/",
    class: "tenant",
    reason: "Metrics endpoints expose tenant-scoped analytics.",
  },
  {
    prefix: "packages/web/src/app/api/milestones/",
    class: "authenticated-user",
    reason: "Milestone endpoints require authenticated user session.",
  },
  {
    prefix: "packages/web/src/app/api/onboarding/",
    class: "authenticated-user",
    reason: "Onboarding endpoints require authenticated user session.",
  },
  {
    prefix: "packages/web/src/app/api/operator/",
    class: "admin-internal",
    reason: "Operator endpoints are restricted to admin-level principals.",
  },
  {
    prefix: "packages/web/src/app/api/ops/",
    class: "admin-internal",
    reason: "Ops endpoints are restricted to internal admin operations.",
  },
  {
    prefix: "packages/web/src/app/api/oss/",
    class: "public-read",
    reason: "OSS endpoints are intentionally public read paths.",
  },
  {
    prefix: "packages/web/src/app/api/pricing/",
    class: "admin-internal",
    reason: "Pricing management endpoints require admin authorization.",
  },
  {
    prefix: "packages/web/src/app/api/projects/",
    class: "tenant",
    reason: "Project endpoints are tenant-scoped.",
  },
  {
    prefix: "packages/web/src/app/api/quota/",
    class: "tenant",
    reason: "Quota endpoints expose tenant-scoped usage limits.",
  },
  {
    prefix: "packages/web/src/app/api/rbac/",
    class: "admin-internal",
    reason: "RBAC management endpoints require admin authorization.",
  },
  {
    prefix: "packages/web/src/app/api/receipts/",
    class: "tenant",
    reason: "Receipt endpoints operate on tenant-scoped financial records.",
  },
  {
    prefix: "packages/web/src/app/api/referrals/",
    class: "authenticated-user",
    reason: "Referral endpoints require authenticated user session.",
  },
  {
    prefix: "packages/web/src/app/api/seo/",
    class: "admin-internal",
    reason: "SEO management endpoints require admin authorization.",
  },
  {
    prefix: "packages/web/src/app/api/share/",
    class: "public-read",
    reason: "Share endpoints are intentionally public read paths for shared artifacts.",
  },
  {
    prefix: "packages/web/src/app/api/support/",
    class: "authenticated-user",
    reason: "Support endpoints require authenticated user session.",
  },
  {
    prefix: "packages/web/src/app/api/user/",
    class: "authenticated-user",
    reason: "User endpoints operate on the authenticated caller's own data.",
  },
  {
    prefix: "packages/api/src/routes/health.ts",
    class: "public",
    reason: "Express health endpoint.",
  },
  {
    prefix: "packages/api/src/routes/metrics.ts",
    class: "internal",
    reason: "Express metrics endpoint is infra-facing, not tenant scoped.",
  },
  {
    prefix: "packages/api/src/routes/openapi.ts",
    class: "public",
    reason: "Express OpenAPI docs are public by design.",
  },
  {
    prefix: "packages/api/src/routes/playground.ts",
    class: "public",
    reason: "Express playground is intentionally public/demo scoped.",
  },
  {
    prefix: "packages/api/src/routes/auth.ts",
    class: "public-write",
    reason: "Auth routes include public login/refresh and authenticated credential management.",
  },
  {
    prefix: "packages/api/src/routes/",
    class: "tenant",
    reason: "Primary Express API routes default to authenticated tenant-scoped data paths.",
  },
];

export const knownExemptPrefixes = [
  "packages/web/src/app/api/health",
  "packages/web/src/app/api/docs/",
  "packages/web/src/app/api/gtm/",
  "packages/web/src/app/api/legal/",
  "packages/web/src/app/api/builder/revalidate/",
  "packages/api/src/routes/metrics.ts",
  "packages/api/src/routes/openapi.ts",
  "packages/api/src/routes/playground.ts",
];

const manualReviewHints = [
  { token: "mock", reason: "mock/test endpoint" },
  { token: "example", reason: "example endpoint" },
  { token: "demo", reason: "demo endpoint" },
  { token: "debug", reason: "debug/diagnostic endpoint" },
];

function discoverApiRoutes(repoRoot) {
  const routes = [];
  const discovered = new Set();

  function walk(dir, includeFile) {
    let entries;
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry === "__tests__") continue;
      const full = path.join(dir, entry);
      try {
        const stats = statSync(full);
        if (stats.isDirectory()) {
          walk(full, includeFile);
        } else if (includeFile(entry, full)) {
          const rel = path.relative(repoRoot, full);
          if (!discovered.has(rel)) {
            discovered.add(rel);
            routes.push(rel);
          }
        }
      } catch {
        // skip unreadable entries
      }
    }
  }

  walk(path.join(repoRoot, "packages", "web", "src", "app", "api"), (entry) => entry === "route.ts");
  walk(path.join(repoRoot, "packages", "api", "src", "routes"), (entry, fullPath) => {
    if (!entry.endsWith(".ts")) return false;
    if (["authz-helpers.ts", "route-helpers.ts"].includes(entry)) return false;
    const content = readFileSync(fullPath, "utf8");
    return content.includes("Router(") || content.includes("router.") || content.includes("v1Router.") || content.includes("v2Router.");
  });

  return routes.sort((a, b) => a.localeCompare(b));
}

function classifyRouteFile(routeFile) {
  for (const rule of classificationRules) {
    if (routeFile.startsWith(rule.prefix)) {
      return {
        category: rule.class,
        reason: rule.reason,
        source: `prefix:${rule.prefix}`,
        confidence: "high",
      };
    }
  }

  const hint = manualReviewHints.find((entry) => routeFile.toLowerCase().includes(entry.token));
  if (hint) {
    return {
      category: "manual-review",
      reason: `Requires explicit reviewer classification (${hint.reason}).`,
      source: `hint:${hint.token}`,
      confidence: "medium",
    };
  }

  return {
    category: "unclassified",
    reason: "No safe rule matched route path.",
    source: "none",
    confidence: "low",
  };
}

export function evaluateTenantGuardrails(repoRoot) {
  const checks = [];

  for (const rule of highRiskRouteRules) {
    const absolutePath = path.join(repoRoot, rule.file);
    let content = "";
    try {
      content = readFileSync(absolutePath, "utf8");
    } catch (error) {
      checks.push({
        ...rule,
        status: "missing",
        missingTokens: rule.mustInclude.map((entry) => `${entry.token} (${entry.reason})`),
        error: error instanceof Error ? error.message : String(error),
      });
      continue;
    }

    const missing = rule.mustInclude.filter((entry) => !content.includes(entry.token));
    checks.push({
      ...rule,
      status: missing.length ? "missing_guardrail" : "guardrail_present",
      missingTokens: missing.map((entry) => `${entry.token} (${entry.reason})`),
    });
  }

  return checks;
}

export function evaluateCoverageGap(repoRoot) {
  const allRoutes = discoverApiRoutes(repoRoot);
  const classifiedFiles = new Set(highRiskRouteRules.map((r) => r.file));

  const routeClassifications = allRoutes.map((routeFile) => {
    if (classifiedFiles.has(routeFile)) {
      return {
        file: routeFile,
        category: "high-risk-reviewed",
        reason: "Route has explicit high-risk token-level guardrail assertions.",
        source: "highRiskRouteRules",
        confidence: "high",
      };
    }

    return {
      file: routeFile,
      ...classifyRouteFile(routeFile),
    };
  });

  const categoryCounts = routeClassifications.reduce((acc, route) => {
    acc[route.category] = (acc[route.category] || 0) + 1;
    return acc;
  }, {});

  const unclassifiedRoutes = routeClassifications
    .filter((route) => route.category === "unclassified")
    .map((route) => route.file);

  const manualReviewRoutes = routeClassifications
    .filter((route) => route.category === "manual-review")
    .map((route) => ({
      route: route.file,
      reason: route.reason,
      suggestedCategory: "public-or-internal-review-required",
    }));

  return {
    totalRoutes: allRoutes.length,
    classifiedRoutes: routeClassifications.length - unclassifiedRoutes.length,
    exemptPrefixes: knownExemptPrefixes.length,
    classificationCoveragePct:
      allRoutes.length === 0
        ? 100
        : Number(
            (((allRoutes.length - unclassifiedRoutes.length) / allRoutes.length) * 100).toFixed(2)
          ),
    categoryCounts,
    routeClassifications,
    manualReviewRoutes,
    unclassifiedRoutes,
  };
}
