import type { EvidenceManifest, NamedFile, VerificationResult } from "@/types/verification";
import { safeJsonParse } from "@/lib/utils/safe-parse";

export type WasmVerificationResponse = {
  success: boolean;
  mismatches: { path: string; expected?: string; actual?: string; reason: string }[];
  error?: string;
};

let wasmModule: { verify_manifest: (manifestJson: string, filesJson: string) => string } | null =
  null;

export async function loadVerifier(): Promise<typeof wasmModule> {
  if (wasmModule) {
    return wasmModule;
  }
  try {
    // @ts-expect-error -- WASM module is loaded dynamically at runtime from public/wasm/ and has no type definitions; module path is runtime-resolved
    const importedModule = await import(/* webpackIgnore: true */ "/wasm/settler_verify_wasm.js");
    wasmModule = importedModule as typeof wasmModule;
    return wasmModule;
  } catch (error) {
    console.warn(
      "[verify] wasm verifier unavailable, falling back to native Web Crypto verifier",
      error
    );
    return null;
  }
}

/**
 * Computes SHA-256 hex digest of given byte array using Web Crypto API with Node.js crypto fallback.
 */
export async function sha256Hex(bytes: Uint8Array | number[]): Promise<string> {
  const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (typeof globalThis.crypto?.subtle?.digest === "function") {
    const hashBuffer = await globalThis.crypto.subtle.digest(
      "SHA-256",
      data as unknown as BufferSource
    );
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  const { createHash } = await import("crypto");
  return createHash("sha256").update(data).digest("hex");
}

/**
 * Native, zero-dependency browser and Node.js proofpack verifier.
 * Enforces identical verification semantics to settler-kernel Rust crate.
 */
export async function verifyManifestNative(
  manifest: EvidenceManifest,
  files: NamedFile[]
): Promise<VerificationResult> {
  const mismatches: VerificationResult["mismatches"] = [];
  const fileMap = new Map<string, string>();

  for (const file of files) {
    const hash = await sha256Hex(file.bytes);
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

  mismatches.sort((a, b) => {
    const p = a.path.localeCompare(b.path);
    return p !== 0 ? p : a.reason.localeCompare(b.reason);
  });

  return {
    success: mismatches.length === 0,
    mismatches,
  };
}

export async function verifyBundle(
  manifest: EvidenceManifest,
  files: NamedFile[]
): Promise<VerificationResult | null> {
  // 1. Attempt to use WASM module if available and functioning
  try {
    const wasmModuleInstance = await loadVerifier();
    if (wasmModuleInstance && typeof wasmModuleInstance.verify_manifest === "function") {
      const responseJson = wasmModuleInstance.verify_manifest(
        JSON.stringify(manifest),
        JSON.stringify(files)
      );
      const response = safeJsonParse<WasmVerificationResponse>(
        responseJson,
        "WASM verification response"
      );
      if (response && !response.error) {
        return {
          success: response.success,
          mismatches: response.mismatches,
        };
      }
    }
  } catch (error) {
    console.warn("[verify] WASM execution failed, falling back to native verifier", error);
  }

  // 2. Fall back to deterministic Web Crypto native verifier (zero-server-compute, offline-ready)
  return verifyManifestNative(manifest, files);
}
