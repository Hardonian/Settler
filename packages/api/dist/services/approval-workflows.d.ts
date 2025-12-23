/**
 * Approval Workflows Service
 * Handles approval requests, approver assignment, and approval processing
 */
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
export declare function createApprovalRequest(tenantId: string, requestedBy: string, requestType: string, requestDetails: Record<string, unknown>, options?: {
    reconciliationRunId?: string;
    reconJobId?: string;
    reconResultId?: string;
    approverId?: string;
    approverRole?: string;
    expiresInHours?: number;
    comments?: string;
}): Promise<string>;
/**
 * Approve a request
 */
export declare function approveRequest(tenantId: string, approvalId: string, approverId: string): Promise<void>;
/**
 * Reject a request
 */
export declare function rejectRequest(tenantId: string, approvalId: string, approverId: string, comments?: string): Promise<void>;
/**
 * Get approval request
 */
export declare function getApprovalRequest(tenantId: string, approvalId: string): Promise<ApprovalRequest | null>;
/**
 * List approval requests
 */
export declare function listApprovalRequests(tenantId: string, filters?: {
    status?: ApprovalStatus;
    approverId?: string;
    requestedBy?: string;
    limit?: number;
    offset?: number;
}): Promise<ApprovalRequest[]>;
/**
 * Add an approver
 */
export declare function addApprover(tenantId: string, userId: string, role: string, options?: {
    approvalThreshold?: number;
    canApproveFinal?: boolean;
}): Promise<string>;
//# sourceMappingURL=approval-workflows.d.ts.map