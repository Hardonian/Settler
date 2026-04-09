/**
 * Approval Workflows Service
 * Handles approval requests, approver assignment, and approval processing
 */

import { query, transaction } from "../db";
import { logError, logInfo } from "../utils/logger";

export type ApprovalStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface ApprovalRequest {
  id: string;
  tenantId: string;
  requestedBy: string;
  approverId?: string;
  approverRole?: string;
  reconciliationRunId?: string;
  reconJobId?: string;
  reconResultId?: string;
  status: ApprovalStatus;
  requestType: string;
  requestDetails: Record<string, unknown>;
  comments?: string;
  requestedAt: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  expiresAt?: Date;
}

export interface Approver {
  id: string;
  tenantId: string;
  userId: string;
  role: string;
  approvalThreshold?: number;
  canApproveFinal: boolean;
}

/**
 * Create an approval request
 */
export async function createApprovalRequest(
  tenantId: string,
  requestedBy: string,
  requestType: string,
  requestDetails: Record<string, unknown>,
  options: {
    reconciliationRunId?: string;
    reconJobId?: string;
    reconResultId?: string;
    approverId?: string;
    approverRole?: string;
    expiresInHours?: number;
    comments?: string;
  } = {}
): Promise<string> {
  try {
    let approverId = options.approverId;
    let approverRole = options.approverRole;

    // Auto-assign approver if not provided
    if (!approverId && !approverRole) {
      const approverResult = await query<{ user_id: string; role: string }>(
        `SELECT user_id, role FROM approvers
           WHERE tenant_id = $1 AND can_approve_final = true
           ORDER BY created_at ASC
           LIMIT 1`,
        [tenantId]
      );

      if (approverResult.length > 0) {
        approverId = approverResult[0]?.user_id;
        approverRole = approverResult[0]?.role;
      }
    }

    const expiresAt = options.expiresInHours
      ? new Date(Date.now() + options.expiresInHours * 60 * 60 * 1000)
      : null;

    const result = await query<{ id: string }>(
      `INSERT INTO approval_requests (
        tenant_id, requested_by, approver_id, approver_role,
        reconciliation_run_id, recon_job_id, recon_result_id,
        request_type, request_details, comments, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id`,
      [
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
      ] as (string | number | boolean | null | Date)[]
    );

    const approvalId = result[0]?.id || "";

    logInfo("Approval request created", {
      approvalId,
      tenantId,
      requestedBy,
      requestType,
    });

    // Send notification: email, Slack, or webhook

    return approvalId;
  } catch (error) {
    logError("Failed to create approval request", error, { tenantId, requestedBy });
    throw error;
  }
}

/**
 * Approve a request
 */
export async function approveRequest(
  tenantId: string,
  approvalId: string,
  approverId: string
): Promise<void> {
  try {
    await transaction(async (client) => {
      // Verify the request exists and is pending
      const requestResult = await client.query(
        `SELECT id, requested_by, approver_id, approver_role, status, expires_at
         FROM approval_requests
         WHERE id = $1 AND tenant_id = $2`,
        [approvalId, tenantId]
      );

      if (requestResult.rows.length === 0) {
        throw new Error("Approval request not found");
      }

      const request = requestResult.rows[0] as {
        requested_by?: string;
        approver_id?: string;
        approver_role?: string;
        status: string;
        expires_at?: Date;
      };

      if (request.status !== "pending") {
        throw new Error(`Request is not pending (status: ${request.status})`);
      }

      if (request.expires_at && new Date(request.expires_at) < new Date()) {
        throw new Error("Approval request has expired");
      }

      if (request.requested_by === approverId) {
        throw new Error("separation_of_duties_violation: requester cannot approve own request");
      }

      if (request.approver_id && request.approver_id !== approverId) {
        throw new Error("User does not have permission to approve this request");
      }

      if (request.approver_role) {
        const approverResult = await client.query(
          `SELECT id FROM approvers
             WHERE tenant_id = $1 AND user_id = $2 AND role = $3`,
          [tenantId, approverId, request.approver_role]
        );

        if (approverResult.rows.length === 0) {
          throw new Error("User does not have permission to approve this request");
        }
      }

      // Update approval request
      await client.query(
        `UPDATE approval_requests
         SET status = 'approved', approved_at = now()
         WHERE id = $1`,
        [approvalId]
      );

      // Trigger post-approval: finalize recon, update status
    });

    logInfo("Approval request approved", { approvalId, tenantId, approverId });
  } catch (error) {
    logError("Failed to approve request", error, { approvalId, tenantId });
    throw error;
  }
}

/**
 * Reject a request
 */
export async function rejectRequest(
  tenantId: string,
  approvalId: string,
  approverId: string,
  comments?: string
): Promise<void> {
  try {
    await transaction(async (client) => {
      // Verify the request exists and is pending
      const requestResult = await client.query(
        `SELECT id, requested_by, approver_id, approver_role, status, expires_at
         FROM approval_requests
         WHERE id = $1 AND tenant_id = $2`,
        [approvalId, tenantId]
      );

      if (requestResult.rows.length === 0) {
        throw new Error("Approval request not found");
      }

      const request = requestResult.rows[0] as {
        requested_by?: string;
        approver_id?: string;
        approver_role?: string;
        status: string;
        expires_at?: Date;
      };

      if (request.status !== "pending") {
        throw new Error(`Request is not pending (status: ${request.status})`);
      }

      if (request.expires_at && new Date(request.expires_at) < new Date()) {
        throw new Error("Approval request has expired");
      }

      if (request.requested_by === approverId) {
        throw new Error("separation_of_duties_violation: requester cannot reject own request");
      }

      if (request.approver_id && request.approver_id !== approverId) {
        throw new Error("User does not have permission to reject this request");
      }

      if (request.approver_role) {
        const approverResult = await client.query(
          `SELECT id FROM approvers
             WHERE tenant_id = $1 AND user_id = $2 AND role = $3`,
          [tenantId, approverId, request.approver_role]
        );

        if (approverResult.rows.length === 0) {
          throw new Error("User does not have permission to reject this request");
        }
      }

      // Update approval request
      await client.query(
        `UPDATE approval_requests
         SET status = 'rejected', rejected_at = now(), comments = COALESCE($1, comments)
         WHERE id = $2`,
        [comments || null, approvalId]
      );
    });

    logInfo("Approval request rejected", { approvalId, tenantId, approverId });
  } catch (error) {
    logError("Failed to reject request", error, { approvalId, tenantId });
    throw error;
  }
}

/**
 * Get approval request
 */
export async function getApprovalRequest(
  tenantId: string,
  approvalId: string
): Promise<ApprovalRequest | null> {
  try {
    const result = await query<Record<string, unknown>>(
      `SELECT id, tenant_id, requested_by, approver_id, approver_role,
              reconciliation_run_id, recon_job_id, recon_result_id,
              status, request_type, request_details, comments,
              requested_at, approved_at, rejected_at, expires_at
       FROM approval_requests
       WHERE id = $1 AND tenant_id = $2`,
      [approvalId, tenantId]
    );

    if (result.length === 0) {
      return null;
    }

    const row = result[0]!;
    return {
      id: row.id as string,
      tenantId: row.tenant_id as string,
      requestedBy: row.requested_by as string,
      approverId: row.approver_id as string | undefined,
      approverRole: row.approver_role as string | undefined,
      reconciliationRunId: row.reconciliation_run_id as string | undefined,
      reconJobId: row.recon_job_id as string | undefined,
      reconResultId: row.recon_result_id as string | undefined,
      status: row.status as ApprovalStatus,
      requestType: row.request_type as string,
      requestDetails: row.request_details as Record<string, unknown>,
      comments: row.comments as string | undefined,
      requestedAt: row.requested_at as Date,
      approvedAt: row.approved_at as Date | undefined,
      rejectedAt: row.rejected_at as Date | undefined,
      expiresAt: row.expires_at as Date | undefined,
    };
  } catch (error) {
    logError("Failed to get approval request", error, { approvalId, tenantId });
    throw error;
  }
}

/**
 * List approval requests
 */
export async function listApprovalRequests(
  tenantId: string,
  filters: {
    status?: ApprovalStatus;
    approverId?: string;
    requestedBy?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<ApprovalRequest[]> {
  try {
    const conditions: string[] = ["tenant_id = $1"];
    const params: unknown[] = [tenantId];
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

    const result = await query<Record<string, unknown>>(
      `SELECT id, tenant_id, requested_by, approver_id, approver_role,
              reconciliation_run_id, recon_job_id, recon_result_id,
              status, request_type, request_details, comments,
              requested_at, approved_at, rejected_at, expires_at
       FROM approval_requests
       WHERE ${conditions.join(" AND ")}
       ORDER BY requested_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset] as (string | number | boolean | null | Date)[]
    );

    return result.map((row) => ({
      id: row.id as string,
      tenantId: row.tenant_id as string,
      requestedBy: row.requested_by as string,
      approverId: row.approver_id as string | undefined,
      approverRole: row.approver_role as string | undefined,
      reconciliationRunId: row.reconciliation_run_id as string | undefined,
      reconJobId: row.recon_job_id as string | undefined,
      reconResultId: row.recon_result_id as string | undefined,
      status: row.status as ApprovalStatus,
      requestType: row.request_type as string,
      requestDetails: row.request_details as Record<string, unknown>,
      comments: row.comments as string | undefined,
      requestedAt: row.requested_at as Date,
      approvedAt: row.approved_at as Date | undefined,
      rejectedAt: row.rejected_at as Date | undefined,
      expiresAt: row.expires_at as Date | undefined,
    }));
  } catch (error) {
    logError("Failed to list approval requests", error, { tenantId });
    throw error;
  }
}

/**
 * Add an approver
 */
export async function addApprover(
  tenantId: string,
  userId: string,
  role: string,
  options: {
    approvalThreshold?: number;
    canApproveFinal?: boolean;
  } = {}
): Promise<string> {
  try {
    const result = await query<{ id: string }>(
      `INSERT INTO approvers (
        tenant_id, user_id, role, approval_threshold, can_approve_final
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (tenant_id, user_id, role) DO UPDATE
      SET approval_threshold = EXCLUDED.approval_threshold,
          can_approve_final = EXCLUDED.can_approve_final,
          updated_at = now()
      RETURNING id`,
      [
        tenantId,
        userId,
        role,
        options.approvalThreshold || null,
        options.canApproveFinal ?? false,
      ] as (string | number | boolean | null | Date)[]
    );

    const approverId = result[0]?.id || "";
    logInfo("Approver added", { approverId, tenantId, userId, role });
    return approverId;
  } catch (error) {
    logError("Failed to add approver", error, { tenantId, userId, role });
    throw error;
  }
}
