#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const argv = process.argv.slice(2);

let profile = "fast";
if (argv.includes("--full")) {
  profile = "full";
} else if (argv.includes("--fast")) {
  profile = "fast";
}

const extra = argv.filter((arg) => arg !== "--full" && arg !== "--fast");

const result = spawnSync("node", ["scripts/verify-release.mjs", `--profile=${profile}`, ...extra], {
  stdio: "inherit",
  env: process.env,
});

process.exit(result.status ?? 1);
