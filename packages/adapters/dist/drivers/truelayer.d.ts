/**
 * TrueLayer Connector Driver
 *
 * Bank aggregation for EU/UK (PSD2)
 * Supports OAuth2 flow
 */
import { ConnectorDriver, ConnectorMetadata, AuthUrlOptions, AuthCallbackResult, TestConnectionOptions, TestConnectionResult, SyncOptions, SyncResult, NormalizedAccount, NormalizedTransaction, NormalizedBalance } from "../connector-driver";
export declare class TrueLayerDriver implements ConnectorDriver {
    readonly metadata: ConnectorMetadata;
    private getApiUrl;
    getAuthUrl(options: AuthUrlOptions): Promise<string>;
    handleCallback(code: string, _state: string, options: AuthUrlOptions): Promise<AuthCallbackResult>;
    refreshToken(refreshToken: string, config?: Record<string, unknown>): Promise<AuthCallbackResult>;
    revoke(accessToken: string, config?: Record<string, unknown>): Promise<void>;
    testConnection(options: TestConnectionOptions): Promise<TestConnectionResult>;
    sync(credentials: Record<string, unknown>, options: SyncOptions): Promise<SyncResult & {
        accounts?: NormalizedAccount[];
        transactions?: NormalizedTransaction[];
        balances?: NormalizedBalance[];
        rawPayloads?: Array<{
            type: string;
            payload: unknown;
        }>;
    }>;
    handleWebhook(_payload: {
        eventId: string;
        eventType: string;
        payload: unknown;
        signature?: string;
    }, _credentials: Record<string, unknown>): Promise<{
        accounts?: NormalizedAccount[];
        transactions?: NormalizedTransaction[];
        balances?: NormalizedBalance[];
    }>;
}
//# sourceMappingURL=truelayer.d.ts.map