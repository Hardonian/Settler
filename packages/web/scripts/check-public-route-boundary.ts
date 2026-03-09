#!/usr/bin/env tsx
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const scriptPath = resolve(__dirname, "../../../scripts/boundary-linter.mjs");
const run = spawnSync("node", [scriptPath], { stdio: "inherit" });
if (run.error) {
  console.error(`boundary validation failed to start: ${run.error.message}`);
  process.exit(1);
}
process.exit(run.status ?? 1);
