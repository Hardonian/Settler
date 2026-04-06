#!/usr/bin/env node
/**
 * Self-hosted packaging smoke: chart exists on disk and (when helm is installed) lint + template render.
 * Does not prove cluster runtime; use alongside migration/runbook docs.
 */
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const chartPath = path.join(repoRoot, "deploy/helm/settler");

if (!existsSync(chartPath)) {
  console.error(`❌ Helm chart directory missing: ${chartPath}`);
  process.exit(1);
}

function helmAvailable() {
  try {
    execSync("helm version", { stdio: "pipe", encoding: "utf8" });
    return true;
  } catch {
    return false;
  }
}

if (!helmAvailable()) {
  console.warn("⚠️ helm not on PATH — chart path verified only; install helm for lint/template proof.");
  process.exit(0);
}

process.chdir(repoRoot);
execSync(`helm lint "${chartPath}"`, { stdio: "inherit" });
execSync(`helm template settler-smoke "${chartPath}"`, { stdio: "pipe" });
console.log("✅ Helm lint + helm template (settler-smoke) succeeded.");
