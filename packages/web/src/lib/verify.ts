import type { EvidenceManifest, NamedFile, VerificationResult } from "@/types/verification";

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
    const importedModule = await import(/* webpackIgnore: true */ "/wasm/settler_verify_wasm.js");
    wasmModule = importedModule as typeof wasmModule;
    return wasmModule;
  } catch (error) {
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
  const response = JSON.parse(responseJson) as WasmVerificationResponse;

  if (response.error) {
    throw new Error(response.error);
  }

  return {
    success: response.success,
    mismatches: response.mismatches,
  };
}
