#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const result = spawnSync("npx", ["pnpm", "demo"], {
  stdio: "inherit",
  env: process.env,
  shell: true,
});
process.exit(result.status ?? 1);
