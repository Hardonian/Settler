import { describe, it, expect } from "vitest";
import { computePackageHash, verifyProofIntegrity, ProofPackageExport } from "./index";

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
});


describe("verifyProofIntegrity", () => {
  it("detects an invalid package hash", () => {
    const mockExport: any = {
      version: "1.0",
      exportedAt: "2023-01-01T00:00:00Z",
      package: {
        id: "pkg-1",
        type: "run_summary",
        key: "pkg-1-key",
        status: "final",
        scope: "run",
        scopeIds: ["run-1"],
        summary: {},
        packageHash: "invalid-hash",
        attestations: [],
      },
      evidence: [
        {
          id: "ev-1",
          payload: { data: "test" },
          payloadHash: "some-hash",
          degraded: false
        }
      ],
      completeness: {},
      integrity: {
        packageHash: "invalid-hash",
        evidenceHashes: {},
        algorithm: "sha256"
      }
    };

    const result = verifyProofIntegrity(mockExport as ProofPackageExport);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Package hash mismatch - evidence may have been tampered with");
  });
});
