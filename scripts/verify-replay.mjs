#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const isWindows = process.platform === "win32";
const pnpmCmd = isWindows ? "pnpm.cmd" : "pnpm";

const result = spawnSync(
  pnpmCmd,
  ["settler:replay", "examples/demo-output-fixtures/demo-run-1/evidence.json"],
  {
    stdio: "inherit",
    env: process.env,
    shell: isWindows,
  }
);

process.exit(result.status ?? 1);
