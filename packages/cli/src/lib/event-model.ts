import { createHash } from "node:crypto";

export interface SettlerEvent {
  sequence: number;
  stage: "ingest" | "normalize" | "match" | "settle" | "export" | "audit" | "policy" | "system";
  type: string;
  tenantId: string;
  runId: string;
  timestamp: string;
  payload: Record<string, unknown>;
  redacted?: boolean;
}

export interface EventEnvelope {
  schemaVersion: "2026-02-18";
  events: SettlerEvent[];
}

function normalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => normalize(entry));
  }

  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = normalize((value as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }

  return value;
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(normalize(value));
}

export function stableHash(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

export function sortEvents(events: SettlerEvent[]): SettlerEvent[] {
  return [...events].sort((a, b) => {
    if (a.sequence !== b.sequence) {
      return a.sequence - b.sequence;
    }

    if (a.timestamp !== b.timestamp) {
      return a.timestamp.localeCompare(b.timestamp);
    }

    return a.type.localeCompare(b.type);
  });
}

export function redactTenant(tenantId: string): string {
  return stableHash({ tenantId }).slice(0, 16);
}

export function buildAuditChain(
  events: SettlerEvent[]
): Array<{ index: number; hash: string; previousHash: string | null }> {
  const ordered = sortEvents(events);
  let previousHash: string | null = null;
  return ordered.map((event, index) => {
    const hash = stableHash({ previousHash, event });
    const link = { index, hash, previousHash };
    previousHash = hash;
    return link;
  });
}
