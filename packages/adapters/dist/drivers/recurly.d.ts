/**
 * Recurly Connector Driver
 *
 * Subscription billing engine
 * Supports API key authentication
 */
import { ConnectorDriver, ConnectorMetadata, TestConnectionOptions, TestConnectionResult, SyncOptions, SyncResult, NormalizedSubscription, NormalizedInvoice } from "../connector-driver";
export declare class RecurlyDriver implements ConnectorDriver {
    readonly metadata: ConnectorMetadata;
    private getApiUrl;
    testConnection(options: TestConnectionOptions): Promise<TestConnectionResult>;
    sync(credentials: Record<string, unknown>, options: SyncOptions): Promise<SyncResult & {
        subscriptions?: NormalizedSubscription[];
        invoices?: NormalizedInvoice[];
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
        subscriptions?: NormalizedSubscription[];
        invoices?: NormalizedInvoice[];
    }>;
}
//# sourceMappingURL=recurly.d.ts.map