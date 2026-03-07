#!/usr/bin/env node
import { readFileSync, statSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const strict = process.env.RELEASE_REQUIRE_SECURITY_EVIDENCE === "1";
const allowAuditUnavailable = process.env.RELEASE_ALLOW_AUDIT_UNAVAILABLE === "1";
const summaryFile =
  process.env.SECURITY_EVIDENCE_SUMMARY || "artifacts/security/supply-chain-latest.json";

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

function warn(message) {
  console.warn(`⚠️ ${message}`);
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

  const requiredPaths = [summary?.sbom?.cyclonedx, summary?.sbom?.spdx, summaryFile];
  const missing = [];

  for (const rel of requiredPaths) {
    if (!rel) {
      missing.push("missing path in summary metadata");
      continue;
    }
    try {
      const stats = statSync(path.join(repoRoot, rel));
      if (!stats.isFile() || stats.size === 0) {
        missing.push(`${rel} is empty or not a file`);
      }
    } catch (error) {
      missing.push(`${rel}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (summary.thresholdFailures > 0) {
    missing.push(
      `thresholdFailures=${summary.thresholdFailures} at failLevel=${summary.failLevel}`
    );
  }

  if (summary.auditUnavailableReason && strict && !allowAuditUnavailable) {
    missing.push(
      `auditUnavailableReason=${summary.auditUnavailableReason} (set RELEASE_ALLOW_AUDIT_UNAVAILABLE=1 to permit)`
    );
  }

  if (missing.length) {
    if (strict) {
      fail(`Security evidence invalid:\n - ${missing.join("\n - ")}`);
    }
    warn(`Security evidence has issues (non-strict mode):\n - ${missing.join("\n - ")}`);
    return;
  }

  console.log(`✅ Security evidence verified (${summaryFile})`);
}

main();
