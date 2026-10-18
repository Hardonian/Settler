import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { performance } from "node:perf_hooks";
import { summarizeNextTrace } from "./lib/next-build-trace.mjs";

const repoRoot = resolve(import.meta.dirname, "..");
const artifactsDir = join(repoRoot, "artifacts");
const tracePath = join(repoRoot, "packages", "web", ".next", "trace");
const turboRunsDir = join(repoRoot, ".turbo", "runs");
const profileBase = join(artifactsDir, "turbo-build-profile");
const warm = process.argv.includes("--warm");

mkdirSync(artifactsDir, { recursive: true });

const args = [
  "exec",
  "turbo",
  "run",
  "build",
  "--filter",
  "@settler/web...",
  "--summarize",
  `--profile=${profileBase}`,
];
if (!warm) args.push("--force");

const command = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const startedAt = new Date().toISOString();
const started = performance.now();
const result = spawnSync(command, args, {
  cwd: repoRoot,
  env: process.env,
  stdio: "inherit",
});
const durationMs = Math.round(performance.now() - started);

if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);

let nextLongestSpans = [];
if (existsSync(tracePath)) {
  nextLongestSpans = summarizeNextTrace(readFileSync(tracePath, "utf8"));
}

let turboRunSummary = null;
if (existsSync(turboRunsDir)) {
  const summaries = readdirSync(turboRunsDir)
    .filter((entry) => entry.endsWith(".json"))
    .map((entry) => join(turboRunsDir, entry))
    .sort((left, right) => statSync(right).mtimeMs - statSync(left).mtimeMs);
  if (summaries[0]) turboRunSummary = relative(repoRoot, summaries[0]);
}

const report = {
  schemaVersion: 1,
  mode: warm ? "warm-cache" : "forced-execution",
  startedAt,
  durationMs,
  command: [command, ...args],
  turboRunSummary,
  nextTrace: existsSync(tracePath) ? relative(repoRoot, tracePath) : null,
  nextLongestSpans,
};

const reportPath = join(artifactsDir, "build-profile-summary.json");
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(`Build profile written to ${relative(repoRoot, reportPath)}`);
console.log(`Wall time: ${(durationMs / 1_000).toFixed(1)}s`);
for (const span of nextLongestSpans.slice(0, 10)) {
  console.log(`  ${span.name}: ${span.durationMs.toFixed(1)}ms`);
}
