import { createHash } from "node:crypto";

export const CANONICAL_HASH_ALGORITHM = "blake2s256";

function normalizeString(value: string): string {
  return value.replace(/\r\n/g, "\n").replace(/\r/g, "\n").normalize("NFC");
}

function canonicalize(value: unknown): unknown {
  if (typeof value === "string") return normalizeString(value);
  if (Array.isArray(value)) return value.map((v) => canonicalize(v));
  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[normalizeString(key)] = canonicalize((value as Record<string, unknown>)[key]);
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
