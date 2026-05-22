import { describe, it, expect } from "vitest";
import { computePackageHash, generatePackageKey } from "./index";

describe("computePackageHash", () => {
  it("produces identical hashes regardless of when called (no timestamp dependency)", () => {
    const evidenceIds = ["ev-1", "ev-2", "ev-3"];
    const packageType = "run_summary";
    const scopeIds = ["run-abc", "run-def"];

    const hash1 = computePackageHash(evidenceIds, packageType, scopeIds);
    const hash2 = computePackageHash(evidenceIds, packageType, scopeIds);
    const hash3 = computePackageHash(evidenceIds, packageType, scopeIds);

    expect(hash1).toBe(hash2);
    expect(hash2).toBe(hash3);
    expect(hash1).toMatch(/^[a-f0-9]{64}$/);
  });

  it("produces different hashes for different evidence sets", () => {
    const hash1 = computePackageHash(["ev-1", "ev-2"], "run_summary", ["run-abc"]);
    const hash2 = computePackageHash(["ev-1", "ev-3"], "run_summary", ["run-abc"]);

    expect(hash1).not.toBe(hash2);
  });

  it("produces different hashes for different package types", () => {
    const hash1 = computePackageHash(["ev-1"], "run_summary", ["run-abc"]);
    const hash2 = computePackageHash(["ev-1"], "audit_export", ["run-abc"]);

    expect(hash1).not.toBe(hash2);
  });

  it("produces same hash regardless of input order (sorted internally)", () => {
    const hash1 = computePackageHash(["ev-3", "ev-1", "ev-2"], "run_summary", [
      "run-def",
      "run-abc",
    ]);
    const hash2 = computePackageHash(["ev-1", "ev-2", "ev-3"], "run_summary", [
      "run-abc",
      "run-def",
    ]);

    expect(hash1).toBe(hash2);
  });

  it("produces a known deterministic hash for specific inputs", () => {
    // This test ensures that the JSON serialization and hashing algorithm remain stable.
    // Hash corresponds to: {"evidenceIds":["ev-1","ev-2"],"packageType":"run_summary","scopeIds":["run-1"]}
    const hash = computePackageHash(["ev-2", "ev-1"], "run_summary", ["run-1"]);
    expect(hash).toBe("c92df386251339ea28ec9834322f6730c40a02523677247f1621384e0023aadc");
  });

  it("handles empty arrays gracefully and deterministically", () => {
    // Hash corresponds to: {"evidenceIds":[],"packageType":"run_summary","scopeIds":[]}
    const hash = computePackageHash([], "run_summary", []);
    expect(hash).toBe("f481a2496c98e538c0f38ca475eb0446f5bc195653353a8ab8390979aed6a9b6");
  });
});
