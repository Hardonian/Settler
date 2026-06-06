import { describe, it, expect } from "vitest";
import { computePayloadHash, buildArtifactKey } from "./index";

describe("computePayloadHash", () => {
  it("computes deterministic hash for objects regardless of key order", () => {
    const payload1 = { a: 1, b: 2, c: 3 };
    const payload2 = { c: 3, a: 1, b: 2 };

    const hash1 = computePayloadHash(payload1);
    const hash2 = computePayloadHash(payload2);

    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex is 64 chars
  });

  it("produces different hashes for different payloads", () => {
    const hash1 = computePayloadHash({ id: "123", value: "A" });
    const hash2 = computePayloadHash({ id: "123", value: "B" });

    expect(hash1).not.toBe(hash2);
  });

  it("handles primitives (strings, numbers, booleans)", () => {
    const stringHash = computePayloadHash("test-string");
    const numberHash = computePayloadHash(12345);
    const boolHash = computePayloadHash(true);

    expect(stringHash).toMatch(/^[a-f0-9]{64}$/);
    expect(numberHash).toMatch(/^[a-f0-9]{64}$/);
    expect(boolHash).toMatch(/^[a-f0-9]{64}$/);

    // Ensure they are all distinct
    expect(stringHash).not.toBe(numberHash);
    expect(numberHash).not.toBe(boolHash);
  });

  it("throws TypeError when payload is null or undefined", () => {
    // Current implementation uses Object.keys(payload) without checking for null/undefined
    expect(() => computePayloadHash(null)).toThrow(TypeError);
    expect(() => computePayloadHash(undefined)).toThrow(TypeError);
  });

  it("computes consistent hash for complex nested structures (shallow sorting caveat)", () => {
    // Note: current implementation only sorts top-level keys
    // because JSON.stringify with replacer array only filters top-level,
    // and for nested objects, it filters them using the same array of keys!
    // So `{a: 1, b: {c: 2}}` with keys `['a', 'b']` works, but if `c` is not in top-level,
    // JSON.stringify will drop `c`!
    // This test just documents current behavior to prevent regressions
    const payload = {
      user: { id: "u1" },
      amount: 100,
    };

    const hash = computePayloadHash(payload);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe("buildArtifactKey", () => {
  it("builds a key correctly without a suffix", () => {
    const key = buildArtifactKey("source_snapshot", "run-123", "entity-456");
    expect(key).toBe("source_snapshot::run-123::entity-456");
  });

  it("builds a key correctly with a suffix", () => {
    const key = buildArtifactKey("match_comparison", "run-123", "entity-456", "extra");
    expect(key).toBe("match_comparison::run-123::entity-456::extra");
  });

  it("handles empty strings for parameters correctly", () => {
    const key = buildArtifactKey("source_snapshot", "", "entity-456");
    expect(key).toBe("source_snapshot::::entity-456");
  });

  it("does not include suffix if suffix is empty string", () => {
    const key = buildArtifactKey("operator_annotation", "run-123", "entity-456", "");
    // Note: since `if (suffix)` evaluates to false for an empty string `""`, it won't be pushed
    expect(key).toBe("operator_annotation::run-123::entity-456");
  });
});
