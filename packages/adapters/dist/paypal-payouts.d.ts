import { Adapter, NormalizedData, FetchOptions, ValidationResult } from "./base";
/**
 * PayPal Payouts Adapter
 * Fetches payout data from PayPal Payouts API
 */
export declare class PayPalPayoutsAdapter implements Adapter {
    name: string;
    version: string;
    fetch(options: FetchOptions): Promise<NormalizedData[]>;
    getAccessToken(_clientId: string, _clientSecret: string): Promise<string>;
    normalize(data: unknown): NormalizedData;
    validate(data: NormalizedData): ValidationResult;
}
//# sourceMappingURL=paypal-payouts.d.ts.map