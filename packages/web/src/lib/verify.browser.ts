import { safeJsonParse } from "@/lib/utils/safe-parse";
import type {
  EvidenceManifest,
  NamedFile,
  SmtProof,
  SmtVerificationResult,
  VerificationResult,
} from "@/types/verification";
import {
  verifyManifestNative,
  type WasmVerificationResponse,
  type WasmVerifier,
} from "./verify.shared";

let wasmModule: WasmVerifier | null = null;

export async function loadVerifier(): Promise<WasmVerifier | null> {
  if (wasmModule) return wasmModule;
  if (typeof window === "undefined") return null;

  try {
    // The generated wasm-bindgen loader is copied to public/wasm and intentionally loaded at runtime.
    const wasmLoaderUrl = "/wasm/settler_verify_wasm.js";
    const importedModule = await import(/* webpackIgnore: true */ /* @vite-ignore */ wasmLoaderUrl);
    if (typeof importedModule.default === "function") {
      await importedModule.default("/wasm/settler_verify_wasm_bg.wasm");
    }
    if (typeof importedModule.verify_manifest === "function") {
      wasmModule = importedModule as WasmVerifier;
    }
  } catch (error) {
    console.warn("[verify] browser WASM verifier unavailable; using Web Crypto fallback", error);
  }

  return wasmModule;
}

export async function verifyBundle(
  manifest: EvidenceManifest,
  files: NamedFile[]
): Promise<VerificationResult> {
  try {
    const verifier = await loadVerifier();
    if (verifier) {
      const response = safeJsonParse<WasmVerificationResponse>(
        verifier.verify_manifest(JSON.stringify(manifest), JSON.stringify(files)),
        "WASM verification response"
      );
      if (response && !response.error) {
        return { success: response.success, mismatches: response.mismatches };
      }
    }
  } catch (error) {
    console.warn("[verify] browser WASM execution failed; using Web Crypto fallback", error);
  }

  return verifyManifestNative(manifest, files);
}

export async function verifySmt(proof: SmtProof): Promise<SmtVerificationResult> {
  try {
    const verifier = await loadVerifier();
    if (verifier?.verify_smt) {
      const response = safeJsonParse<SmtVerificationResult>(
        verifier.verify_smt(JSON.stringify(proof)),
        "WASM SMT verification response"
      );
      if (response) return response;
    }
  } catch (error) {
    console.warn("[verify] browser WASM SMT verification failed", error);
  }

  return {
    valid: false,
    computed_root: "",
    expected_root: proof.root_hex,
    is_non_inclusion: !proof.value_hex,
    error: "Browser WASM SMT verifier unavailable or execution failed",
  };
}

export { sha256Hex, verifyManifestNative } from "./verify.shared";
