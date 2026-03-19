import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

export type Initiator = "CLI" | "API" | "worker";
export type ExecutionStatus = "success" | "failed" | "replayed" | "running";

export type CanonicalExecutionReceipt = {
  execution_id: string;
  tenant_id: string;
  trace_id: string;
  timestamp: string;
  policy_version: string;
  input_hash: string;
  output_hash: string;
  status: ExecutionStatus;
  duration: number;
  initiator: Initiator;
  tool_calls: string[];
};

export type LedgerEntry = CanonicalExecutionReceipt & {
  previous_execution_hash: string;
  execution_hash: string;
};

export type VerificationReport = {
  executionId: string;
  receiptIntegrity: boolean;
  hashMatches: boolean;
  replayCompatible: boolean;
  expectedHash: string;
  computedHash: string;
};

const LEDGER_DIR = path.resolve(process.env.SETTLER_LEDGER_DIR ?? "ledger");

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
    a.localeCompare(b)
  );
  return `{${entries
    .map(([key, nested]) => `${JSON.stringify(key)}:${stableStringify(nested)}`)
    .join(",")}}`;
}

function blake3Hex(payload: string): string {
  const hasher = crypto.createHash("blake2s256");
  hasher.update(payload, "utf8");
  return hasher.digest("hex");
}

function computeExecutionHash(
  previousExecutionHash: string,
  receipt: CanonicalExecutionReceipt
): string {
  return blake3Hex(`${previousExecutionHash}${stableStringify(receipt)}`);
}

function entryPath(executionId: string): string {
  return path.join(LEDGER_DIR, `${executionId}.json`);
}

export async function listLedgerEntries(tenantId?: string): Promise<LedgerEntry[]> {
  try {
    const files = (await fs.readdir(LEDGER_DIR)).filter((file) => file.endsWith(".json"));
    const entries: LedgerEntry[] = [];

    for (const file of files) {
      const raw = await fs.readFile(path.join(LEDGER_DIR, file), "utf8");
      const parsed = JSON.parse(raw) as LedgerEntry;
      if (!tenantId || parsed.tenant_id === tenantId) {
        entries.push(parsed);
      }
    }

    return entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  } catch {
    return [];
  }
}

export async function getLedgerEntry(executionId: string): Promise<LedgerEntry | null> {
  try {
    const raw = await fs.readFile(entryPath(executionId), "utf8");
    return JSON.parse(raw) as LedgerEntry;
  } catch {
    return null;
  }
}

async function latestExecutionHash(tenantId: string): Promise<string> {
  const entries = await listLedgerEntries(tenantId);
  return entries[0]?.execution_hash ?? "GENESIS";
}

export async function appendLedgerEntry(receipt: CanonicalExecutionReceipt): Promise<LedgerEntry> {
  await fs.mkdir(LEDGER_DIR, { recursive: true });
  const previous_execution_hash = await latestExecutionHash(receipt.tenant_id);
  const execution_hash = computeExecutionHash(previous_execution_hash, receipt);
  const entry: LedgerEntry = { ...receipt, previous_execution_hash, execution_hash };
  await fs.writeFile(
    entryPath(receipt.execution_id),
    `${JSON.stringify(entry, null, 2)}\n`,
    "utf8"
  );
  return entry;
}

export async function verifyLedgerEntry(executionId: string): Promise<VerificationReport | null> {
  const entry = await getLedgerEntry(executionId);
  if (!entry) {
    return null;
  }

  const canonicalReceipt: CanonicalExecutionReceipt = {
    execution_id: entry.execution_id,
    tenant_id: entry.tenant_id,
    trace_id: entry.trace_id,
    timestamp: entry.timestamp,
    policy_version: entry.policy_version,
    input_hash: entry.input_hash,
    output_hash: entry.output_hash,
    status: entry.status,
    duration: entry.duration,
    initiator: entry.initiator,
    tool_calls: entry.tool_calls,
  };

  const computedHash = computeExecutionHash(entry.previous_execution_hash, canonicalReceipt);

  return {
    executionId: executionId,
    receiptIntegrity: Boolean(entry.execution_id && entry.tenant_id && entry.trace_id),
    hashMatches: computedHash === entry.execution_hash,
    replayCompatible: Boolean(entry.input_hash && entry.output_hash),
    expectedHash: entry.execution_hash,
    computedHash,
  };
}

export function diffLedgerEntries(
  a: LedgerEntry,
  b: LedgerEntry
): Record<string, { a: unknown; b: unknown }> {
  const diff: Record<string, { a: unknown; b: unknown }> = {};
  const keys: Array<keyof LedgerEntry> = [
    "input_hash",
    "output_hash",
    "policy_version",
    "tool_calls",
    "duration",
    "status",
  ];

  for (const key of keys) {
    const left = a[key];
    const right = b[key];
    if (stableStringify(left) !== stableStringify(right)) {
      diff[key] = { a: left, b: right };
    }
  }

  return diff;
}

export function getLedgerDir(): string {
  return LEDGER_DIR;
}
