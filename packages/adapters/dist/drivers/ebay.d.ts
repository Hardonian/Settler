/**
 * eBay Connector Driver
 *
 * eBay marketplace integration
 * Supports OAuth2 flow
 */
import { ConnectorDriver, ConnectorMetadata, AuthUrlOptions, AuthCallbackResult, TestConnectionOptions, TestConnectionResult, SyncOptions, SyncResult, NormalizedPayout, NormalizedTransaction } from "../connector-driver";
export declare class EbayDriver implements ConnectorDriver {
    readonly metadata: ConnectorMetadata;
    private getApiUrl;
    getAuthUrl(options: AuthUrlOptions): Promise<string>;
    handleCallback(code: string, _state: string, options: AuthUrlOptions): Promise<AuthCallbackResult>;
    refreshToken(refreshToken: string, config?: Record<string, unknown>): Promise<AuthCallbackResult>;
    revoke(_accessToken: string, _config?: Record<string, unknown>): Promise<void>;
    testConnection(options: TestConnectionOptions): Promise<TestConnectionResult>;
    sync(credentials: Record<string, unknown>, _options: SyncOptions): Promise<SyncResult & {
        payouts?: NormalizedPayout[];
        transactions?: NormalizedTransaction[];
        rawPayloads?: Array<{
            type: string;
            payload: unknown;
        }>;
    }>;
}
//# sourceMappingURL=ebay.d.ts.map