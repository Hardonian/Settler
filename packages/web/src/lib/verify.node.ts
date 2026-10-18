import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { safeJsonParse } from "@/lib/utils/safe-parse";
import type {
  EvidenceManifest,
  NamedFile,
  SmtProof,
  SmtVerificationResult,
  VerificationResult,
} from "@/types/verification";
import {
  verifyManifestWithHasher,
  type WasmVerificationResponse,
  type WasmVerifier,
} from "./verify.shared";

let wasmModule: WasmVerifier | null = null;

export async function sha256Hex(bytes: Uint8Array | number[]): Promise<string> {
  const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return createHash("sha256").update(data).digest("hex");
}

export async function verifyManifestNative(
  manifest: EvidenceManifest,
  files: NamedFile[]
): Promise<VerificationResult> {
  return verifyManifestWithHasher(manifest, files, sha256Hex);
}

export async function loadVerifier(): Promise<WasmVerifier | null> {
  if (wasmModule) return wasmModule;

  const candidates = [
    path.resolve(process.cwd(), "public/wasm"),
    path.resolve(process.cwd(), "packages/web/public/wasm"),
    path.resolve(__dirname, "../../../public/wasm"),
    path.resolve(__dirname, "../../public/wasm"),
  ];
  const foundDir = candidates.find((directory) =>
    existsSync(path.join(directory, "settler_verify_wasm.js"))
  );
  if (!foundDir) return null;

  try {
    const moduleUrl = pathToFileURL(path.join(foundDir, "settler_verify_wasm.js")).href;
    const importedModule = await import(moduleUrl);
    if (typeof importedModule.initSync === "function") {
      const wasmPath = path.join(foundDir, "settler_verify_wasm_bg.wasm");
      if (existsSync(wasmPath)) {
        importedModule.initSync({ module: readFileSync(wasmPath) });
      }
    }
    if (typeof importedModule.verify_manifest === "function") {
      wasmModule = importedModule as WasmVerifier;
    }
  } catch (error) {
    console.warn("[verify] Node WASM verifier unavailable", error);
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
    console.warn("[verify] Node WASM execution failed; using Web Crypto fallback", error);
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
    console.warn("[verify] Node WASM SMT verification failed", error);
  }

  return {
    valid: false,
    computed_root: "",
    expected_root: proof.root_hex,
    is_non_inclusion: !proof.value_hex,
    error: "Node WASM SMT verifier unavailable or execution failed",
  };
}
