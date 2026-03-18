/**
 * Avalara Connector Driver
 *
 * Avalara tax integration
 * Supports API key authentication
 */
import { ConnectorDriver, ConnectorMetadata, TestConnectionOptions, TestConnectionResult, SyncOptions, SyncResult, NormalizedTaxEstimate } from "../connector-driver";
export declare class AvalaraDriver implements ConnectorDriver {
    readonly metadata: ConnectorMetadata;
    private getApiUrl;
    testConnection(options: TestConnectionOptions): Promise<TestConnectionResult>;
    sync(credentials: Record<string, unknown>, _options: SyncOptions): Promise<SyncResult & {
        taxEstimates?: NormalizedTaxEstimate[];
        rawPayloads?: Array<{
            type: string;
            payload: unknown;
        }>;
    }>;
}
//# sourceMappingURL=avalara.d.ts.map