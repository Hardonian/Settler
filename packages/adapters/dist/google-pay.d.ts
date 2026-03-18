import { Adapter, NormalizedData, FetchOptions, ValidationResult } from "./base";
/**
 * Google Pay Adapter
 * Fetches payment data from Google Pay API
 */
export declare class GooglePayAdapter implements Adapter {
    name: string;
    version: string;
    fetch(options: FetchOptions): Promise<NormalizedData[]>;
    normalize(data: unknown): NormalizedData;
    validate(data: NormalizedData): ValidationResult;
}
//# sourceMappingURL=google-pay.d.ts.map