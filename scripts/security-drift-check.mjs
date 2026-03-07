#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const baselinePath = path.join(repoRoot, "security", "baseline", "security-drift-baseline.json");
const allowUpdate = process.env.SECURITY_BASELINE_UPDATE === "1";

function readJson(relPath) {
  return JSON.parse(readFileSync(path.join(repoRoot, relPath), "utf8"));
}

const routeRegistry = readJson("security/route-registry.json");
const tenantCoverage = readJson("artifacts/security/tenant-coverage-latest.json");
const headerProbe = readJson("artifacts/security/header-probe-latest.json");
const depAudit = readJson("artifacts/security/dependency-audit-latest.json");

const current = {
  generatedAt: new Date().toISOString(),
  routeTotal: routeRegistry.totalRoutes,
  tenantScopedRoutes: tenantCoverage.tenantScopedRoutes,
  tenantMissingCount: tenantCoverage.missingRoutes?.length || 0,
  headerProbeFailures: headerProbe.counts?.failed || 0,
  dependencyAuditOutcome: depAudit.finalOutcome,
};

if (!existsSync(baselinePath) || allowUpdate) {
  mkdirSync(path.dirname(baselinePath), { recursive: true });
  writeFileSync(baselinePath, JSON.stringify(current, null, 2));
  console.log(
    `Security drift baseline ${existsSync(baselinePath) ? "updated" : "created"}: ${path.relative(repoRoot, baselinePath)}`
  );
  process.exit(0);
}

const baseline = JSON.parse(readFileSync(baselinePath, "utf8"));
const diffs = [];
for (const key of [
  "routeTotal",
  "tenantScopedRoutes",
  "tenantMissingCount",
  "headerProbeFailures",
  "dependencyAuditOutcome",
]) {
  if (baseline[key] !== current[key]) {
    diffs.push(`${key}: baseline=${baseline[key]} current=${current[key]}`);
  }
}

if (diffs.length > 0) {
  console.error("Security drift detected:\n - " + diffs.join("\n - "));
  console.error("If intended, rerun with SECURITY_BASELINE_UPDATE=1 and commit baseline update.");
  process.exit(1);
}

console.log("✅ Security drift check passed.");
