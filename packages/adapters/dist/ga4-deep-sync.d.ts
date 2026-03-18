import { Adapter, NormalizedData, FetchOptions, ValidationResult } from "./base";
/**
 * Google Analytics GA4 Deep Sync Adapter
 * Fetches e-commerce event data from GA4 API
 */
export declare class GA4DeepSyncAdapter implements Adapter {
    name: string;
    version: string;
    fetch(options: FetchOptions): Promise<NormalizedData[]>;
    getAccessToken(_credentials: string): Promise<string>;
    normalize(data: unknown): NormalizedData;
    validate(data: NormalizedData): ValidationResult;
}
//# sourceMappingURL=ga4-deep-sync.d.ts.map