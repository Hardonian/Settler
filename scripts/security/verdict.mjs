#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { computeSecurityVerdict } from "./verdict-lib.mjs";

const repoRoot = process.cwd();
const runId = process.env.GITHUB_RUN_ID || new Date().toISOString().replace(/[:.]/g, "-");
const outputDir = path.join(repoRoot, "artifacts", "security", "verdict", runId);
mkdirSync(outputDir, { recursive: true });
mkdirSync(path.join(repoRoot, "security"), { recursive: true });

function readJson(rel) {
  try {
    return JSON.parse(readFileSync(path.join(repoRoot, rel), "utf8"));
  } catch {
    return null;
  }
}

const verdict = computeSecurityVerdict({
  dependencyEvidence: readJson("artifacts/security/dependency-evidence-latest.json"),
  rlsEvidence: readJson("artifacts/security/rls-evidence-latest.json"),
  headerProbe: readJson("artifacts/security/header-probe-latest.json"),
  crossTenant: readJson("artifacts/security/cross-tenant-results-latest.json"),
});

const jsonPath = path.join(outputDir, "security-verdict.json");
writeFileSync(jsonPath, JSON.stringify(verdict, null, 2));
writeFileSync(
  path.join(repoRoot, "security", "security-verdict.json"),
  JSON.stringify(verdict, null, 2)
);
writeFileSync(
  path.join(repoRoot, "artifacts", "security", "security-verdict-latest.json"),
  JSON.stringify(verdict, null, 2)
);

const md = [
  "# Security Launch Verdict",
  `- Development Safe: ${verdict.overall.overall_development_safe}`,
  `- Launch Safe: ${verdict.overall.overall_launch_safe}`,
  `- Enterprise Review Safe: ${verdict.overall.overall_enterprise_review_safe}`,
  "",
  "## Dimensions",
  ...Object.entries(verdict.dimensions).map(
    ([name, dim]) => `- ${name}: ${dim.status} (${dim.evidenceLevel}) — ${dim.reason}`
  ),
].join("\n");

writeFileSync(path.join(outputDir, "security-verdict.md"), md);
writeFileSync(path.join(repoRoot, "security", "security-verdict.md"), md);

console.log(`Security verdict artifact: ${path.relative(repoRoot, jsonPath)}`);
console.log(`Launch Safe: ${verdict.overall.overall_launch_safe}`);

if (verdict.overall.overall_launch_safe === "NO") {
  process.exit(1);
}
