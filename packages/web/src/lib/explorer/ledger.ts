import fs from "node:fs/promises";
import path from "node:path";

export type ExplorerLedgerEntry = {
  execution_id: string;
  tenant_id: string;
  trace_id: string;
  timestamp: string;
  execution_hash: string;
  previous_execution_hash: string;
  policy_version: string;
  input_hash: string;
  output_hash: string;
  status: string;
  duration: number;
  initiator: "CLI" | "API" | "worker";
  tool_calls: string[];
};

const LEDGER_DIR = path.resolve(process.cwd(), process.env.SETTLER_LEDGER_DIR ?? "ledger");

// Use a simple memoization pattern instead of React.cache
let cachedEntries: ExplorerLedgerEntry[] | null = null;

async function readAllInternal(): Promise<ExplorerLedgerEntry[]> {
  try {
    const files = (await fs.readdir(LEDGER_DIR)).filter((file) => file.endsWith(".json"));
    const entries = await Promise.all(
      files.map(async (file) => JSON.parse(await fs.readFile(path.join(LEDGER_DIR, file), "utf8")))
    );
    return (entries as ExplorerLedgerEntry[]).sort((a, b) =>
      b.timestamp.localeCompare(a.timestamp)
    );
  } catch {
    return [];
  }
}

async function readAll(): Promise<ExplorerLedgerEntry[]> {
  if (cachedEntries === null) {
    cachedEntries = await readAllInternal();
  }
  return cachedEntries;
}

export async function getExecutionLedgerEntry(id: string): Promise<ExplorerLedgerEntry | null> {
  const entries = await readAll();
  return entries.find((entry) => entry.execution_id === id) || null;
}

export async function listExecutionLedgerEntries(options: {
  tenantId?: string;
  offset?: number;
  limit?: number;
}): Promise<ExplorerLedgerEntry[]> {
  const offset = Math.max(0, options.offset ?? 0);
  const limit = Math.max(1, Math.min(options.limit ?? 50, 500));
  const entries = await readAll();
  const scoped = options.tenantId
    ? entries.filter((entry) => entry.tenant_id === options.tenantId)
    : entries;
  return scoped.slice(offset, offset + limit);
}
