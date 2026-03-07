#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = process.cwd();
const runId = process.env.GITHUB_RUN_ID || new Date().toISOString().replace(/[:.]/g, "-");
const outputDir = path.join(repoRoot, "artifacts", "security", "rls-verification", runId);
mkdirSync(outputDir, { recursive: true });

const dbUrl =
  process.env.DATABASE_URL || process.env.DIRECT_URL || process.env.SUPABASE_DB_URL || null;
const requireLive = process.env.SECURITY_REQUIRE_LIVE_RLS === "1";

function main() {
  const summary = {
    generatedAt: new Date().toISOString(),
    verifierVersion: "2026-03-08.1",
    runId,
    status: "not-run",
    proofLevel: "static-only",
    boundary:
      "Live database RLS enforcement not executed in this run. Static migration/policy assertions and app-level tenant denial are separate controls.",
    policy: {
      requireLiveVerification: requireLive,
    },
    liveDbConfigured: Boolean(dbUrl),
    command: "pnpm exec tsx scripts/verify-rls-status.ts",
    commandStatus: null,
    stdout: "",
    stderr: "",
    operatorGuidance: {
      liveVerificationEntrypoint: "pnpm run verify:rls:live",
      requiredEnv: ["DATABASE_URL or DIRECT_URL or SUPABASE_DB_URL"],
      expectations: [
        "RLS is enabled on critical tenant tables",
        "Policy count is non-zero for each critical table",
        "Failures are blocking when SECURITY_REQUIRE_LIVE_RLS=1",
      ],
    },
  };

  if (dbUrl) {
    const result = spawnSync("pnpm", ["exec", "tsx", "scripts/verify-rls-status.ts"], {
      cwd: repoRoot,
      encoding: "utf8",
      timeout: 120_000,
    });

    summary.commandStatus = result.status;
    summary.stdout = result.stdout || "";
    summary.stderr = result.stderr || "";

    if (result.status === 0) {
      summary.status = "passed";
      summary.proofLevel = "live-db-confirmed";
      summary.boundary =
        "Live DB RLS status verified for critical tables via verify-rls-status.ts.";
    } else {
      summary.status = "failed";
      summary.proofLevel = "live-db-attempted-failed";
      summary.boundary =
        "Live DB credentials were present, but RLS verification failed. Review stdout/stderr in artifact.";
    }
  } else if (requireLive) {
    summary.status = "failed";
    summary.proofLevel = "live-db-required-missing-config";
    summary.boundary =
      "Live RLS verification required by policy but database credentials are missing.";
  }

  const outPath = path.join(outputDir, "rls-verification.json");
  writeFileSync(outPath, JSON.stringify(summary, null, 2));
  writeFileSync(
    path.join(repoRoot, "artifacts", "security", "rls-verification-latest.json"),
    JSON.stringify(summary, null, 2)
  );

  console.log(`RLS verification artifact: ${path.relative(repoRoot, outPath)}`);
  console.log(`RLS proof level: ${summary.proofLevel}`);

  if (summary.status === "failed") process.exit(1);
}

main();
