/**
 * Stripe Connect Connector Driver
 *
 * Stripe Connect integration for connected accounts
 * Supports OAuth2 flow for connected accounts
 */
import { ConnectorDriver, ConnectorMetadata, AuthUrlOptions, AuthCallbackResult, TestConnectionOptions, TestConnectionResult, SyncOptions, SyncResult, NormalizedAccount, NormalizedPayout, NormalizedBalance } from '../connector-driver';
export declare class StripeConnectDriver implements ConnectorDriver {
    readonly metadata: ConnectorMetadata;
    getAuthUrl(options: AuthUrlOptions): Promise<string>;
    handleCallback(code: string, _state: string, options: AuthUrlOptions): Promise<AuthCallbackResult>;
    refreshToken(refreshToken: string, config?: Record<string, unknown>): Promise<AuthCallbackResult>;
    revoke(_accessToken: string, _config?: Record<string, unknown>): Promise<void>;
    testConnection(options: TestConnectionOptions): Promise<TestConnectionResult>;
    sync(credentials: Record<string, unknown>, options: SyncOptions): Promise<SyncResult & {
        accounts?: NormalizedAccount[];
        payouts?: NormalizedPayout[];
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
        payouts?: NormalizedPayout[];
        balances?: NormalizedBalance[];
    }>;
}
//# sourceMappingURL=stripe-connect.d.ts.map