#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const result = spawnSync(
  "pnpm",
  ["settler:replay", "examples/demo-output-fixtures/demo-run-1/evidence.json"],
  {
    stdio: "inherit",
    env: process.env,
  }
);

process.exit(result.status ?? 1);
