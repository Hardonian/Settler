import { createHash } from "node:crypto";

export const CANONICAL_HASH_ALGORITHM = "blake2s256";

function assertUnicodeScalarValue(value: string): void {
  for (let index = 0; index < value.length; index += 1) {
    const codeUnit = value.charCodeAt(index);
    if (codeUnit >= 0xd800 && codeUnit <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) {
        throw new TypeError("RFC 8785 (JCS): Lone surrogate code points are not permitted");
      }
      index += 1;
    } else if (codeUnit >= 0xdc00 && codeUnit <= 0xdfff) {
      throw new TypeError("RFC 8785 (JCS): Lone surrogate code points are not permitted");
    }
  }
}

function serializeJcs(value: unknown, ancestors: Set<object>): string {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "string") {
    assertUnicodeScalarValue(value);
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new TypeError("RFC 8785 (JCS): Non-finite numbers are not permitted");
    }
    return Object.is(value, -0) ? "0" : JSON.stringify(value);
  }
  if (typeof value !== "object") {
    throw new TypeError(`RFC 8785 (JCS): Unsupported value type '${typeof value}'`);
  }
  if (ancestors.has(value)) {
    throw new TypeError("RFC 8785 (JCS): Cyclic values are not permitted");
  }

  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      return `[${value.map((item) => serializeJcs(item, ancestors)).join(",")}]`;
    }

    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError("RFC 8785 (JCS): Only JSON objects and arrays are permitted");
    }
    const record = value as Record<string, unknown>;
    const entries = Object.keys(record)
      .sort()
      .map((key) => {
        assertUnicodeScalarValue(key);
        return `${JSON.stringify(key)}:${serializeJcs(record[key], ancestors)}`;
      });
    return `{${entries.join(",")}}`;
  } finally {
    ancestors.delete(value);
  }
}

export function canonicalJson(value: unknown): string {
  return serializeJcs(value, new Set());
}

export function canonicalHash(value: unknown): string {
  return createHash(CANONICAL_HASH_ALGORITHM)
    .update(Buffer.from(canonicalJson(value), "utf8"))
    .digest("hex");
}
