export interface NodeRequirement {
  requiredVersion: string;
  requiredRange: string;
}

export function assertSupportedNodeVersion(context?: string): void;
export function formatNodeRequirement(): NodeRequirement;
export function readRequiredNodeRange(): string;
export function readRequiredNodeVersion(): string;

declare const contract: {
  assertSupportedNodeVersion: typeof assertSupportedNodeVersion;
  formatNodeRequirement: typeof formatNodeRequirement;
  readRequiredNodeRange: typeof readRequiredNodeRange;
  readRequiredNodeVersion: typeof readRequiredNodeVersion;
};

export default contract;
