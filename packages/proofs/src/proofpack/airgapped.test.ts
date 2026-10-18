import { describe, it, expect } from "vitest";
import { buildAirGappedProofpackTarball, createTarGz } from "./airgapped.js";
import zlib from "node:zlib";

describe("AirGapped Proofpack Tarball Generator", () => {
  it("creates a valid compressed tar archive with USTAR headers", () => {
    const files = [
      { name: "test.txt", content: "hello settler air-gapped" },
      { name: "data.json", content: JSON.stringify({ a: 1 }) },
    ];

    const tarGz = createTarGz(files);
    expect(tarGz).toBeInstanceOf(Buffer);
    expect(tarGz.length).toBeGreaterThan(0);

    // Decompress with native zlib
    const tar = zlib.gunzipSync(tarGz);
    expect(tar.length).toBeGreaterThan(1024);

    // Verify USTAR magic at offset 257
    const magic = tar.subarray(257, 262).toString("utf8");
    expect(magic).toBe("ustar");
  });

  it("builds a full air-gapped bundle with manifest, proofs, standalone verifier, and auditor README", () => {
    const result = buildAirGappedProofpackTarball({
      executionId: "exec_audit_2026_test",
      tenantId: "tenant_sovereign_1",
      evidenceArtifacts: [
        {
          id: "art_1",
          artifactType: "source_snapshot",
          payloadHash: "a".repeat(64),
        },
      ],
    });

    expect(result.tarball).toBeInstanceOf(Buffer);
    expect(result.rootHash).toHaveLength(64);
    expect(result.manifest.execution_id).toBe("exec_audit_2026_test");
    expect(result.manifest.tenant_id).toBe("tenant_sovereign_1");
    expect(result.proofs.computed_root).toBe(result.rootHash);

    // Decompress and verify files in tar archive
    const tar = zlib.gunzipSync(result.tarball);
    const tarString = tar.toString("utf8");
    expect(tarString).toContain("manifest.json");
    expect(tarString).toContain("proofs.json");
    expect(tarString).toContain("standalone-verifier.js");
    expect(tarString).toContain("README_AUDITOR.md");
    expect(tarString).toContain("ZERO-DEFECT CRYPTOGRAPHIC ATTESTATION VERIFIED");
  });
});
