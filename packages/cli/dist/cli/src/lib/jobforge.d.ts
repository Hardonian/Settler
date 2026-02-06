import { JobForgeClient } from '@jobforge/sdk-ts';
export interface JobForgeConfig {
    enabled: boolean;
    bundleExecutionEnabled: boolean;
}
export declare function getJobForgeConfig(): JobForgeConfig;
export declare function requireJobForgeClient(): JobForgeClient;
export declare function parseJsonOption(value?: string): Record<string, unknown>;
//# sourceMappingURL=jobforge.d.ts.map