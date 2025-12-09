import { Adapter, NormalizedData, FetchOptions, ValidationResult } from "./base";
/**
 * Meta Commerce + Meta Ads Adapter
 * Fetches data from Facebook/Instagram Commerce and Ads APIs
 */
export declare class MetaCommerceAdapter implements Adapter {
    name: string;
    version: string;
    fetch(options: FetchOptions): Promise<NormalizedData[]>;
    normalizeCommerceOrder(data: unknown): NormalizedData;
    normalizeAdsSpend(data: unknown): NormalizedData;
    normalize(data: unknown): NormalizedData;
    validate(data: NormalizedData): ValidationResult;
}
//# sourceMappingURL=meta-commerce.d.ts.map