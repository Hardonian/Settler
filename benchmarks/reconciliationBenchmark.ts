import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
type ReconDataRecord = {
  id: string;
  amount: number;
  currency: string;
  occurredAt: string;
  externalId?: string;
  description?: string;
  type?: string;
};

const SNAPSHOT_PATH = path.join(process.cwd(), "benchmarks", "snapshots.json");

const sourceData: ReconDataRecord[] = [
  {
    id: "src_001",
    amount: 120.5,
    currency: "USD",
    occurredAt: "2026-01-01T10:00:00.000Z",
    externalId: "pay_001",
    description: "Payout pay_001",
    type: "PAYOUT",
  },
  {
    id: "src_002",
    amount: 49.99,
    currency: "USD",
    occurredAt: "2026-01-03T12:00:00.000Z",
    externalId: "sale_002",
    description: "Order 1002",
    type: "CHARGE",
  },
  {
    id: "src_003",
    amount: 89.25,
    currency: "USD",
    occurredAt: "2026-01-04T12:00:00.000Z",
    externalId: "sale_003",
    description: "Order 1003",
    type: "CHARGE",
  },
];

const targetData: ReconDataRecord[] = [
  {
    id: "tgt_001",
    amount: 120.5,
    currency: "USD",
    occurredAt: "2026-01-01T11:00:00.000Z",
    externalId: "pay_001",
    description: "Settlement for pay_001",
    type: "TRANSFER",
  },
  {
    id: "tgt_002",
    amount: 49.99,
    currency: "USD",
    occurredAt: "2026-01-03T13:00:00.000Z",
    externalId: "bank_2002",
    description: "Deposit Order 1002",
    type: "TRANSFER",
  },
  {
    id: "tgt_003",
    amount: 89.25,
    currency: "USD",
    occurredAt: "2026-01-06T12:00:00.000Z",
    externalId: "bank_2003",
    description: "Deposit Order 1003",
    type: "TRANSFER",
  },
];

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
    a.localeCompare(b)
  );
  const body = entries
    .map(([key, nestedValue]) => `${JSON.stringify(key)}:${stableStringify(nestedValue)}`)
    .join(",");

  return `{${body}}`;
}

function hashContent(value: unknown): string {
  return crypto.createHash("sha256").update(stableStringify(value)).digest("hex");
}

function loadSnapshot(): { datasetChecksum: string; expectedOutputHash: string } {
  const raw = fs.readFileSync(SNAPSHOT_PATH, "utf-8");
  return JSON.parse(raw) as { datasetChecksum: string; expectedOutputHash: string };
}

function saveSnapshot(snapshot: { datasetChecksum: string; expectedOutputHash: string }): void {
  fs.writeFileSync(SNAPSHOT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, "utf-8");
}

async function main(): Promise<void> {
  process.env.DB_PASSWORD ??= "benchmark-db-password";
  process.env.ENCRYPTION_KEY ??= "12345678901234567890123456789012";
  process.env.JWT_SECRET ??= "benchmark-jwt-secret";
  process.env.JWT_REFRESH_SECRET ??= "benchmark-refresh-secret";

  const { ReconCoreEngine } = await import("../packages/api/src/services/recon-core");

  const dataset = { sourceData, targetData };
  const datasetChecksum = hashContent(dataset);

  const engine = new ReconCoreEngine({} as never);
  const startNs = process.hrtime.bigint();
  const output = await engine.performReconciliation(
    sourceData,
    targetData,
    "deterministic",
    {} as never
  );
  const endNs = process.hrtime.bigint();

  const durationMs = Number(endNs - startNs) / 1_000_000;
  const outputHash = hashContent(output);
  const memory = typeof process.memoryUsage === "function" ? process.memoryUsage() : undefined;

  console.log(`runtimeMs=${durationMs.toFixed(3)}`);
  console.log(`outputHash=${outputHash}`);
  if (memory) {
    console.log(`memory.rss=${memory.rss}`);
    console.log(`memory.heapUsed=${memory.heapUsed}`);
  }

  const writeSnapshot = process.argv.includes("--write-snapshot");
  const snapshot = { datasetChecksum, expectedOutputHash: outputHash };

  if (writeSnapshot) {
    saveSnapshot(snapshot);
    console.log(`snapshotUpdated=${SNAPSHOT_PATH}`);
    return;
  }

  const expected = loadSnapshot();
  if (expected.datasetChecksum !== datasetChecksum || expected.expectedOutputHash !== outputHash) {
    console.error("Benchmark regression detected.");
    console.error(
      JSON.stringify(
        {
          expected,
          actual: snapshot,
          outputPreview: output.map((match) => ({
            id: match.id,
            sourceId: match.sourceId,
            targetId: match.targetId,
            confidence: match.confidence,
          })),
        },
        null,
        2
      )
    );
    process.exit(1);
  }

  console.log("snapshotCheck=passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
