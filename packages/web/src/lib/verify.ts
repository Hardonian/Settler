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
  } catch (_error) {
    console.warn("[verify] wasm verifier unavailable", error);
    return null;
  }
}

export async function verifyBundle(
  manifest: EvidenceManifest,
  files: NamedFile[]
): Promise<VerificationResult | null> {
  const wasmModuleInstance = await loadVerifier();
  if (!wasmModuleInstance) {
    return null;
  }

  const responseJson = wasmModuleInstance.verify_manifest(
    JSON.stringify(manifest),
    JSON.stringify(files)
  );
  const response = safeJsonParse<WasmVerificationResponse>(responseJson, "WASM verification response");

  if (!response) {
    throw new Error("Failed to parse WASM verification response");
  }

  if (response.error) {
    throw new Error(response.error);
  }

  return {
    success: response.success,
    mismatches: response.mismatches,
  };
}
