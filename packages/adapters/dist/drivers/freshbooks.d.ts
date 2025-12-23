/**
 * FreshBooks Connector Driver
 *
 * Accounting system integration
 * Supports OAuth2 flow
 */
import { ConnectorDriver, ConnectorMetadata, AuthUrlOptions, AuthCallbackResult, TestConnectionOptions, TestConnectionResult, SyncOptions, SyncResult, NormalizedInvoice } from '../connector-driver';
export declare class FreshBooksDriver implements ConnectorDriver {
    readonly metadata: ConnectorMetadata;
    private readonly apiUrl;
    getAuthUrl(options: AuthUrlOptions): Promise<string>;
    handleCallback(code: string, _state: string, options: AuthUrlOptions): Promise<AuthCallbackResult>;
    refreshToken(refreshToken: string, config?: Record<string, unknown>): Promise<AuthCallbackResult>;
    revoke(_accessToken: string, _config?: Record<string, unknown>): Promise<void>;
    testConnection(options: TestConnectionOptions): Promise<TestConnectionResult>;
    sync(credentials: Record<string, unknown>, _options: SyncOptions): Promise<SyncResult & {
        invoices?: NormalizedInvoice[];
        rawPayloads?: Array<{
            type: string;
            payload: unknown;
        }>;
    }>;
}
//# sourceMappingURL=freshbooks.d.ts.map