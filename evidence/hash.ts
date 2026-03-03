import {
  createRunSignature,
  sha256,
  stableStringify,
} from "../scripts/reconciliation-control-plane.mjs";

export { sha256, stableStringify };

export function computeRunFingerprint(
  inputHash: string,
  configHash: string,
  outputHash: string
): string {
  return createRunSignature({
    inputDataHash: inputHash,
    specHash: configHash,
    outputHash,
  }).run_signature;
}

export function buildHashChain(parts: string[]): string[] {
  const chain: string[] = [];
  for (const part of parts) {
    const previous = chain.at(-1) ?? "genesis";
    chain.push(sha256(`${previous}:${part}`));
  }
  return chain;
}
