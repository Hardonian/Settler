/**
 * NetSuite Connector Driver
 *
 * NetSuite ERP integration
 * Supports Token-Based Authentication or OAuth 2.0
 */
import { ConnectorDriver, ConnectorMetadata, TestConnectionOptions, TestConnectionResult, SyncOptions, SyncResult, NormalizedInvoice, NormalizedTransaction } from "../connector-driver";
export declare class NetSuiteDriver implements ConnectorDriver {
    readonly metadata: ConnectorMetadata;
    private getApiUrl;
    private getAccessToken;
    testConnection(options: TestConnectionOptions): Promise<TestConnectionResult>;
    sync(credentials: Record<string, unknown>, _options: SyncOptions): Promise<SyncResult & {
        invoices?: NormalizedInvoice[];
        transactions?: NormalizedTransaction[];
        rawPayloads?: Array<{
            type: string;
            payload: unknown;
        }>;
    }>;
}
//# sourceMappingURL=netsuite.d.ts.map