import { createHash } from "crypto";

export function codePointCompare(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

export function stableSortStrings(values: readonly string[]): string[] {
  return [...values].sort(codePointCompare);
}

type CanonicalValue =
  | null
  | boolean
  | number
  | string
  | CanonicalValue[]
  | { [key: string]: CanonicalValue };

function canonicalize(value: unknown): CanonicalValue {
  if (value === null) return null;
  if (typeof value === "boolean" || typeof value === "number" || typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => canonicalize(item));
  }

  if (typeof value === "object") {
    const input = value as Record<string, unknown>;
    const keys = stableSortStrings(Object.keys(input));
    const normalized: Record<string, CanonicalValue> = {};
    for (const key of keys) {
      const nested = input[key];
      if (nested === undefined) continue;
      normalized[key] = canonicalize(nested);
    }
    return normalized;
  }

  return String(value);
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

export function stableSha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}
