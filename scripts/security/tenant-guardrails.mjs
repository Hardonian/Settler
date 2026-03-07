import { readFileSync } from "node:fs";
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
