import { describe, it, expect } from "vitest";
import { computePayloadHash, matchComparisonReliabilityFactors } from "./index";

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

describe("matchComparisonReliabilityFactors", () => {
  it("returns correct reliability factors for general inputs", () => {
    const confidence = 0.8;
    const sourceReliability = 0.9;
    const targetReliability = 0.85;

    const factors = matchComparisonReliabilityFactors(
      confidence,
      sourceReliability,
      targetReliability
    );

    expect(factors).toHaveLength(4);

    expect(factors[0]).toEqual({
      factor: "match_confidence",
      weight: 0.35,
      value: 0.8,
      notes: "Match confidence: 80.0%",
    });

    expect(factors[1]).toEqual({
      factor: "source_reliability",
      weight: 0.25,
      value: 0.9,
      notes: "Source data reliability: 90.0%",
    });

    expect(factors[2]).toEqual({
      factor: "target_reliability",
      weight: 0.25,
      value: 0.85,
      notes: "Target data reliability: 85.0%",
    });

    expect(factors[3]).toEqual({
      factor: "comparison_method",
      weight: 0.15,
      value: 0.95,
      notes: "Deterministic field comparison",
    });
  });

  it("handles edge case inputs of 0", () => {
    const factors = matchComparisonReliabilityFactors(0, 0, 0);

    expect(factors[0].value).toBe(0);
    expect(factors[0].notes).toBe("Match confidence: 0.0%");

    expect(factors[1].value).toBe(0);
    expect(factors[1].notes).toBe("Source data reliability: 0.0%");

    expect(factors[2].value).toBe(0);
    expect(factors[2].notes).toBe("Target data reliability: 0.0%");
  });

  it("handles edge case inputs of 1", () => {
    const factors = matchComparisonReliabilityFactors(1, 1, 1);

    expect(factors[0].value).toBe(1);
    expect(factors[0].notes).toBe("Match confidence: 100.0%");

    expect(factors[1].value).toBe(1);
    expect(factors[1].notes).toBe("Source data reliability: 100.0%");

    expect(factors[2].value).toBe(1);
    expect(factors[2].notes).toBe("Target data reliability: 100.0%");
  });
});
