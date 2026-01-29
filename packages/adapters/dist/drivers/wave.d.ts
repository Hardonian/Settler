/**
 * Wave Connector Driver
 *
 * Accounting system integration
 * Supports OAuth2 flow (if available) or manual upload
 */
import { ConnectorDriver, ConnectorMetadata, TestConnectionOptions, TestConnectionResult, SyncOptions, SyncResult, NormalizedInvoice } from "../connector-driver";
export declare class WaveDriver implements ConnectorDriver {
    readonly metadata: ConnectorMetadata;
    private readonly apiUrl;
    testConnection(options: TestConnectionOptions): Promise<TestConnectionResult>;
    sync(credentials: Record<string, unknown>, _options: SyncOptions): Promise<SyncResult & {
        invoices?: NormalizedInvoice[];
        rawPayloads?: Array<{
            type: string;
            payload: unknown;
        }>;
    }>;
}
//# sourceMappingURL=wave.d.ts.map