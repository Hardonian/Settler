import { createHash } from "node:crypto";

export const CANONICAL_HASH_ALGORITHM = "blake2s256";

function normalizeString(value: string): string {
  return value.replace(/\r\n/g, "\n").replace(/\r/g, "\n").normalize("NFC");
}

function canonicalize(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") return normalizeString(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new TypeError("RFC 8785 (JCS): Non-finite numbers are not permitted");
    }
    // Normalize -0 to 0
    return Object.is(value, -0) ? 0 : value;
  }
  if (Array.isArray(value)) return value.map((v) => canonicalize(v));
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    // Sort keys strictly by UTF-16 code units as required by RFC 8785
    return Object.keys(record)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        const val = record[key];
        if (val !== undefined && typeof val !== "function" && typeof val !== "symbol") {
          acc[normalizeString(key)] = canonicalize(val);
        }
        return acc;
      }, {});
  }
  return value;
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

export function canonicalHash(value: unknown): string {
  return createHash(CANONICAL_HASH_ALGORITHM)
    .update(Buffer.from(canonicalJson(value), "utf8"))
    .digest("hex");
}
