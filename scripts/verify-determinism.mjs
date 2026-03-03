#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const runA = spawnSync("pnpm", ["demo"], { encoding: "utf8", env: process.env });
const runB = spawnSync("pnpm", ["demo"], { encoding: "utf8", env: process.env });

if (runA.status !== 0 || runB.status !== 0) {
  process.stderr.write(runA.stderr || runB.stderr || "demo execution failed\n");
  process.exit(1);
}

const a = (runA.stdout.match(/Run Fingerprint:\s*(\w+)/) || [])[1];
const b = (runB.stdout.match(/Run Fingerprint:\s*(\w+)/) || [])[1];

if (!a || !b || a !== b) {
  console.error("❌ Determinism check failed: fingerprint drift detected");
  process.exit(1);
}

console.log(`✅ Determinism verified: ${a}`);
