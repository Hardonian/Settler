#!/usr/bin/env node

import { existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = process.cwd();
const demoOutputDir = resolve(repoRoot, "examples/demo-output");
const localTeardownDir = resolve(demoOutputDir, "local");

/**
 * Run a command and capture status without throwing.
 * This keeps degraded cleanup states explicit and machine-visible.
 */
function runStep(label, command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: "inherit",
    shell: false,
    ...options,
  });

  const ok = result.status === 0;
  return {
    label,
    ok,
    exitCode: result.status ?? 1,
    command: `${command} ${args.join(" ")}`.trim(),
  };
}

const steps = [];

steps.push(runStep("stop_services", "pnpm", ["tb:stop"]));
steps.push(runStep("reset_demo_seed", "pnpm", ["demo:reset"]));

let demoOutputRemoved = false;
let demoOutputMessage = "not_found";
if (existsSync(localTeardownDir)) {
  rmSync(localTeardownDir, { recursive: true, force: true });
  demoOutputRemoved = true;
  demoOutputMessage = "removed_local_only";
} else if (existsSync(demoOutputDir)) {
  demoOutputMessage = "skipped_tracked_artifacts";
}

const summary = {
  operation: "dev_teardown",
  generatedAt: new Date().toISOString(),
  steps,
  artifacts: {
    demoOutputDir: localTeardownDir,
    status: demoOutputMessage,
    removed: demoOutputRemoved,
  },
  degraded: steps.filter((s) => !s.ok).map((s) => ({
    step: s.label,
    command: s.command,
    exitCode: s.exitCode,
  })),
};

const hardFailures = summary.degraded.length;
if (hardFailures > 0) {
  console.warn("\n⚠️ dev:teardown completed with degraded steps.");
} else {
  console.log("\n✅ dev:teardown completed successfully.");
}

console.log(JSON.stringify(summary, null, 2));

process.exit(0);
