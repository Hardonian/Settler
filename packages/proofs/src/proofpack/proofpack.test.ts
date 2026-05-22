import { describe, it, expect } from "vitest";
import { computePackageHash } from "./index";

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

  it("produces the expected deterministic hash for known inputs", () => {
    // This test ensures that the hashing algorithm (sha256) and payload structure
    // do not change unexpectedly, which would invalidate previously computed hashes.
    const evidenceIds = ["ev-1", "ev-2", "ev-3"];
    const packageType = "run_summary";
    const scopeIds = ["run-abc", "run-def"];

    // Hash of {"evidenceIds":["ev-1","ev-2","ev-3"],"packageType":"run_summary","scopeIds":["run-abc","run-def"]}
    const expectedHash = "9f790259146ba47c203ad653b43c4a743b34a3b602817e0806c8d117af7ddb17";

    expect(computePackageHash(evidenceIds, packageType, scopeIds)).toBe(expectedHash);
  });

  it("handles empty arrays for evidence and scope", () => {
    const hash = computePackageHash([], "run_summary", []);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);

    // Hash of {"evidenceIds":[],"packageType":"run_summary","scopeIds":[]}
    // 7bfb31d04bd7e8dd83ba796eebbc3f3e1ec34a06019318a0bc7f66a2b0c1696f
    expect(hash).toBe("f481a2496c98e538c0f38ca475eb0446f5bc195653353a8ab8390979aed6a9b6");
  });
});
