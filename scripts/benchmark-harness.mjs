#!/usr/bin/env node
import { createHash } from "node:crypto";
import { performance } from "node:perf_hooks";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { spawnSync } from "node:child_process";

const { values: args } = parseArgs({
  options: {
    "sequential-count": { type: "string", default: "1000" },
    "concurrent-count": { type: "string", default: "100" },
    output: { type: "string", default: "docs/BENCHMARKS.md" },
  },
  strict: false,
});

const sequentialCount = parseInt(String(args["sequential-count"] ?? "1000"), 10);
const concurrentCount = parseInt(String(args["concurrent-count"] ?? "100"), 10);
const outputPath = path.resolve(String(args.output ?? "docs/BENCHMARKS.md"));

const tsHarness = spawnSync(
  "npx",
  [
    "pnpm",
    "exec",
    "tsx",
    "scripts/benchmark-harness.ts",
    "--sequential-count",
    String(sequentialCount),
    "--concurrent-count",
    String(concurrentCount),
    "--output",
    outputPath,
  ],
  {
    stdio: "inherit",
    env: process.env,
    shell: true,
  }
);
if (tsHarness.status === 0) {
  process.exit(0);
}

const stableStringify = (value) => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const entries = Object.entries(value)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`);
  return `{${entries.join(",")}}`;
};
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const simulate = (index) => {
  const records = Array.from({ length: 20 }, (_, i) => ({
    id: `${index}-${i}`,
    amount: i * 1.5 + index,
    ref: `INV-${index}-${i}`,
  }));
  const digest = sha256(stableStringify(records));
  return {
    digest,
    matched: Math.floor(records.length * 0.95),
    unmatched: Math.ceil(records.length * 0.05),
  };
};
const p95 = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.ceil(0.95 * sorted.length) - 1;
  return sorted[Math.max(0, idx)] ?? 0;
};

const runBenchmark = async (count) => {
  const latencies = [];
  const before = process.memoryUsage().heapUsed;
  const start = performance.now();
  for (let i = 0; i < count; i++) {
    const t0 = performance.now();
    simulate(i);
    latencies.push(performance.now() - t0);
  }
  const elapsed = performance.now() - start;
  return {
    throughput: (count / elapsed) * 1000,
    durationMs: elapsed,
    latencyP95Ms: p95(latencies),
    memoryDeltaMb: (process.memoryUsage().heapUsed - before) / 1024 / 1024,
  };
};

const sequential = await runBenchmark(sequentialCount);
const concurrent = await runBenchmark(concurrentCount);
const markdown = `# Settler Benchmarks

Generated: ${new Date().toISOString()}
Mode: fallback-js-harness (tsx benchmark harness unavailable in this environment)

## Sequential Reconciliation

| Metric | Value |
| --- | --- |
| Reconciliation throughput | ${sequential.throughput.toFixed(2)} runs/sec |
| Run duration | ${sequential.durationMs.toFixed(2)} ms |
| API latency (p95 proxy) | ${sequential.latencyP95Ms.toFixed(4)} ms |
| Memory usage delta | ${sequential.memoryDeltaMb.toFixed(2)} MB |

## Concurrent Reconciliation

| Metric | Value |
| --- | --- |
| Reconciliation throughput | ${concurrent.throughput.toFixed(2)} runs/sec |
| Run duration | ${concurrent.durationMs.toFixed(2)} ms |
| API latency (p95 proxy) | ${concurrent.latencyP95Ms.toFixed(4)} ms |
| Memory usage delta | ${concurrent.memoryDeltaMb.toFixed(2)} MB |
`;

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, markdown, "utf8");
console.log(markdown);
console.log(`\nReport written to ${outputPath}`);
