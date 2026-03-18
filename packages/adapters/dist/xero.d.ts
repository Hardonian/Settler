/**
 * Xero Adapter
 * E6: Xero integration for accounting reconciliation
 */
import { Adapter, NormalizedData, FetchOptions, ValidationResult } from "./base";
export interface XeroConfig {
    clientId: string;
    clientSecret: string;
    tenantId: string;
    accessToken?: string;
    refreshToken?: string;
}
export declare class XeroAdapter implements Adapter {
    name: string;
    version: string;
    private config;
    private baseUrl;
    constructor(config: XeroConfig);
    fetch(options: FetchOptions): Promise<NormalizedData[]>;
    normalize(transaction: unknown): NormalizedData;
    validate(data: NormalizedData): ValidationResult;
    private getAccessToken;
    refreshAccessToken(): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    syncTransaction(transaction: NormalizedData): Promise<void>;
}
//# sourceMappingURL=xero.d.ts.map