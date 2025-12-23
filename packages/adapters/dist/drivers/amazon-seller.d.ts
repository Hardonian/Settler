/**
 * Amazon Seller Connector Driver
 *
 * Amazon Seller Central integration
 * Supports manual upload (CSV reports) or SP-API if credentials available
 */
import { ConnectorDriver, ConnectorMetadata, TestConnectionOptions, TestConnectionResult, SyncOptions, SyncResult, NormalizedPayout } from '../connector-driver';
export declare class AmazonSellerDriver implements ConnectorDriver {
    readonly metadata: ConnectorMetadata;
    testConnection(options: TestConnectionOptions): Promise<TestConnectionResult>;
    sync(credentials: Record<string, unknown>, _options: SyncOptions): Promise<SyncResult & {
        payouts?: NormalizedPayout[];
        rawPayloads?: Array<{
            type: string;
            payload: unknown;
        }>;
    }>;
}
//# sourceMappingURL=amazon-seller.d.ts.map