#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = process.cwd();
const runId = process.env.GITHUB_RUN_ID || new Date().toISOString().replace(/[:.]/g, "-");
const outputDir = path.join(repoRoot, "artifacts", "security", "rls-verification", runId);
mkdirSync(outputDir, { recursive: true });

const dbUrl =
  process.env.DATABASE_URL || process.env.DIRECT_URL || process.env.SUPABASE_DB_URL || null;
const mode = process.env.SECURITY_RLS_EVIDENCE_MODE || "static-only";
const requireLive =
  mode === "runtime-rls-required" || process.env.SECURITY_REQUIRE_LIVE_RLS === "1";
const runtimeMode = mode === "runtime-rls" || mode === "runtime-rls-required";
const rlsStatusOut = path.join(outputDir, "rls-status.json");

function main() {
  const summary = {
    generatedAt: new Date().toISOString(),
    verifierVersion: "2026-03-09.1",
    reportVersion: "2026-03-09.1",
    runId,
    mode,
    status: "not-run",
    proofLevel: "static-only",
    boundary:
      "Runtime RLS verification not executed in this run; only static/policy boundary is available.",
    policy: {
      requireLiveVerification: requireLive,
      runtimeMode,
    },
    liveDbConfigured: Boolean(dbUrl),
    command: "pnpm exec tsx scripts/verify-rls-status.ts",
    commandStatus: null,
    stdout: "",
    stderr: "",
    testedTables: [],
    policyPresence: null,
    fixtures: null,
    allowDenyMatrix: null,
    failures: [],
    skipped: [],
    operatorGuidance: {
      liveVerificationEntrypoint: "pnpm run verify:rls:live",
      requiredEnv: ["DATABASE_URL or DIRECT_URL or SUPABASE_DB_URL"],
      expectations: [
        "same-tenant allow",
        "cross-tenant deny",
        "anonymous deny",
        "RLS enabled + policies present on critical tables",
      ],
    },
  };

  if (dbUrl && runtimeMode) {
    const result = spawnSync("npx", ["pnpm", "exec", "tsx", "scripts/verify-rls-status.ts"], {
      cwd: repoRoot,
      encoding: "utf8",
      timeout: 120_000,
      env: { ...process.env, RLS_STATUS_OUTPUT: rlsStatusOut },
      shell: true,
    });

    summary.commandStatus = result.status;
    summary.stdout = result.stdout || "";
    summary.stderr = result.stderr || "";

    try {
      const parsed = JSON.parse(readFileSync(rlsStatusOut, "utf8"));
      summary.testedTables = parsed.criticalTables || [];
      summary.policyPresence = parsed.policyPresence || null;
      summary.fixtures = parsed.runtimeHarness?.fixtures || null;
      summary.allowDenyMatrix = parsed.runtimeHarness?.allowDenyMatrix || null;
      if (parsed.runtimeHarness?.errors?.length) {
        summary.failures.push(...parsed.runtimeHarness.errors);
      }
    } catch {
      summary.failures.push("RLS status output was not generated or unreadable.");
    }

    if (result.status === 0) {
      summary.status = "passed";
      summary.proofLevel = "live-db-confirmed";
      summary.boundary = "Live DB RLS policy and runtime allow/deny matrix were confirmed.";
    } else {
      summary.status = "failed";
      summary.proofLevel = "live-db-attempted-failed";
      summary.boundary =
        "Live DB runtime verification attempted but failed. Review allow/deny matrix and table policy presence.";
    }
  } else if (!runtimeMode) {
    summary.status = "skipped";
    summary.skipped.push("SECURITY_RLS_EVIDENCE_MODE=static-only");
  } else if (requireLive) {
    summary.status = "failed";
    summary.proofLevel = "live-db-required-missing-config";
    summary.boundary = "Runtime RLS verification required but database credentials are missing.";
    summary.failures.push("Missing DATABASE_URL/DIRECT_URL/SUPABASE_DB_URL.");
  } else {
    summary.status = "skipped";
    summary.skipped.push("No DB credentials available for runtime RLS verification.");
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
