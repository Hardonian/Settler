"use strict";
/**
 * Bulk Operations Service
 * Handles bulk operations on transactions, matches, etc.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBulkOperation = createBulkOperation;
exports.executeBulkOperation = executeBulkOperation;
exports.getBulkOperationStatus = getBulkOperationStatus;
const db_1 = require("../db");
const logger_1 = require("../utils/logger");
/**
 * Create a bulk operation
 */
async function createBulkOperation(tenantId, userId, operationType, targetType, targetIds, operationConfig = {}) {
    try {
        const result = await (0, db_1.query)(`INSERT INTO bulk_operations (
        tenant_id, user_id, operation_type, target_type,
        target_ids, operation_config, total_items, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
      RETURNING id`, [
            tenantId,
            userId,
            operationType,
            targetType,
            JSON.stringify(targetIds),
            JSON.stringify(operationConfig),
            targetIds.length,
        ]);
        const operationId = result[0]?.id || '';
        (0, logger_1.logInfo)("Bulk operation created", {
            operationId,
            tenantId,
            userId,
            operationType,
            targetType,
            itemCount: targetIds.length,
        });
        return operationId;
    }
    catch (error) {
        (0, logger_1.logError)("Failed to create bulk operation", error, { tenantId, userId, operationType });
        throw error;
    }
}
/**
 * Execute bulk operation
 */
async function executeBulkOperation(tenantId, operationId) {
    try {
        // Get operation details
        const opResult = await (0, db_1.query)(`SELECT operation_type, target_type, target_ids, operation_config, total_items
       FROM bulk_operations
       WHERE id = $1 AND tenant_id = $2`, [operationId, tenantId]);
        if (opResult.length === 0) {
            throw new Error("Bulk operation not found");
        }
        const operation = opResult[0];
        await (0, db_1.query)(`UPDATE bulk_operations
       SET status = 'running', started_at = now()
       WHERE id = $1`, [operationId]);
        let succeededCount = 0;
        let failedCount = 0;
        const errorDetails = [];
        // Execute based on operation type
        for (const itemId of operation.target_ids) {
            try {
                await executeBulkOperationItem(tenantId, operation.operation_type, operation.target_type, itemId, operation.operation_config);
                succeededCount++;
            }
            catch (error) {
                failedCount++;
                errorDetails.push({
                    itemId,
                    error: error.message,
                });
            }
        }
        const itemsProcessed = succeededCount + failedCount;
        await (0, db_1.query)(`UPDATE bulk_operations
       SET status = 'completed', completed_at = now(),
           items_processed = $1, succeeded_count = $2, failed_count = $3,
           error_details = $4, progress_percentage = 100
       WHERE id = $5`, [
            itemsProcessed,
            succeededCount,
            failedCount,
            JSON.stringify(errorDetails),
            operationId,
        ]);
        return {
            id: operationId,
            status: "completed",
            itemsProcessed,
            totalItems: operation.total_items,
            succeededCount,
            failedCount,
            errorDetails,
        };
    }
    catch (error) {
        await (0, db_1.query)(`UPDATE bulk_operations
       SET status = 'failed', completed_at = now(), error_details = $1
       WHERE id = $2`, [JSON.stringify([{ error: error.message }]), operationId]);
        (0, logger_1.logError)("Failed to execute bulk operation", error, { operationId, tenantId });
        throw error;
    }
}
/**
 * Execute a single item in a bulk operation
 */
async function executeBulkOperationItem(tenantId, operationType, targetType, itemId, config) {
    switch (operationType) {
        case "approve":
            if (targetType === "approval_request") {
                // Approve the request
                const { approveRequest } = await Promise.resolve().then(() => __importStar(require("./approval-workflows")));
                await approveRequest(tenantId, itemId, config.approverId);
            }
            break;
        case "reject":
            if (targetType === "approval_request") {
                const { rejectRequest } = await Promise.resolve().then(() => __importStar(require("./approval-workflows")));
                await rejectRequest(tenantId, itemId, config.approverId);
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
async function getBulkOperationStatus(tenantId, operationId) {
    try {
        const result = await (0, db_1.query)(`SELECT id, status, items_processed, total_items,
              succeeded_count, failed_count, error_details, progress_percentage
       FROM bulk_operations
       WHERE id = $1 AND tenant_id = $2`, [operationId, tenantId]);
        if (result.length === 0) {
            return null;
        }
        const row = result[0];
        return {
            id: row.id,
            status: row.status,
            itemsProcessed: row.items_processed,
            totalItems: row.total_items,
            succeededCount: row.succeeded_count,
            failedCount: row.failed_count,
            errorDetails: row.error_details,
        };
    }
    catch (error) {
        (0, logger_1.logError)("Failed to get bulk operation status", error, { operationId, tenantId });
        throw error;
    }
}
//# sourceMappingURL=bulk-operations.js.map