import { describe, it, expect } from "vitest";
import { computePayloadHash } from "./index";

describe("computePayloadHash", () => {
  it("should generate consistent hashes for objects regardless of key order", () => {
    const payload1 = { a: 1, b: 2, c: 3 };
    const payload2 = { c: 3, a: 1, b: 2 };
    const payload3 = { b: 2, c: 3, a: 1 };

    const hash1 = computePayloadHash(payload1);
    const hash2 = computePayloadHash(payload2);
    const hash3 = computePayloadHash(payload3);

    expect(hash1).toBe(hash2);
    expect(hash2).toBe(hash3);

    // Ensure it's a valid hex string (sha256 is 64 characters)
    expect(hash1).toMatch(/^[a-f0-9]{64}$/);
  });

  it("should generate consistent hashes for nested objects", () => {
    const payload1 = { a: { x: 1, y: 2 }, b: 2 };
    // The top level keys are sorted, but nested keys might not be sorted by Object.keys(payload) alone.
    // However, the function only sorts the top-level keys. Let's test the actual behavior.
    const payload2 = { b: 2, a: { x: 1, y: 2 } };

    const hash1 = computePayloadHash(payload1);
    const hash2 = computePayloadHash(payload2);

    expect(hash1).toBe(hash2);
  });

  it("should generate different hashes for different payloads", () => {
    const hash1 = computePayloadHash({ a: 1, b: 2 });
    const hash2 = computePayloadHash({ a: 1, b: 3 });

    expect(hash1).not.toBe(hash2);
  });

  it("should handle strings successfully", () => {
    // Though it relies on Object.keys, strings get converted to an object array of characters
    // whose keys are string indices ("0", "1", ...).
    const hash1 = computePayloadHash("test string");
    const hash2 = computePayloadHash("test string");
    const hash3 = computePayloadHash("another string");

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
    expect(hash1).toMatch(/^[a-f0-9]{64}$/);
  });

  it("should handle arrays successfully", () => {
    const hash1 = computePayloadHash([1, 2, 3]);
    const hash2 = computePayloadHash([1, 2, 3]);
    const hash3 = computePayloadHash([3, 2, 1]);

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
  });
});
