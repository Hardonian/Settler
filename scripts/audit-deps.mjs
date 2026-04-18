#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const MODES = new Set(["strict", "warn", "off"]);
const repoRoot = process.cwd();
const mode = (process.env.SECURITY_AUDIT_MODE || "strict").toLowerCase();
const isCi = process.env.CI === "true";
const runId = process.env.GITHUB_RUN_ID || new Date().toISOString().replace(/[:.]/g, "-");

if (!MODES.has(mode)) {
  console.error(`Unsupported SECURITY_AUDIT_MODE='${mode}'. Expected strict|warn|off.`);
  process.exit(1);
}

if (mode === "off" && isCi) {
  console.error("SECURITY_AUDIT_MODE=off is blocked in CI.");
  process.exit(1);
}

const outputDir = path.join(repoRoot, "artifacts", "security", "dependency-audit", runId);
mkdirSync(outputDir, { recursive: true });

function run(command, args, timeout = 90_000) {
  const result = spawnSync(command, args, { encoding: "utf8", timeout });
  return {
    timedOut: result.error && result.error.code === "ETIMEDOUT",
    command: [command, ...args].join(" "),
    status: result.status ?? 1,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
    error: result.error ? String(result.error) : null,
  };
}

function backendUnavailable(output) {
  const text = output.toLowerCase();
  return (
    text.includes("err_pnpm_audit_bad_response") ||
    text.includes("403") ||
    text.includes("enotfound") ||
    text.includes("econnrefused") ||
    text.includes("etimedout") ||
    text.includes("endpoint")
  );
}

function parseTotals(raw) {
  try {
    const parsed = JSON.parse(raw);
    const vulnerabilities = parsed?.metadata?.vulnerabilities || {};
    return {
      info: vulnerabilities.info || 0,
      low: vulnerabilities.low || 0,
      moderate: vulnerabilities.moderate || 0,
      high: vulnerabilities.high || 0,
      critical: vulnerabilities.critical || 0,
      total: vulnerabilities.total || 0,
    };
  } catch {
    return null;
  }
}

const attempts = [];
let backend = { available: false, reason: null };
let finalOutcome = "passed";
let findings = null;
let completeness = "full";
const degradedReasons = [];

if (mode !== "off") {
  const audit = run("pnpm", ["audit", "--prod", "--audit-level=high", "--json"]);
  attempts.push({ tool: "pnpm-audit", ...audit });

  const combinedOutput = `${audit.stdout}\n${audit.stderr}`;
  findings = parseTotals(audit.stdout || audit.stderr);

  if (audit.timedOut) {
    backend = { available: false, reason: "backend-timeout" };
    completeness = "degraded";
    degradedReasons.push("pnpm-audit-timeout");
    finalOutcome = mode === "strict" ? "failed-backend-unavailable" : "warn-backend-unavailable";
  } else if (findings) {
    backend = { available: true, reason: null };
    if ((findings.high || 0) + (findings.critical || 0) > 0) {
      finalOutcome = "failed-findings";
    }
  } else if (backendUnavailable(combinedOutput)) {
    findings = null;
    backend = { available: false, reason: "backend-unavailable" };
    completeness = "degraded";
    degradedReasons.push("pnpm-audit-backend-unavailable");
    finalOutcome = mode === "strict" ? "failed-backend-unavailable" : "warn-backend-unavailable";
  } else {
    findings = null;
    backend = { available: false, reason: "audit-command-failed" };
    completeness = "degraded";
    degradedReasons.push("pnpm-audit-command-failed");
    finalOutcome = mode === "strict" ? "failed-audit-error" : "warn-audit-error";
  }

  const osvCheck = run("bash", ["-lc", "command -v osv-scanner >/dev/null 2>&1"]);
  const osvPresent = osvCheck.status === 0;
  attempts.push({ tool: "osv-check", ...osvCheck });

  if (osvPresent) {
    const osvRun = run("osv-scanner", ["--lockfile=pnpm-lock.yaml", "--format", "json"]);
    attempts.push({ tool: "osv-scan", ...osvRun });
    writeFileSync(path.join(outputDir, "osv.json"), osvRun.stdout || osvRun.stderr, "utf8");

    if (osvRun.status !== 0) {
      degradedReasons.push("osv-scan-failed");
      completeness = "degraded";
      if (mode === "strict") {
        finalOutcome = "failed-osv";
      } else if (!finalOutcome.startsWith("failed")) {
        finalOutcome = "warn-osv";
      }
    }
  } else {
    degradedReasons.push("osv-scanner-missing");
    completeness = "degraded";
  }
}

if (mode === "off") {
  completeness = "none";
  degradedReasons.push("policy-off");
  finalOutcome = "skipped-policy-off";
}

const artifact = {
  generatedAt: new Date().toISOString(),
  verifierVersion: "2026-03-07.2",
  runId,
  ci: isCi,
  policyMode: mode,
  backend,
  completeness,
  degraded: completeness !== "full",
  degradedReasons,
  commandAttempts: attempts.map((entry) => ({
    tool: entry.tool,
    command: entry.command,
    status: entry.status,
    error: entry.error,
  })),
  fallbackPathUsed: backend.available ? null : backend.reason,
  osvPresent: attempts.some((entry) => entry.tool === "osv-scan"),
  findingsSummary: findings,
  finalOutcome,
};

const artifactPath = path.join(outputDir, "dependency-audit.json");
writeFileSync(artifactPath, JSON.stringify(artifact, null, 2), "utf8");
writeFileSync(
  path.join(repoRoot, "artifacts", "security", "dependency-audit-latest.json"),
  JSON.stringify(artifact, null, 2),
  "utf8"
);

console.log(`Dependency audit artifact: ${path.relative(repoRoot, artifactPath)}`);
console.log(`Dependency audit outcome: ${finalOutcome}`);
if (artifact.degraded) {
  console.log(`Dependency audit degraded reasons: ${degradedReasons.join(", ") || "none"}`);
}

if (finalOutcome.startsWith("failed")) {
  process.exit(1);
}
