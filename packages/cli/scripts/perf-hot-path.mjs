#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { performance } from "node:perf_hooks";

const samples = [
  { name: "--help", args: ["src/index.ts", "--help"], thresholdMs: 1800 },
  { name: "--version", args: ["src/index.ts", "--version"], thresholdMs: 1800 },
  {
    name: "mcp ping",
    args: ["src/index.ts", "mcp", "ping", "--timeout-ms", "2500"],
    thresholdMs: 3200,
  },
];

for (const sample of samples) {
  const start = performance.now();
  const result = spawnSync("pnpm", ["exec", "tsx", ...sample.args], {
    encoding: "utf8",
    cwd: new URL("..", import.meta.url).pathname,
  });
  const duration = performance.now() - start;

  if ((result.status ?? 1) !== 0) {
    process.stderr.write(result.stderr || result.stdout || `Command failed: ${sample.name}\n`);
    process.exit(result.status ?? 1);
  }

  const thresholdStatus = duration <= sample.thresholdMs ? "PASS" : "WARN";
  console.log(
    `${thresholdStatus} ${sample.name}: ${duration.toFixed(2)}ms (threshold ${sample.thresholdMs}ms)`
  );
}
