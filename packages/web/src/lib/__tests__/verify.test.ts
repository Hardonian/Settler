import { verifyBundle, verifyManifestNative, sha256Hex } from "../verify";
import type { EvidenceManifest, NamedFile } from "@/types/verification";

describe("Web Proofpack Verifier", () => {
  const encoder = new TextEncoder();
  const fileAContent = encoder.encode('{"left_record":"101","amount":5000}');
  const fileBContent = encoder.encode('{"right_record":"101","amount":5000}');

  let hashA: string;
  let hashB: string;

  beforeAll(async () => {
    hashA = await sha256Hex(fileAContent);
    hashB = await sha256Hex(fileBContent);
  });

  const getValidManifest = (): EvidenceManifest => ({
    input_hashes: { left: hashA, right: hashB },
    ruleset_hash: "ruleset-hash-001",
    output_hashes: { result: "result-hash-001" },
    files: [
      { path: "records-left.json", sha256: hashA, role: "input" },
      { path: "records-right.json", sha256: hashB, role: "input" },
    ],
    kernel_version: "1.6.0",
    deterministic_statement: "Deterministic outputs verified",
    schema_version: "v1",
  });

  const getFiles = (): NamedFile[] => [
    { path: "records-left.json", bytes: Array.from(fileAContent) },
    { path: "records-right.json", bytes: Array.from(fileBContent) },
  ];

  it("verifies a valid evidence manifest with 100% cryptographic integrity", async () => {
    const manifest = getValidManifest();
    const files = getFiles();

    const result = await verifyBundle(manifest, files);
    expect(result).not.toBeNull();
    expect(result?.success).toBe(true);
    expect(result?.mismatches).toHaveLength(0);
  });

  it("detects tampered file contents and reports Hash mismatch", async () => {
    const manifest = getValidManifest();
    const tamperedFiles: NamedFile[] = [
      { path: "records-left.json", bytes: Array.from(encoder.encode('{"tampered":true}')) },
      { path: "records-right.json", bytes: Array.from(fileBContent) },
    ];

    const result = await verifyManifestNative(manifest, tamperedFiles);
    expect(result.success).toBe(false);
    expect(result.mismatches).toHaveLength(1);
    expect(result.mismatches[0]?.path).toBe("records-left.json");
    expect(result.mismatches[0]?.reason).toBe("Hash mismatch");
  });

  it("detects missing files declared in manifest", async () => {
    const manifest = getValidManifest();
    const incompleteFiles: NamedFile[] = [
      { path: "records-left.json", bytes: Array.from(fileAContent) },
    ];

    const result = await verifyManifestNative(manifest, incompleteFiles);
    expect(result.success).toBe(false);
    expect(result.mismatches).toHaveLength(1);
    expect(result.mismatches[0]?.path).toBe("records-right.json");
    expect(result.mismatches[0]?.reason).toBe("Missing file");
  });

  it("detects undeclared unexpected files in bundle", async () => {
    const manifest = getValidManifest();
    const extraFiles: NamedFile[] = [
      ...getFiles(),
      { path: "unauthorized-extra.txt", bytes: Array.from(encoder.encode("extra payload")) },
    ];

    const result = await verifyManifestNative(manifest, extraFiles);
    expect(result.success).toBe(false);
    expect(result.mismatches).toHaveLength(1);
    expect(result.mismatches[0]?.path).toBe("unauthorized-extra.txt");
    expect(result.mismatches[0]?.reason).toBe("Unexpected file");
  });
});
