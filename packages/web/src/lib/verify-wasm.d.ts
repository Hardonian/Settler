// WASM module type declarations
declare module "/wasm/settler_verify_wasm.js" {
  export function verify_manifest(manifestJson: string, filesJson: string): string;
}

declare module "*?raw" {
  const content: any;
  export default content;
}
