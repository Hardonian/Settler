#!/usr/bin/env node
import { readFileSync, statSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const strict = process.env.RELEASE_REQUIRE_SECURITY_EVIDENCE === "1";
const allowUnavailableSoft = process.env.RELEASE_ALLOW_AUDIT_UNAVAILABLE === "1";
const summaryFile =
  process.env.SECURITY_EVIDENCE_SUMMARY || "artifacts/security/supply-chain-latest.json";

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

function warn(message) {
  console.warn(`⚠️ ${message}`);
}

function ensureFile(relPath, problems) {
  if (!relPath) {
    problems.push("missing path in summary metadata");
    return;
  }
  try {
    const stats = statSync(path.join(repoRoot, relPath));
    if (!stats.isFile() || stats.size === 0) {
      problems.push(`${relPath} is empty or not a file`);
    }
  } catch (error) {
    problems.push(`${relPath}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function main() {
  const summaryPath = path.join(repoRoot, summaryFile);
  let summary;

  try {
    summary = JSON.parse(readFileSync(summaryPath, "utf8"));
  } catch (error) {
    if (strict) {
      fail(
        `Missing or unreadable supply-chain summary '${summaryFile}': ${error instanceof Error ? error.message : String(error)}`
      );
    }
    warn(`Security evidence not present locally (${summaryFile}); skipping strict validation.`);
    return;
  }

  const problems = [];
  ensureFile(summary?.sbom?.cyclonedx, problems);
  ensureFile(summary?.sbom?.spdx, problems);
  ensureFile(summaryFile, problems);

  const auditState = summary?.audit?.state || "unknown";
  if (
    !["pass", "fail", "unavailable-hard", "unavailable-soft", "misconfigured"].includes(auditState)
  ) {
    problems.push(`unknown audit state '${auditState}'`);
  }

  if (auditState === "fail") {
    problems.push(`audit_state=fail thresholdFailures=${summary.thresholdFailures || 0}`);
  }

  if (auditState === "unavailable-hard") {
    problems.push(
      `audit unavailable under hard policy (${summary?.audit?.unavailableCategory || "unknown"})`
    );
  }

  if (auditState === "misconfigured") {
    problems.push(
      `audit misconfigured (${summary?.audit?.unavailableCategory || "unknown"}); fix registry auth/config instead of skipping`
    );
  }

  if (auditState === "unavailable-soft" && strict && !allowUnavailableSoft) {
    problems.push(
      `audit unavailable-soft requires RELEASE_ALLOW_AUDIT_UNAVAILABLE=1; category=${summary?.audit?.unavailableCategory || "unknown"}`
    );
  }

  if (problems.length) {
    if (strict) {
      fail(`Security evidence invalid:\n - ${problems.join("\n - ")}`);
    }
    warn(`Security evidence has issues (non-strict mode):\n - ${problems.join("\n - ")}`);
    return;
  }

  if (auditState === "unavailable-soft") {
    warn(
      `SECURITY_SOFT_SKIP_RELEASE state=unavailable-soft category=${summary?.audit?.unavailableCategory || "unknown"}`
    );
  }

  console.log(`✅ Security evidence verified (${summaryFile}) with audit_state=${auditState}`);
}

main();
