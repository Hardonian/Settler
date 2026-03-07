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
];

export const knownExemptPrefixes = [
  "packages/web/src/app/api/health",
  "packages/web/src/app/api/docs/",
  "packages/web/src/app/api/gtm/",
  "packages/web/src/app/api/legal/",
  "packages/web/src/app/api/builder/revalidate/",
];

const manualReviewHints = [
  { token: "mock", reason: "mock/test endpoint" },
  { token: "example", reason: "example endpoint" },
  { token: "demo", reason: "demo endpoint" },
  { token: "debug", reason: "debug/diagnostic endpoint" },
];

function discoverApiRoutes(repoRoot) {
  const apiDir = path.join(repoRoot, "packages", "web", "src", "app", "api");
  const routes = [];

  function walk(dir) {
    let entries;
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry);
      try {
        const stats = statSync(full);
        if (stats.isDirectory()) walk(full);
        else if (entry === "route.ts") {
          routes.push(path.relative(repoRoot, full));
        }
      } catch {
        // skip unreadable entries
      }
    }
  }

  walk(apiDir);
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
