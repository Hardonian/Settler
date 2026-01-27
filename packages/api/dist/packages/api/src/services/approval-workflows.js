"use strict";
/**
 * Approval Workflows Service
 * Handles approval requests, approver assignment, and approval processing
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApprovalRequest = createApprovalRequest;
exports.approveRequest = approveRequest;
exports.rejectRequest = rejectRequest;
exports.getApprovalRequest = getApprovalRequest;
exports.listApprovalRequests = listApprovalRequests;
exports.addApprover = addApprover;
const db_1 = require("../db");
const logger_1 = require("../utils/logger");
/**
 * Create an approval request
 */
async function createApprovalRequest(tenantId, requestedBy, requestType, requestDetails, options = {}) {
    try {
        let approverId = options.approverId;
        let approverRole = options.approverRole;
        // Auto-assign approver if not provided
        if (!approverId && !approverRole) {
            const approverResult = await (0, db_1.query)(`SELECT user_id, role FROM approvers
           WHERE tenant_id = $1 AND can_approve_final = true
           ORDER BY created_at ASC
           LIMIT 1`, [tenantId]);
            if (approverResult.length > 0) {
                approverId = approverResult[0]?.user_id;
                approverRole = approverResult[0]?.role;
            }
        }
        const expiresAt = options.expiresInHours
            ? new Date(Date.now() + options.expiresInHours * 60 * 60 * 1000)
            : null;
        const result = await (0, db_1.query)(`INSERT INTO approval_requests (
        tenant_id, requested_by, approver_id, approver_role,
        reconciliation_run_id, recon_job_id, recon_result_id,
        request_type, request_details, comments, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id`, [
            tenantId,
            requestedBy,
            approverId || null,
            approverRole || null,
            options.reconciliationRunId || null,
            options.reconJobId || null,
            options.reconResultId || null,
            requestType,
            JSON.stringify(requestDetails),
            options.comments || null,
            expiresAt,
        ]);
        const approvalId = result[0]?.id || '';
        (0, logger_1.logInfo)("Approval request created", {
            approvalId,
            tenantId,
            requestedBy,
            requestType,
        });
        // TODO: Send notification to approver
        return approvalId;
    }
    catch (error) {
        (0, logger_1.logError)("Failed to create approval request", error, { tenantId, requestedBy });
        throw error;
    }
}
/**
 * Approve a request
 */
async function approveRequest(tenantId, approvalId, approverId) {
    try {
        await (0, db_1.transaction)(async (client) => {
            // Verify the request exists and is pending
            const requestResult = await client.query(`SELECT id, approver_id, approver_role, status, expires_at
         FROM approval_requests
         WHERE id = $1 AND tenant_id = $2`, [approvalId, tenantId]);
            if (requestResult.rows.length === 0) {
                throw new Error("Approval request not found");
            }
            const request = requestResult.rows[0];
            if (request.status !== "pending") {
                throw new Error(`Request is not pending (status: ${request.status})`);
            }
            if (request.expires_at && new Date(request.expires_at) < new Date()) {
                throw new Error("Approval request has expired");
            }
            // Verify approver has permission
            if (request.approver_id && request.approver_id !== approverId) {
                // Check if user has the required role
                if (request.approver_role) {
                    const approverResult = await client.query(`SELECT id FROM approvers
             WHERE tenant_id = $1 AND user_id = $2 AND role = $3`, [tenantId, approverId, request.approver_role]);
                    if (approverResult.rows.length === 0) {
                        throw new Error("User does not have permission to approve this request");
                    }
                }
            }
            // Update approval request
            await client.query(`UPDATE approval_requests
         SET status = 'approved', approved_at = now()
         WHERE id = $1`, [approvalId]);
            // TODO: Trigger post-approval actions (e.g., finalize reconciliation)
        });
        (0, logger_1.logInfo)("Approval request approved", { approvalId, tenantId, approverId });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to approve request", error, { approvalId, tenantId });
        throw error;
    }
}
/**
 * Reject a request
 */
async function rejectRequest(tenantId, approvalId, approverId, comments) {
    try {
        await (0, db_1.transaction)(async (client) => {
            // Verify the request exists and is pending
            const requestResult = await client.query(`SELECT id, approver_id, approver_role, status
         FROM approval_requests
         WHERE id = $1 AND tenant_id = $2`, [approvalId, tenantId]);
            if (requestResult.rows.length === 0) {
                throw new Error("Approval request not found");
            }
            const request = requestResult.rows[0];
            if (request.status !== "pending") {
                throw new Error(`Request is not pending (status: ${request.status})`);
            }
            // Update approval request
            await client.query(`UPDATE approval_requests
         SET status = 'rejected', rejected_at = now(), comments = COALESCE($1, comments)
         WHERE id = $2`, [comments || null, approvalId]);
        });
        (0, logger_1.logInfo)("Approval request rejected", { approvalId, tenantId, approverId });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to reject request", error, { approvalId, tenantId });
        throw error;
    }
}
/**
 * Get approval request
 */
async function getApprovalRequest(tenantId, approvalId) {
    try {
        const result = await (0, db_1.query)(`SELECT id, tenant_id, requested_by, approver_id, approver_role,
              reconciliation_run_id, recon_job_id, recon_result_id,
              status, request_type, request_details, comments,
              requested_at, approved_at, rejected_at, expires_at
       FROM approval_requests
       WHERE id = $1 AND tenant_id = $2`, [approvalId, tenantId]);
        if (result.length === 0) {
            return null;
        }
        const row = result[0];
        return {
            id: row.id,
            tenantId: row.tenant_id,
            requestedBy: row.requested_by,
            approverId: row.approver_id,
            approverRole: row.approver_role,
            reconciliationRunId: row.reconciliation_run_id,
            reconJobId: row.recon_job_id,
            reconResultId: row.recon_result_id,
            status: row.status,
            requestType: row.request_type,
            requestDetails: row.request_details,
            comments: row.comments,
            requestedAt: row.requested_at,
            approvedAt: row.approved_at,
            rejectedAt: row.rejected_at,
            expiresAt: row.expires_at,
        };
    }
    catch (error) {
        (0, logger_1.logError)("Failed to get approval request", error, { approvalId, tenantId });
        throw error;
    }
}
/**
 * List approval requests
 */
async function listApprovalRequests(tenantId, filters = {}) {
    try {
        const conditions = ["tenant_id = $1"];
        const params = [tenantId];
        let paramIndex = 2;
        if (filters.status) {
            conditions.push(`status = $${paramIndex}`);
            params.push(filters.status);
            paramIndex++;
        }
        if (filters.approverId) {
            conditions.push(`approver_id = $${paramIndex}`);
            params.push(filters.approverId);
            paramIndex++;
        }
        if (filters.requestedBy) {
            conditions.push(`requested_by = $${paramIndex}`);
            params.push(filters.requestedBy);
            paramIndex++;
        }
        const limit = filters.limit || 100;
        const offset = filters.offset || 0;
        const result = await (0, db_1.query)(`SELECT id, tenant_id, requested_by, approver_id, approver_role,
              reconciliation_run_id, recon_job_id, recon_result_id,
              status, request_type, request_details, comments,
              requested_at, approved_at, rejected_at, expires_at
       FROM approval_requests
       WHERE ${conditions.join(" AND ")}
       ORDER BY requested_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`, [...params, limit, offset]);
        return result.map((row) => ({
            id: row.id,
            tenantId: row.tenant_id,
            requestedBy: row.requested_by,
            approverId: row.approver_id,
            approverRole: row.approver_role,
            reconciliationRunId: row.reconciliation_run_id,
            reconJobId: row.recon_job_id,
            reconResultId: row.recon_result_id,
            status: row.status,
            requestType: row.request_type,
            requestDetails: row.request_details,
            comments: row.comments,
            requestedAt: row.requested_at,
            approvedAt: row.approved_at,
            rejectedAt: row.rejected_at,
            expiresAt: row.expires_at,
        }));
    }
    catch (error) {
        (0, logger_1.logError)("Failed to list approval requests", error, { tenantId });
        throw error;
    }
}
/**
 * Add an approver
 */
async function addApprover(tenantId, userId, role, options = {}) {
    try {
        const result = await (0, db_1.query)(`INSERT INTO approvers (
        tenant_id, user_id, role, approval_threshold, can_approve_final
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (tenant_id, user_id, role) DO UPDATE
      SET approval_threshold = EXCLUDED.approval_threshold,
          can_approve_final = EXCLUDED.can_approve_final,
          updated_at = now()
      RETURNING id`, [
            tenantId,
            userId,
            role,
            options.approvalThreshold || null,
            options.canApproveFinal ?? false,
        ]);
        const approverId = result[0]?.id || '';
        (0, logger_1.logInfo)("Approver added", { approverId, tenantId, userId, role });
        return approverId;
    }
    catch (error) {
        (0, logger_1.logError)("Failed to add approver", error, { tenantId, userId, role });
        throw error;
    }
}
//# sourceMappingURL=approval-workflows.js.map