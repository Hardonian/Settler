import { describe, it, expect } from "vitest";
import { canonicalJson, canonicalSha256 } from "./canonical-json.js";

describe("RFC 8785 JSON canonicalization", () => {
  it("sorts nested object properties by UTF-16 code units", () => {
    const left = {
      z: { beta: 2, alpha: 1 },
      a: [{ y: true, x: false }],
      "\ud83d\ude00": "astral",
      "\ufffd": "bmp",
    };
    const right = {
      "\ufffd": "bmp",
      "\ud83d\ude00": "astral",
      a: [{ x: false, y: true }],
      z: { alpha: 1, beta: 2 },
    };

    expect(canonicalJson(left)).toBe(canonicalJson(right));
    expect(canonicalSha256(left)).toBe(canonicalSha256(right));
  });

  it("uses ECMAScript number serialization and normalizes negative zero", () => {
    expect(canonicalJson([333333333.33333329, 1e30, 4.5, 0.002, 1e-27, -0])).toBe(
      "[333333333.3333333,1e+30,4.5,0.002,1e-27,0]"
    );
  });

  it("preserves JSON strings without Unicode or newline normalization", () => {
    const decomposed = "e\u0301\r\n";
    const composed = "é\n";
    expect(canonicalJson({ value: decomposed })).toBe(`{"value":${JSON.stringify(decomposed)}}`);
    expect(canonicalJson({ value: decomposed })).not.toBe(canonicalJson({ value: composed }));
  });

  it("rejects values outside the I-JSON data model", () => {
    expect(() => canonicalJson({ value: Number.NaN })).toThrow(/Non-finite/);
    expect(() => canonicalJson({ value: undefined })).toThrow(/Unsupported value type/);
    expect(() => canonicalJson({ value: "\ud800" })).toThrow(/Lone surrogate/);
  });
});
