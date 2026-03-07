#!/usr/bin/env node
import { spawnSync } from "node:child_process";

function run(command, args) {
  return spawnSync(command, args, { encoding: "utf8" });
}

console.log("Running dependency security audit...");
const audit = run("pnpm", ["audit", "--prod", "--audit-level=high"]);
process.stdout.write(audit.stdout || "");
process.stderr.write(audit.stderr || "");

const combined = `${audit.stdout || ""}\n${audit.stderr || ""}`;
if (audit.status !== 0) {
  if (combined.includes("ERR_PNPM_AUDIT_BAD_RESPONSE") || combined.includes("403: Forbidden")) {
    console.warn(
      "⚠️ pnpm audit endpoint unavailable in this environment; treating as non-blocking here."
    );
  } else {
    process.exit(audit.status ?? 1);
  }
}

console.log("\nAttempting OSV scan (non-blocking if missing binary)...");
const osvCheck = spawnSync("bash", ["-lc", "command -v osv-scanner >/dev/null 2>&1"]);
if (osvCheck.status === 0) {
  const osv = spawnSync("osv-scanner", ["--lockfile=pnpm-lock.yaml"], { stdio: "inherit" });
  if (osv.status !== 0) process.exit(osv.status ?? 1);
} else {
  console.log("⚠️ osv-scanner not found in environment; skipping OSV execution.");
}
