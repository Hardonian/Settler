#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const baselinePath = path.join(repoRoot, "security", "baseline", "security-drift-baseline.json");
const allowUpdate = process.env.SECURITY_BASELINE_UPDATE === "1";

// Prerequisite artifacts that must exist before drift comparison can run.
// Each entry maps a short label to the relative path expected on disk.
const REQUIRED_ARTIFACTS = [
  { label: "route-registry", rel: "security/route-registry.json", producer: "pnpm run security:routes" },
  { label: "tenant-coverage", rel: "artifacts/security/tenant-coverage-latest.json", producer: "pnpm run verify:tenant" },
  { label: "header-probe", rel: "artifacts/security/header-probe-latest.json", producer: "pnpm run verify:security:headers" },
  { label: "dependency-audit", rel: "artifacts/security/dependency-audit-latest.json", producer: "pnpm run audit:deps" },
];

function readJson(relPath) {
  return JSON.parse(readFileSync(path.join(repoRoot, relPath), "utf8"));
}

// Verify all prerequisite artifacts are present before attempting any reads.
const missingArtifacts = REQUIRED_ARTIFACTS.filter(({ rel }) => !existsSync(path.join(repoRoot, rel)));
if (missingArtifacts.length > 0) {
  console.error("❌ Security drift check cannot run: required artifact(s) missing.");
  console.error("   Run the corresponding producer script for each missing artifact:\n");
  for (const { label, rel, producer } of missingArtifacts) {
    console.error(`   [${label}] expected at: ${rel}`);
    console.error(`             produce with: ${producer}\n`);
  }
  console.error(
    "   Drift check requires the security:evidence pipeline to have run in this working directory."
  );
  process.exit(1);
}

let routeRegistry, tenantCoverage, headerProbe, depAudit;
try {
  routeRegistry = readJson("security/route-registry.json");
  tenantCoverage = readJson("artifacts/security/tenant-coverage-latest.json");
  headerProbe = readJson("artifacts/security/header-probe-latest.json");
  depAudit = readJson("artifacts/security/dependency-audit-latest.json");
} catch (error) {
  console.error(
    `❌ Failed to parse a required artifact: ${error instanceof Error ? error.message : String(error)}`
  );
  console.error(
    "   The artifact file exists but could not be parsed. Re-run the producing script to regenerate it."
  );
  process.exit(1);
}

// If the header probe ran but all checks were skipped (no build available),
// headerProbeFailures will be 0 while the baseline may have real counts from a
// previous full run. Record the probe's skip state explicitly so drift messages
// are not misread as "headers improved."
const headerProbeAllSkipped = headerProbe.counts
  ? headerProbe.counts.passed === 0 && headerProbe.counts.failed === 0 && headerProbe.counts.skipped > 0
  : false;

const current = {
  generatedAt: new Date().toISOString(),
  routeTotal: routeRegistry.totalRoutes,
  tenantScopedRoutes: tenantCoverage.tenantScopedRoutes,
  tenantMissingCount: tenantCoverage.missingRoutes?.length || 0,
  headerProbeFailures: headerProbe.counts?.failed || 0,
  headerProbeAllSkipped,
  dependencyAuditOutcome: depAudit.finalOutcome,
};

if (!existsSync(baselinePath) || allowUpdate) {
  mkdirSync(path.dirname(baselinePath), { recursive: true });
  const action = existsSync(baselinePath) ? "updated" : "created";
  writeFileSync(baselinePath, JSON.stringify(current, null, 2));
  console.log(
    `Security drift baseline ${action}: ${path.relative(repoRoot, baselinePath)}`
  );
  if (current.headerProbeAllSkipped) {
    console.warn(
      "⚠️  Header probe was all-skipped (no build available) when this baseline was recorded."
    );
    console.warn(
      "   Run with a built app and SECURITY_BASELINE_UPDATE=1 to capture a meaningful probe baseline."
    );
  }
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
    let context = "";
    if (key === "headerProbeFailures" && current.headerProbeAllSkipped) {
      context =
        " [WARNING: current probe was all-skipped — missing build or --baseUrl; value reflects no actual probe run, not a real improvement]";
    } else if (key === "routeTotal" && current[key] > baseline[key]) {
      context = " [new routes added — verify tenant coverage and classification for additions]";
    } else if (key === "tenantMissingCount" && current[key] > baseline[key]) {
      context = " [regression: more routes now lack tenant isolation tokens]";
    }
    diffs.push(`${key}: baseline=${baseline[key]} current=${current[key]}${context}`);
  }
}

if (diffs.length > 0) {
  console.error("❌ Security drift detected:\n - " + diffs.join("\n - "));
  console.error(
    "\nIf these changes are intentional, rerun with SECURITY_BASELINE_UPDATE=1 and commit the updated baseline."
  );
  console.error(
    "If headerProbeFailures changed due to a skipped probe run, rebuild the app first, then re-run security:evidence."
  );
  process.exit(1);
}

console.log("✅ Security drift check passed.");
