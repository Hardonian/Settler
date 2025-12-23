/**
 * Bulk Operations Service
 * Handles bulk operations on transactions, matches, etc.
 */

import { query, transaction } from "../db";
import { logError, logInfo } from "../utils/logger";

export type BulkOperationType =
  | "approve"
  | "reject"
  | "export"
  | "correct"
  | "link_receipts";

export interface BulkOperationResult {
  id: string;
  status: string;
  itemsProcessed: number;
  totalItems: number;
  succeededCount: number;
  failedCount: number;
  errorDetails: Array<{ itemId: string; error: string }>;
}

/**
 * Create a bulk operation
 */
export async function createBulkOperation(
  tenantId: string,
  userId: string,
  operationType: BulkOperationType,
  targetType: string,
  targetIds: string[],
  operationConfig: Record<string, unknown> = {}
): Promise<string> {
  try {
    const result = await query(
      `INSERT INTO bulk_operations (
        tenant_id, user_id, operation_type, target_type,
        target_ids, operation_config, total_items, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
      RETURNING id`,
      [
        tenantId,
        userId,
        operationType,
        targetType,
        JSON.stringify(targetIds),
        JSON.stringify(operationConfig),
        targetIds.length,
      ]
    );

    const operationId = result[0]?.id as string;
    logInfo("Bulk operation created", {
      operationId,
      tenantId,
      userId,
      operationType,
      targetType,
      itemCount: targetIds.length,
    });

    return operationId;
  } catch (error) {
    logError("Failed to create bulk operation", error, { tenantId, userId, operationType });
    throw error;
  }
}

/**
 * Execute bulk operation
 */
export async function executeBulkOperation(
  tenantId: string,
  operationId: string
): Promise<BulkOperationResult> {
  try {
    // Get operation details
    const opResult = await query(
      `SELECT operation_type, target_type, target_ids, operation_config, total_items
       FROM bulk_operations
       WHERE id = $1 AND tenant_id = $2`,
      [operationId, tenantId]
    );

    if (opResult.length === 0) {
      throw new Error("Bulk operation not found");
    }

    const operation = opResult[0] as {
      operation_type: BulkOperationType;
      target_type: string;
      target_ids: string[];
      operation_config: Record<string, unknown>;
      total_items: number;
    };

    await query(
      `UPDATE bulk_operations
       SET status = 'running', started_at = now()
       WHERE id = $1`,
      [operationId]
    );

    let succeededCount = 0;
    let failedCount = 0;
    const errorDetails: Array<{ itemId: string; error: string }> = [];

    // Execute based on operation type
    for (const itemId of operation.target_ids) {
      try {
        await executeBulkOperationItem(
          tenantId,
          operation.operation_type,
          operation.target_type,
          itemId,
          operation.operation_config
        );
        succeededCount++;
      } catch (error) {
        failedCount++;
        errorDetails.push({
          itemId,
          error: (error as Error).message,
        });
      }
    }

    const itemsProcessed = succeededCount + failedCount;

    await query(
      `UPDATE bulk_operations
       SET status = 'completed', completed_at = now(),
           items_processed = $1, succeeded_count = $2, failed_count = $3,
           error_details = $4, progress_percentage = 100
       WHERE id = $5`,
      [
        itemsProcessed,
        succeededCount,
        failedCount,
        JSON.stringify(errorDetails),
        operationId,
      ]
    );

    return {
      id: operationId,
      status: "completed",
      itemsProcessed,
      totalItems: operation.total_items,
      succeededCount,
      failedCount,
      errorDetails,
    };
  } catch (error) {
    await query(
      `UPDATE bulk_operations
       SET status = 'failed', completed_at = now(), error_details = $1
       WHERE id = $2`,
      [JSON.stringify([{ error: (error as Error).message }]), operationId]
    );

    logError("Failed to execute bulk operation", error, { operationId, tenantId });
    throw error;
  }
}

/**
 * Execute a single item in a bulk operation
 */
async function executeBulkOperationItem(
  tenantId: string,
  operationType: BulkOperationType,
  targetType: string,
  itemId: string,
  config: Record<string, unknown>
): Promise<void> {
  switch (operationType) {
    case "approve":
      if (targetType === "approval_request") {
        // Approve the request
        const { approveRequest } = await import("./approval-workflows");
        await approveRequest(tenantId, itemId, config.approverId as string);
      }
      break;

    case "reject":
      if (targetType === "approval_request") {
        const { rejectRequest } = await import("./approval-workflows");
        await rejectRequest(tenantId, itemId, config.approverId as string);
      }
      break;

    case "export":
      // Export logic would go here
      break;

    case "correct":
      // Correction logic would go here
      break;

    case "link_receipts":
      // Receipt linking logic would go here
      break;

    default:
      throw new Error(`Unknown operation type: ${operationType}`);
  }
}

/**
 * Get bulk operation status
 */
export async function getBulkOperationStatus(
  tenantId: string,
  operationId: string
): Promise<BulkOperationResult | null> {
  try {
    const result = await query(
      `SELECT id, status, items_processed, total_items,
              succeeded_count, failed_count, error_details, progress_percentage
       FROM bulk_operations
       WHERE id = $1 AND tenant_id = $2`,
      [operationId, tenantId]
    );

    if (result.length === 0) {
      return null;
    }

    const row = result[0] as {
      id: string;
      status: string;
      items_processed: number;
      total_items: number;
      succeeded_count: number;
      failed_count: number;
      error_details: Array<{ itemId: string; error: string }>;
    };

    return {
      id: row.id,
      status: row.status,
      itemsProcessed: row.items_processed,
      totalItems: row.total_items,
      succeededCount: row.succeeded_count,
      failedCount: row.failed_count,
      errorDetails: row.error_details,
    };
  } catch (error) {
    logError("Failed to get bulk operation status", error, { operationId, tenantId });
    throw error;
  }
}
