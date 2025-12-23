/**
 * Audit Logger
 * 
 * Comprehensive audit logging for all sensitive operations.
 * Provides compliance-ready audit trail.
 */

import { prisma } from '@/shared/db/prismaClient';
import { headers } from 'next/headers';

export type AuditAction = 
  | 'create'
  | 'update'
  | 'delete'
  | 'read'
  | 'execute'
  | 'login'
  | 'logout'
  | 'export'
  | 'import'
  | 'approve'
  | 'reject'
  | 'review'
  | 'match'
  | 'notify';

export type AuditResourceType =
  | 'api_key'
  | 'receipt'
  | 'feature_flag'
  | 'reconciliation'
  | 'reconciliation_job'
  | 'reconciliation_match'
  | 'billing_account'
  | 'subscription'
  | 'user'
  | 'tenant'
  | 'webhook'
  | 'integration';

export interface AuditLogEntry {
  userId?: string;
  billingAccountId?: string;
  tenantId?: string;
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId?: string;
  changes?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };
  metadata?: Record<string, unknown>;
}

/**
 * Get client IP and user agent from request headers
 */
async function getRequestMetadata(): Promise<{ ipAddress?: string; userAgent?: string }> {
  try {
    const headersList = await headers();
    const ipAddress = 
      headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      headersList.get('x-real-ip') ||
      undefined;
    const userAgent = headersList.get('user-agent') || undefined;
    
    return { ipAddress, userAgent };
  } catch (error) {
    // Headers not available (e.g., in background job)
    return {};
  }
}

/**
 * Log an audit event
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    const { ipAddress, userAgent } = await getRequestMetadata();

    await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        billingAccountId: entry.billingAccountId,
        tenantId: entry.tenantId,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        changes: entry.changes ? (entry.changes as never) : undefined,
        ipAddress,
        userAgent,
        metadata: (entry.metadata || {}) as never,
      },
    });
  } catch (error) {
    // Don't block operations if audit logging fails
    console.error('[Audit Logger] Error logging audit event:', error);
  }
}

/**
 * Query audit logs
 */
export async function queryAuditLogs(options: {
  userId?: string;
  billingAccountId?: string;
  tenantId?: string;
  resourceType?: AuditResourceType;
  action?: AuditAction;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  try {
    const {
      userId,
      billingAccountId,
      tenantId,
      resourceType,
      action,
      startDate,
      endDate,
      limit = 100,
      offset = 0,
    } = options;

    const where: Record<string, unknown> = {};
    
    if (userId) where.userId = userId;
    if (billingAccountId) where.billingAccountId = billingAccountId;
    if (tenantId) where.tenantId = tenantId;
    if (resourceType) where.resourceType = resourceType;
    if (action) where.action = action;
    if (startDate || endDate) {
      where.createdAt = {
        ...(startDate ? { gte: startDate } : {}),
        ...(endDate ? { lte: endDate } : {}),
      };
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      total,
      limit,
      offset,
    };
  } catch (error) {
    console.error('[Audit Logger] Error querying audit logs:', error);
    return {
      logs: [],
      total: 0,
      limit: options.limit || 100,
      offset: options.offset || 0,
    };
  }
}

/**
 * Helper: Log API key creation
 */
export async function logApiKeyCreated(
  userId: string,
  billingAccountId: string,
  apiKeyId: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await logAuditEvent({
    userId,
    billingAccountId,
    action: 'create',
    resourceType: 'api_key',
    resourceId: apiKeyId,
    metadata,
  });
}

/**
 * Helper: Log API key revocation
 */
export async function logApiKeyRevoked(
  userId: string,
  billingAccountId: string,
  apiKeyId: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await logAuditEvent({
    userId,
    billingAccountId,
    action: 'delete',
    resourceType: 'api_key',
    resourceId: apiKeyId,
    metadata,
  });
}

/**
 * Helper: Log receipt parsing
 */
export async function logReceiptParsed(
  userId: string,
  billingAccountId: string,
  receiptId: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await logAuditEvent({
    userId,
    billingAccountId,
    action: 'create',
    resourceType: 'receipt',
    resourceId: receiptId,
    metadata,
  });
}

/**
 * Helper: Log feature flag update
 */
export async function logFeatureFlagUpdated(
  userId: string,
  billingAccountId: string,
  flagId: string,
  changes: { before?: Record<string, unknown>; after?: Record<string, unknown> },
  metadata?: Record<string, unknown>
): Promise<void> {
  await logAuditEvent({
    userId,
    billingAccountId,
    action: 'update',
    resourceType: 'feature_flag',
    resourceId: flagId,
    changes,
    metadata,
  });
}

/**
 * Helper: Log reconciliation job execution
 */
export async function logReconciliationExecuted(
  userId: string,
  billingAccountId: string,
  tenantId: string,
  jobId: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await logAuditEvent({
    userId,
    billingAccountId,
    tenantId,
    action: 'execute',
    resourceType: 'reconciliation',
    resourceId: jobId,
    metadata,
  });
}
