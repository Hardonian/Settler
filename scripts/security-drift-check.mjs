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
  verifierVersion: "2026-03-07.2",
  routeTotal: routeRegistry.totalRoutes,
  routePaths: routeRegistry.routes.map((route) => route.route).sort(),
  tenantScopedRoutes: tenantCoverage.tenantScopedRoutes,
  tenantMissingRoutes: (tenantCoverage.missingRoutes || []).map((route) => route.route).sort(),
  tenantExemptRoutes: (tenantCoverage.exemptRoutes || []).map((route) => route.route).sort(),
  headerProbe: {
    failedChecks: headerProbe.counts?.failed || 0,
    probeableRoutes: headerProbe.coverage?.probeableRoutes || 0,
    degraded: Boolean(headerProbe.degraded),
  },
  dependencyAudit: {
    outcome: depAudit.finalOutcome,
    degraded: Boolean(depAudit.degraded),
    degradedReasons: depAudit.degradedReasons || [],
  },
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

const routeDiff = listDiff(baseline.routePaths, current.routePaths);
if (routeDiff.added.length || routeDiff.removed.length) {
  diffs.push(
    `route surface changed: +${routeDiff.added.length} / -${routeDiff.removed.length} (review security/route-registry.json)`
  );
  routeDiff.added.slice(0, 10).forEach((route) => diffs.push(`  added route: ${route}`));
  routeDiff.removed.slice(0, 10).forEach((route) => diffs.push(`  removed route: ${route}`));
}

const missingDiff = listDiff(baseline.tenantMissingRoutes, current.tenantMissingRoutes);
if (missingDiff.added.length || missingDiff.removed.length) {
  diffs.push(
    "tenant verification missing-route set changed (review verify-tenant coverage and exemptions)"
  );
  missingDiff.added.forEach((route) => diffs.push(`  new missing tenant coverage: ${route}`));
  missingDiff.removed.forEach((route) =>
    diffs.push(`  resolved missing tenant coverage: ${route}`)
  );
}

const exemptDiff = listDiff(baseline.tenantExemptRoutes, current.tenantExemptRoutes);
if (exemptDiff.added.length || exemptDiff.removed.length) {
  diffs.push("tenant exemption surface changed (requires security review)");
  exemptDiff.added.forEach((route) => diffs.push(`  new exemption route: ${route}`));
  exemptDiff.removed.forEach((route) => diffs.push(`  removed exemption route: ${route}`));
}

if ((baseline.headerProbe?.failedChecks || 0) !== current.headerProbe.failedChecks) {
  diffs.push(
    `header probe failures changed: baseline=${baseline.headerProbe?.failedChecks || 0} current=${current.headerProbe.failedChecks}`
  );
}

if ((baseline.headerProbe?.probeableRoutes || 0) !== current.headerProbe.probeableRoutes) {
  diffs.push(
    `header probe scope changed: baseline=${baseline.headerProbe?.probeableRoutes || 0} current=${current.headerProbe.probeableRoutes}`
  );
}

if (Boolean(baseline.headerProbe?.degraded) !== current.headerProbe.degraded) {
  diffs.push(
    `header probe degraded flag changed: baseline=${Boolean(baseline.headerProbe?.degraded)} current=${current.headerProbe.degraded}`
  );
}

if ((baseline.dependencyAudit?.outcome || "unknown") !== current.dependencyAudit.outcome) {
  diffs.push(
    `dependency audit outcome changed: baseline=${baseline.dependencyAudit?.outcome || "unknown"} current=${current.dependencyAudit.outcome}`
  );
}

if (Boolean(baseline.dependencyAudit?.degraded) !== current.dependencyAudit.degraded) {
  diffs.push(
    `dependency audit degraded flag changed: baseline=${Boolean(baseline.dependencyAudit?.degraded)} current=${current.dependencyAudit.degraded}`
  );
}

const depReasonDiff = listDiff(
  baseline.dependencyAudit?.degradedReasons || [],
  current.dependencyAudit.degradedReasons
);
if (depReasonDiff.added.length || depReasonDiff.removed.length) {
  diffs.push("dependency audit degraded reasons changed");
  depReasonDiff.added.forEach((reason) => diffs.push(`  new degraded reason: ${reason}`));
  depReasonDiff.removed.forEach((reason) => diffs.push(`  cleared degraded reason: ${reason}`));
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
