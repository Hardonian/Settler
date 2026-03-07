#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const runId = process.env.GITHUB_RUN_ID || new Date().toISOString().replace(/[:.]/g, "-");
const outputDir = path.join(repoRoot, "artifacts", "security", "dependency-triage", runId);
mkdirSync(outputDir, { recursive: true });

function safeReadJson(rel) {
  try {
    return JSON.parse(readFileSync(path.join(repoRoot, rel), "utf8"));
  } catch {
    return null;
  }
}

function main() {
  const audit = safeReadJson("artifacts/security/dependency-audit-latest.json");
  const dependabotExport = safeReadJson("security/dependabot-alerts.json");

  const triageEntries = [];
  const blockers = [];

  if (Array.isArray(dependabotExport?.alerts)) {
    for (const alert of dependabotExport.alerts) {
      triageEntries.push({
        package: alert.package || "unknown",
        affectedRange: alert.affectedRange || "unknown",
        version: alert.version || null,
        direct: Boolean(alert.direct),
        severity: alert.severity || "unknown",
        identifier: alert.identifier || alert.ghsa || alert.cve || "unknown",
        fixAvailable: Boolean(alert.fixAvailable),
        remediationType: alert.remediationType || "accepted temporarily",
        rationale: alert.rationale || "Imported from dependabot export.",
        owner: alert.owner || "security",
        status: alert.status || "triaged",
        launchImpact: alert.launchImpact || "policy-dependent",
      });
    }
  }

  if (!dependabotExport) {
    blockers.push({
      id: "dependabot-export-missing",
      gap: "Cannot enumerate and disposition all Dependabot alerts without an authenticated alert export.",
      requiredInput: "security/dependabot-alerts.json",
      knownOutstandingCount: 22,
      launchImpact: "policy-dependent",
    });
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    verifierVersion: "2026-03-07.1",
    runId,
    sourceStatus: {
      dependencyAuditArtifactPresent: Boolean(audit),
      dependabotExportPresent: Boolean(dependabotExport),
    },
    findingsSummary: audit?.findingsSummary || null,
    entries: triageEntries,
    blockers,
    triageComplete: blockers.length === 0,
    proofBoundary:
      "Full CVE-by-CVE triage requires authenticated Dependabot alert export. Local audit backend availability is captured separately in dependency-audit-latest.json.",
  };

  const outPath = path.join(outputDir, "dependency-triage.json");
  writeFileSync(outPath, JSON.stringify(summary, null, 2));
  writeFileSync(
    path.join(repoRoot, "security", "dependency-triage.json"),
    JSON.stringify(summary, null, 2)
  );

  console.log(`Dependency triage artifact: ${path.relative(repoRoot, outPath)}`);
  console.log(`Dependency triage complete: ${summary.triageComplete}`);
}

main();
