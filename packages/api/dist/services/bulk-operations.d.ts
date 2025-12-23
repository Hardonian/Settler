/**
 * Bulk Operations Service
 * Handles bulk operations on transactions, matches, etc.
 */
export type BulkOperationType = "approve" | "reject" | "export" | "correct" | "link_receipts";
export interface BulkOperationResult {
    id: string;
    status: string;
    itemsProcessed: number;
    totalItems: number;
    succeededCount: number;
    failedCount: number;
    errorDetails: Array<{
        itemId: string;
        error: string;
    }>;
}
/**
 * Create a bulk operation
 */
export declare function createBulkOperation(tenantId: string, userId: string, operationType: BulkOperationType, targetType: string, targetIds: string[], operationConfig?: Record<string, unknown>): Promise<string>;
/**
 * Execute bulk operation
 */
export declare function executeBulkOperation(tenantId: string, operationId: string): Promise<BulkOperationResult>;
/**
 * Get bulk operation status
 */
export declare function getBulkOperationStatus(tenantId: string, operationId: string): Promise<BulkOperationResult | null>;
//# sourceMappingURL=bulk-operations.d.ts.map