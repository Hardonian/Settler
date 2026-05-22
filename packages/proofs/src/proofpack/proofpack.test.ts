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
});


describe("generatePackageKey", () => {
  it("formats the package key correctly when timestamp is provided", () => {
    const key = generatePackageKey("run_summary", "run", "run-123", "2023-01-01T00-00-00-000Z");
    expect(key).toBe("run_summary::run::run-123::2023-01-01T00-00-00-000Z");
  });

  it("generates a key with the current timestamp formatted when timestamp is omitted", () => {
    const key = generatePackageKey("audit_export", "tenant", "tenant-456");
    expect(key).toMatch(/^audit_export::tenant::tenant-456::\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z$/);
  });

  it("creates unique keys for different inputs", () => {
    const key1 = generatePackageKey("run_summary", "run", "run-123", "ts1");
    const key2 = generatePackageKey("audit_export", "run", "run-123", "ts1");
    expect(key1).not.toBe(key2);
  });
});
