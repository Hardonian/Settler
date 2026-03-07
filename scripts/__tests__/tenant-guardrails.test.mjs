import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { evaluateTenantGuardrails, highRiskRouteRules } from "../security/tenant-guardrails.mjs";

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
