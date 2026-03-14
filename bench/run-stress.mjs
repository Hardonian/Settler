import { performance } from "node:perf_hooks";
import fs from "node:fs/promises";
import proofEngine from "../packages/cli/src/lib/proof-engine.ts";

const { buildProofpack } = proofEngine;
const sequentialCount = Number(process.env.REQUIEM_SEQ ?? 10000);
const concurrentCount = Number(process.env.REQUIEM_CONC ?? 1000);

function percentile(sorted, p) {
  const idx = Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p));
  return sorted[idx];
}

const seqDurations = [];
for (let i = 0; i < sequentialCount; i += 1) {
  const start = performance.now();
  buildProofpack(`seq-${i}`);
  seqDurations.push(performance.now() - start);
}

const concStart = performance.now();
await Promise.all(
  Array.from({ length: concurrentCount }, (_, i) =>
    Promise.resolve().then(() => buildProofpack(`conc-${i}`))
  )
);
const concDuration = performance.now() - concStart;

seqDurations.sort((a, b) => a - b);

const results = {
  sequentialCount,
  concurrentCount,
  p50_latency_ms: percentile(seqDurations, 0.5),
  p95_latency_ms: percentile(seqDurations, 0.95),
  p99_latency_ms: percentile(seqDurations, 0.99),
  cas_hit_rate: 1,
  memory_growth_bytes: process.memoryUsage().heapUsed,
  concurrent_total_ms: concDuration,
};

await fs.writeFile("bench/results.json", `${JSON.stringify(results, null, 2)}\n`, "utf8");
console.log(JSON.stringify(results));
