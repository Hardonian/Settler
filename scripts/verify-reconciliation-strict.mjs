#!/usr/bin/env node
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const matrix = [
  ["smoke", 42],
  ["integration", 42],
  ["chaos", 42],
  ["smoke", 99],
  ["chaos", 99],
];

const results = [];
for (const [profile, seed] of matrix) {
  const cmd = `pnpm --filter @settler/cli exec tsx src/index.ts foundry reconciliation-verify --profile ${profile} --seed ${seed} --strict`;
  try {
    const output = execSync(cmd, { encoding: "utf8", stdio: "pipe" });
    results.push({ profile, seed, status: "pass", output: JSON.parse(output) });
  } catch (error) {
    const stderr = error.stderr?.toString?.() ?? "";
    const stdout = error.stdout?.toString?.() ?? "";
    results.push({ profile, seed, status: "fail", error: `${stdout}\n${stderr}`.trim() });
  }
}

const failed = results.filter((item) => item.status === "fail");
const snapshot = {
  strict: true,
  tolerated_diffs: 0,
  matrix,
  failed_count: failed.length,
  git_sha: process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || null,
  generated_at: new Date().toISOString(),
  results,
};

const snapshotDir = path.resolve("artifacts/reconciliation/strict-matrix");
fs.mkdirSync(snapshotDir, { recursive: true });
const timestamp = snapshot.generated_at.replace(/[:.]/g, "-");
const historyPath = path.join(snapshotDir, `${timestamp}.json`);
const latestPath = path.join(snapshotDir, "latest.json");
fs.writeFileSync(historyPath, JSON.stringify(snapshot, null, 2));
fs.writeFileSync(latestPath, JSON.stringify(snapshot, null, 2));

console.log(JSON.stringify({ ...snapshot, artifacts: { historyPath, latestPath } }, null, 2));

if (failed.length > 0) {
  process.exitCode = 1;
}
