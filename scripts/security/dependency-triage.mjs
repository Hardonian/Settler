#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const runId = process.env.GITHUB_RUN_ID || new Date().toISOString().replace(/[:.]/g, "-");
const outputDir = path.join(repoRoot, "artifacts", "security", "dependency-triage", runId);
mkdirSync(outputDir, { recursive: true });

const dependabotPath =
  process.env.DEPENDABOT_ALERTS_EXPORT_PATH || "security/dependabot-alerts.json";
const requireDependabot = process.env.DEPENDENCY_TRIAGE_REQUIRE_AUTHENTICATED_EXPORT === "1";

function safeReadJson(relOrAbs) {
  try {
    const candidate = path.isAbsolute(relOrAbs) ? relOrAbs : path.join(repoRoot, relOrAbs);
    return JSON.parse(readFileSync(candidate, "utf8"));
  } catch {
    return null;
  }
}

function normalizeDependabotAlert(alert) {
  const advisory = alert.security_advisory || alert.advisory || {};
  const dependency = alert.dependency || {};
  const pkg = alert.package || dependency.package?.name || "unknown";
  const identifier =
    alert.identifier ||
    advisory.ghsa_id ||
    advisory.cve_id ||
    advisory.cve ||
    advisory.id ||
    "unknown";

  const state = alert.state || alert.status || "open";
  const triageStatus =
    alert.triageStatus ||
    (state === "dismissed" ? "accepted-risk" : state === "fixed" ? "fixed" : "needs-triage");

  return {
    source: "dependabot-export",
    authenticatedEnrichment: true,
    package: pkg,
    advisoryId: identifier,
    directness:
      alert.directness ||
      (alert.direct === true ? "direct" : alert.direct === false ? "transitive" : "unknown"),
    fixAvailable: Boolean(
      alert.fixAvailable ||
      alert.fixed_version ||
      alert.security_vulnerability?.first_patched_version
    ),
    status: triageStatus,
    rationale:
      alert.rationale || alert.dismissed_reason || "Imported from authenticated Dependabot export.",
    launchImpact: alert.launchImpact || (state === "dismissed" ? "policy-dependent" : "blocking"),
    confidence: "high",
    provenance: {
      exportPath: dependabotPath,
      alertNumber: alert.number || null,
      state,
      severity: alert.severity || advisory.severity || null,
      ecosystem: dependency.package?.ecosystem || null,
      manifestPath: dependency.manifest_path || null,
      updatedAt: alert.updated_at || null,
    },
  };
}

function main() {
  const audit = safeReadJson("artifacts/security/dependency-audit-latest.json");
  const dependabotExport = safeReadJson(dependabotPath);

  const triageEntries = [];
  const blockers = [];

  if (Array.isArray(dependabotExport?.alerts)) {
    for (const alert of dependabotExport.alerts) {
      triageEntries.push(normalizeDependabotAlert(alert));
    }
  }

  if (audit?.findingsSummary && audit.findingsSummary.total > 0) {
    triageEntries.push({
      source: "pnpm-audit",
      authenticatedEnrichment: false,
      package: "aggregate",
      advisoryId: "pnpm-audit-summary",
      directness: "mixed",
      fixAvailable: null,
      status: audit.finalOutcome?.startsWith("failed") ? "needs-fix" : "reviewed-no-high-critical",
      rationale:
        "Aggregate row from pnpm audit metadata; advisory-level enrichment unavailable in this artifact.",
      launchImpact: audit.finalOutcome?.startsWith("failed") ? "blocking" : "non-blocking",
      confidence: audit.degraded ? "low" : "medium",
      provenance: {
        policyMode: audit.policyMode,
        degraded: Boolean(audit.degraded),
        degradedReasons: audit.degradedReasons || [],
      },
    });
  }

  if (!dependabotExport) {
    blockers.push({
      id: "dependabot-export-missing",
      gap: "Cannot enumerate and disposition all Dependabot alerts without an authenticated alert export.",
      requiredInput: dependabotPath,
      launchImpact: requireDependabot ? "blocking" : "policy-dependent",
      confidence: "high",
    });
  }

  if (!audit) {
    blockers.push({
      id: "dependency-audit-artifact-missing",
      gap: "Dependency audit artifact is missing; pnpm audit/osv state not captured.",
      requiredInput: "artifacts/security/dependency-audit-latest.json",
      launchImpact: "blocking",
      confidence: "high",
    });
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    verifierVersion: "2026-03-08.1",
    runId,
    policy: {
      requireAuthenticatedDependabotExport: requireDependabot,
      dependabotExportPath: dependabotPath,
    },
    sourceStatus: {
      dependencyAuditArtifactPresent: Boolean(audit),
      dependabotExportPresent: Boolean(dependabotExport),
      authenticatedDependabotExportAvailable: Boolean(dependabotExport?.alerts),
      pnpmAuditBackendAvailable: Boolean(audit?.backend?.available),
      osvScannerPresent: Boolean(audit?.osvPresent),
    },
    findingsSummary: audit?.findingsSummary || null,
    entries: triageEntries,
    blockers,
    triageCompleteness: {
      fullyTriagedFindings: triageEntries.filter((e) => e.confidence === "high").length,
      partiallyTriagedFindings: triageEntries.filter((e) => e.confidence !== "high").length,
      blockedByMissingAuthenticatedInput: !dependabotExport,
      toolingDegraded: Boolean(audit?.degraded) || !audit || !Boolean(dependabotExport?.alerts),
    },
    triageComplete: blockers.length === 0,
    proofBoundary:
      "Advisory-level complete triage is only proven when authenticated Dependabot export is ingested. pnpm/osv backend degradation is tracked separately in dependency-audit-latest.json.",
  };

  const outPath = path.join(outputDir, "dependency-triage.json");
  writeFileSync(outPath, JSON.stringify(summary, null, 2));
  writeFileSync(
    path.join(repoRoot, "security", "dependency-triage.json"),
    JSON.stringify(summary, null, 2)
  );

  console.log(`Dependency triage artifact: ${path.relative(repoRoot, outPath)}`);
  console.log(`Dependency triage complete: ${summary.triageComplete}`);

  if (requireDependabot && !dependabotExport) {
    console.error(
      `Missing required authenticated Dependabot export: ${dependabotPath}. Set DEPENDABOT_ALERTS_EXPORT_PATH or provide the file.`
    );
    process.exit(1);
  }
}

main();
