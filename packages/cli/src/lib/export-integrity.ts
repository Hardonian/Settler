import { createHash } from "node:crypto";

export const EXPORT_SCHEMA_VERSION = "1.0.0" as const;

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }

  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      result[key] = canonicalize((value as Record<string, unknown>)[key]);
    }
    return result;
  }

  return value;
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

export function computeReconciliationHash(run: unknown, matches: unknown[]): string {
  const payload = {
    run,
    matches: [...matches].sort((a, b) => {
      const aId = (a as { id?: string }).id ?? "";
      const bId = (b as { id?: string }).id ?? "";
      return aId.localeCompare(bId);
    }),
  };

  return createHash("sha256").update(stableStringify(payload)).digest("hex");
}

export function computeChainHash(previousHash: string | null, reconciliationHash: string): string {
  return createHash("sha256")
    .update(`${previousHash ?? "GENESIS"}:${reconciliationHash}`)
    .digest("hex");
}

export function validateHashChain(
  chain: Array<{
    previousHash: string | null;
    reconciliationHash: string;
    chainHash: string;
  }>
): { valid: boolean; brokenIndex: number | null } {
  let expectedPreviousHash: string | null = null;

  for (let index = 0; index < chain.length; index += 1) {
    const entry = chain[index];
    if (!entry) {
      return { valid: false, brokenIndex: index };
    }

    if (entry.previousHash !== expectedPreviousHash) {
      return { valid: false, brokenIndex: index };
    }

    const expectedChainHash = computeChainHash(entry.previousHash, entry.reconciliationHash);
    if (entry.chainHash !== expectedChainHash) {
      return { valid: false, brokenIndex: index };
    }

    expectedPreviousHash = entry.chainHash;
  }

  return { valid: true, brokenIndex: null };
}
