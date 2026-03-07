#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = process.cwd();
const cmd = [
  "--filter",
  "@settler/web",
  "exec",
  "jest",
  "--runInBand",
  "--forceExit",
  "src/__tests__/api/tenant-runtime-cross-tenant.test.ts",
  "src/__tests__/security/crossTenantIsolation.test.ts",
  "src/__tests__/security/crossTenantMatrix.test.ts",
];

const run = spawnSync("pnpm", cmd, { cwd: repoRoot, encoding: "utf8" });
process.stdout.write(run.stdout || "");
process.stderr.write(run.stderr || "");

const artifact = {
  generatedAt: new Date().toISOString(),
  verifierVersion: "2026-03-07.2",
  status: run.status === 0 ? "passed" : "failed",
  command: `pnpm ${cmd.join(" ")}`,
  exitCode: run.status ?? 1,
  suiteFiles: [
    "src/__tests__/api/tenant-runtime-cross-tenant.test.ts",
    "src/__tests__/security/crossTenantIsolation.test.ts",
    "src/__tests__/security/crossTenantMatrix.test.ts",
  ],
  degraded: false,
};

mkdirSync(path.join(repoRoot, "artifacts", "security"), { recursive: true });
writeFileSync(
  path.join(repoRoot, "artifacts", "security", "cross-tenant-results-latest.json"),
  JSON.stringify(artifact, null, 2),
  "utf8"
);

if (run.status !== 0) process.exit(run.status ?? 1);
