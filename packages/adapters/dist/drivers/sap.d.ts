/**
 * SAP Connector Driver
 *
 * SAP ERP integration
 * Supports generic OData endpoint configuration
 */
import { ConnectorDriver, ConnectorMetadata, TestConnectionOptions, TestConnectionResult, SyncOptions, SyncResult, NormalizedInvoice, NormalizedTransaction } from "../connector-driver";
export declare class SapDriver implements ConnectorDriver {
    readonly metadata: ConnectorMetadata;
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
//# sourceMappingURL=sap.d.ts.map