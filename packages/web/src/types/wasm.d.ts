/**
 * Type declarations for WASM modules
 */

declare module "*/wasm/settler_verify_wasm.js" {
  export function verify_manifest(manifestJson: string, filesJson: string): string;
  const _default: { verify_manifest: typeof verify_manifest };
  export default _default;
}
