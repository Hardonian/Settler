import { performance } from "perf_hooks";
import { sanitizeReportData } from "../../src/utils/xss-sanitize";
import { countJsonDepth } from "../../src/utils/json-depth";
import { sanitizeInput } from "../../src/middleware/input-sanitization";

type BenchmarkResult = {
  name: string;
  iterations: number;
  totalRuns: number;
  totalMs: number;
  p50: number;
  p95: number;
  p99: number;
  avg: number;
};

const iterations = Number(process.env.ITERATIONS ?? 2000);
const warmupIterations = Math.max(50, Math.floor(iterations * 0.05));

function percentile(values: number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx] ?? 0;
}

function runBenchmark(name: string, fn: () => void): BenchmarkResult {
  for (let i = 0; i < warmupIterations; i += 1) {
    fn();
  }

  const samples: number[] = [];
  const start = performance.now();
  for (let i = 0; i < iterations; i += 1) {
    const iterStart = performance.now();
    fn();
    const iterEnd = performance.now();
    samples.push(iterEnd - iterStart);
  }
  const end = performance.now();
  const totalMs = end - start;
  return {
    name,
    iterations,
    totalRuns: iterations + warmupIterations,
    totalMs,
    p50: percentile(samples, 50),
    p95: percentile(samples, 95),
    p99: percentile(samples, 99),
    avg: totalMs / iterations,
  };
}

function buildPayload(depth: number, breadth: number): Record<string, unknown> {
  const root: Record<string, unknown> = {};
  let current = root;
  for (let i = 0; i < depth; i += 1) {
    const next: Record<string, unknown> = {};
    for (let j = 0; j < breadth; j += 1) {
      next[`k${i}-${j}`] = `value-${i}-${j}`;
    }
    current[`level-${i}`] = next;
    current = next;
  }
  return root;
}

const payload = buildPayload(8, 4);
const xssPayload = {
  title: '<script>alert("x")</script>',
  rows: Array.from({ length: 100 }, (_, i) => ({
    id: i,
    label: `Row ${i}`,
    note: `safe-${i}`,
  })),
};
const queryPayload = Object.fromEntries(
  Array.from({ length: 200 }, (_, i) => [`param${i}`, `safe-value-${i}`])
);

const depthResult = runBenchmark("json-depth-check", () => {
  countJsonDepth(payload, { maxDepth: 20 });
});

const sanitizeResult = runBenchmark("sanitize-report-data", () => {
  const cloned = JSON.parse(JSON.stringify(xssPayload));
  sanitizeReportData(cloned);
});

const querySanitizeResult = runBenchmark("sanitize-query-params", () => {
  const req = {
    body: null,
    query: { ...queryPayload },
    path: "/api/test",
    ip: "127.0.0.1",
  };

  sanitizeInput(req as never, {} as never, () => undefined);
});

const results = [depthResult, sanitizeResult, querySanitizeResult];

process.stdout.write("API Hot Path Benchmarks\n");
process.stdout.write(`Iterations: ${iterations}\n`);
for (const result of results) {
  process.stdout.write(`${result.name}\n`);
  process.stdout.write(`  total_ms: ${result.totalMs.toFixed(2)}\n`);
  process.stdout.write(`  avg_ms: ${result.avg.toFixed(4)}\n`);
  process.stdout.write(`  p50_ms: ${result.p50.toFixed(4)}\n`);
  process.stdout.write(`  p95_ms: ${result.p95.toFixed(4)}\n`);
  process.stdout.write(`  p99_ms: ${result.p99.toFixed(4)}\n`);
}
