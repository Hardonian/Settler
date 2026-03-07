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

function main() {
  const summary = {
    generatedAt: new Date().toISOString(),
    verifierVersion: "2026-03-07.1",
    runId,
    status: "not-run",
    proofLevel: "static-only",
    boundary:
      "Live database RLS enforcement is not proven in this run. Static migration/policy assertions and app-level tenant tests are separate controls.",
    liveDbConfigured: Boolean(dbUrl),
    command: "pnpm exec tsx scripts/verify-rls-status.ts",
    commandStatus: null,
    stdout: "",
    stderr: "",
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
