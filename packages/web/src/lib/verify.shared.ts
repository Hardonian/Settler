import type { EvidenceManifest, NamedFile, VerificationResult } from "@/types/verification";

export type WasmVerificationResponse = {
  success: boolean;
  mismatches: { path: string; expected?: string; actual?: string; reason: string }[];
  error?: string;
};

export type WasmVerifier = {
  verify_manifest: (manifestJson: string, filesJson: string) => string;
  verify_smt?: (proofJson: string) => string;
};

export type Sha256Hex = (bytes: Uint8Array | number[]) => Promise<string>;

export async function sha256Hex(bytes: Uint8Array | number[]): Promise<string> {
  const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (typeof globalThis.crypto?.subtle?.digest !== "function") {
    throw new Error("Web Crypto SHA-256 is unavailable in this runtime");
  }

  const hashBuffer = await globalThis.crypto.subtle.digest(
    "SHA-256",
    data as unknown as BufferSource
  );
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyManifestWithHasher(
  manifest: EvidenceManifest,
  files: NamedFile[],
  hashBytes: Sha256Hex
): Promise<VerificationResult> {
  const mismatches: VerificationResult["mismatches"] = [];
  const fileMap = new Map<string, string>();

  for (const file of files) {
    const hash = await hashBytes(file.bytes);
    fileMap.set(file.path, hash);
  }

  const supportedSchemas = ["v1", "settler.evidence-manifest/1.0.0", "settler.proofpack/1.0.0"];
  if (manifest.schema_version && !supportedSchemas.includes(manifest.schema_version)) {
    mismatches.push({
      path: "manifest.json",
      expected: "v1",
      actual: manifest.schema_version,
      reason: "Unsupported manifest schema version",
    });
  }

  const declaredPaths = new Set<string>();
  if (Array.isArray(manifest.files)) {
    for (const entry of manifest.files) {
      declaredPaths.add(entry.path);
      const actualHash = fileMap.get(entry.path);
      if (actualHash) {
        if (actualHash.toLowerCase() !== entry.sha256.toLowerCase()) {
          mismatches.push({
            path: entry.path,
            expected: entry.sha256,
            actual: actualHash,
            reason: "Hash mismatch",
          });
        }
      } else {
        mismatches.push({
          path: entry.path,
          expected: entry.sha256,
          actual: null,
          reason: "Missing file",
        });
      }
    }
  }

  for (const [path, actualHash] of fileMap.entries()) {
    if (!declaredPaths.has(path)) {
      mismatches.push({
        path,
        expected: null,
        actual: actualHash,
        reason: "Unexpected file",
      });
    }
  }

  mismatches.sort((left, right) => {
    const pathOrder = left.path.localeCompare(right.path);
    return pathOrder !== 0 ? pathOrder : left.reason.localeCompare(right.reason);
  });

  return {
    success: mismatches.length === 0,
    mismatches,
  };
}

export async function verifyManifestNative(
  manifest: EvidenceManifest,
  files: NamedFile[]
): Promise<VerificationResult> {
  return verifyManifestWithHasher(manifest, files, sha256Hex);
}
