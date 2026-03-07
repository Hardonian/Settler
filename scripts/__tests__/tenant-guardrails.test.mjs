import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  evaluateTenantGuardrails,
  evaluateCoverageGap,
  highRiskRouteRules,
} from "../security/tenant-guardrails.mjs";

function setupFixture(mutator) {
  const root = mkdtempSync(path.join(os.tmpdir(), "settler-guardrails-"));
  for (const rule of highRiskRouteRules) {
    const full = path.join(root, rule.file);
    mkdirSync(path.dirname(full), { recursive: true });
    const body = rule.mustInclude.map((x) => x.token).join("\n");
    writeFileSync(full, `// fixture\n${body}\n`, "utf8");
  }
  mutator?.(root);
  return root;
}

test("evaluateTenantGuardrails reports guardrail_present when all tokens are present", () => {
  const root = setupFixture();
  try {
    const results = evaluateTenantGuardrails(root);
    assert.equal(results.length, highRiskRouteRules.length);
    assert.ok(results.every((entry) => entry.status === "guardrail_present"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("evaluateTenantGuardrails surfaces missing guardrail tokens with route diagnostics", () => {
  const root = setupFixture((fixtureRoot) => {
    const target = path.join(fixtureRoot, "packages/web/src/app/api/v1/runs/route.ts");
    writeFileSync(target, "buildContext(request)\n", "utf8");
  });

  try {
    const results = evaluateTenantGuardrails(root);
    const runsRoute = results.find((entry) => entry.route === "/api/v1/runs");
    assert.ok(runsRoute);
    assert.equal(runsRoute.status, "missing_guardrail");
    assert.ok(runsRoute.missingTokens.some((token) => token.includes("tenantId: ctx.tenantId")));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("evaluateTenantGuardrails reports missing status when route file does not exist", () => {
  const root = setupFixture((fixtureRoot) => {
    const target = path.join(fixtureRoot, "packages/web/src/app/api/v1/runs/route.ts");
    rmSync(target);
  });

  try {
    const results = evaluateTenantGuardrails(root);
    const runsRoute = results.find((entry) => entry.route === "/api/v1/runs");
    assert.ok(runsRoute);
    assert.equal(runsRoute.status, "missing");
    assert.ok(runsRoute.error);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("evaluateCoverageGap identifies unclassified routes", () => {
  const root = setupFixture((fixtureRoot) => {
    // Add an unclassified route that is not in highRiskRouteRules or exempt prefixes
    const unclassifiedDir = path.join(
      fixtureRoot,
      "packages/web/src/app/api/console/secret-data"
    );
    mkdirSync(unclassifiedDir, { recursive: true });
    writeFileSync(path.join(unclassifiedDir, "route.ts"), "export function GET() {}", "utf8");

    // Add an exempt route that should not appear in unclassified
    const adminDir = path.join(fixtureRoot, "packages/web/src/app/api/admin/test");
    mkdirSync(adminDir, { recursive: true });
    writeFileSync(path.join(adminDir, "route.ts"), "export function GET() {}", "utf8");
  });

  try {
    const gap = evaluateCoverageGap(root);
    assert.ok(gap.totalRoutes >= highRiskRouteRules.length + 1);
    assert.equal(gap.classifiedRoutes, highRiskRouteRules.length);
    assert.ok(
      gap.unclassifiedRoutes.some((r) => r.includes("console/secret-data")),
      "unclassified route should appear in gap report"
    );
    assert.ok(
      !gap.unclassifiedRoutes.some((r) => r.includes("admin/test")),
      "exempt admin route should not appear in gap report"
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("evaluateCoverageGap unclassifiedRoutes does not include already-classified high-risk routes", () => {
  // Verifies that routes in highRiskRouteRules are not double-reported as unclassified
  // even if the actual route file exists on disk in a full fixture setup.
  const root = setupFixture();
  try {
    const gap = evaluateCoverageGap(root);
    for (const rule of highRiskRouteRules) {
      assert.ok(
        !gap.unclassifiedRoutes.includes(rule.file),
        `classified high-risk route ${rule.file} must not appear in unclassifiedRoutes`
      );
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("evaluateCoverageGap cron exempt prefix is not surfaced as unclassified", () => {
  // Cron routes are exempt by policy; confirm they do not appear in the gap list.
  const root = setupFixture((fixtureRoot) => {
    const cronDir = path.join(fixtureRoot, "packages/web/src/app/api/cron/daily-job");
    mkdirSync(cronDir, { recursive: true });
    writeFileSync(path.join(cronDir, "route.ts"), "export function GET() {}", "utf8");
  });

  try {
    const gap = evaluateCoverageGap(root);
    assert.ok(
      !gap.unclassifiedRoutes.some((r) => r.includes("cron/daily-job")),
      "cron route should be exempt and not appear in unclassifiedRoutes"
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
