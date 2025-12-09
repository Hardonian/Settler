import { Adapter, NormalizedData, FetchOptions, ValidationResult } from "./base";
/**
 * Wix Stores Adapter
 * Fetches order data from Wix Stores API
 */
export declare class WixStoresAdapter implements Adapter {
    name: string;
    version: string;
    fetch(options: FetchOptions): Promise<NormalizedData[]>;
    normalize(data: unknown): NormalizedData;
    validate(data: NormalizedData): ValidationResult;
}
//# sourceMappingURL=wix-stores.d.ts.map