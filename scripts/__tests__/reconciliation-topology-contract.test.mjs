import { test } from "node:test";
import assert from "node:assert";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

function read(relPath) {
  return readFileSync(join(root, relPath), "utf8");
}

test("canonical reconciliation owner package exists and is exported", () => {
  const pkgPath = join(root, "packages/reconciliation-core/package.json");
  assert.ok(existsSync(pkgPath), "packages/reconciliation-core/package.json must exist");
  const pkg = JSON.parse(read("packages/reconciliation-core/package.json"));
  assert.equal(pkg.name, "@settler/reconciliation-core");
  assert.equal(pkg.main, "dist/index.js");
  assert.equal(pkg.types, "dist/index.d.ts");
  assert.ok(pkg.exports?.["."], "reconciliation-core package must expose root export");
});

test("run list/detail routes consume reconciliation-core canonical owner", () => {
  const webRunsRoute = read("packages/web/src/app/api/runs/route.ts");
  assert.match(
    webRunsRoute,
    /from "@settler\/reconciliation-core"/,
    "web list route must import canonical owner"
  );
  assert.match(
    webRunsRoute,
    /fetchMergedReconciliationRunsPage/,
    "web list route must use canonical merged list reader"
  );
  assert.match(
    webRunsRoute,
    /buildRunProofpackIndexByRunId/,
    "web list route must use canonical proof/history index"
  );

  const webRunDetailRoute = read("packages/web/src/app/api/runs/[id]/route.ts");
  assert.match(
    webRunDetailRoute,
    /resolveOperatorRunDetailForTenants/,
    "web detail route must use canonical detail resolver"
  );

  const apiRunsRoute = read("packages/api/src/routes/runs.ts");
  assert.match(
    apiRunsRoute,
    /resolveOperatorRunDetailForTenants/,
    "api detail route must use canonical detail resolver"
  );
  assert.match(
    apiRunsRoute,
    /scanMergedRunsForLegacyPage/,
    "api list route must use canonical merged list scanner"
  );
});

