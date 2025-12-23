/**
 * Plaid Connector Driver
 *
 * Bank aggregation for North America
 * Supports OAuth2 flow via Plaid Link
 */
import { ConnectorDriver, ConnectorMetadata, AuthUrlOptions, AuthCallbackResult, TestConnectionOptions, TestConnectionResult, SyncOptions, SyncResult, NormalizedAccount, NormalizedTransaction, NormalizedBalance } from '../connector-driver';
export declare class PlaidDriver implements ConnectorDriver {
    readonly metadata: ConnectorMetadata;
    private getApiUrl;
    getAuthUrl(options: AuthUrlOptions): Promise<string>;
    handleCallback(publicToken: string, _state: string, options: AuthUrlOptions): Promise<AuthCallbackResult>;
    refreshToken(_refreshToken: string, _config?: Record<string, unknown>): Promise<AuthCallbackResult>;
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
//# sourceMappingURL=plaid.d.ts.map