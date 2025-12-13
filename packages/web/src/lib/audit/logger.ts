/**
 * Audit Logging Service
 * 
 * Provides structured audit logging for security and compliance.
 * All sensitive operations are logged here.
 */

import { prisma } from '@/shared/db/prismaClient';

export interface AuditLogEntry {
  tenantId?: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  changes?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Create audit log entry
 * Non-blocking - failures don't throw errors
 */
export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    await prisma.reconAudit.create({
      data: {
        tenantId: entry.tenantId || '00000000-0000-0000-0000-000000000000',
        userId: entry.userId || null,
        auditType: 'audit',
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId || null,
        changes: JSON.parse(JSON.stringify(entry.changes || {})),
        ipAddress: entry.ipAddress || null,
        userAgent: entry.userAgent || null,
        metadata: JSON.parse(JSON.stringify(entry.metadata || {})),
      },
    });
  } catch (error) {
    // Don't throw - audit logging is non-critical
    console.warn('[Audit] Failed to create audit log:', error);
  }
}

/**
 * Audit log for authentication events
 */
export async function auditAuth(
  action: 'login' | 'logout' | 'signup' | 'password_reset',
  userId: string,
  ipAddress?: string,
  userAgent?: string,
  success = true
): Promise<void> {
  await createAuditLog({
    userId,
    action: `auth.${action}`,
    entityType: 'user',
    entityId: userId,
    changes: { success },
    ipAddress,
    userAgent,
  });
}

/**
 * Audit log for billing events
 */
export async function auditBilling(
  action: string,
  billingAccountId: string,
  userId: string,
  changes?: Record<string, unknown>
): Promise<void> {
  await createAuditLog({
    userId,
    action: `billing.${action}`,
    entityType: 'billing_account',
    entityId: billingAccountId,
    changes,
  });
}

/**
 * Audit log for API key events
 */
export async function auditApiKey(
  action: 'create' | 'delete' | 'update',
  apiKeyId: string,
  userId: string,
  changes?: Record<string, unknown>
): Promise<void> {
  await createAuditLog({
    userId,
    action: `api_key.${action}`,
    entityType: 'api_key',
    entityId: apiKeyId,
    changes,
  });
}

/**
 * Audit log for admin actions
 */
export async function auditAdmin(
  action: string,
  adminUserId: string,
  targetEntityType: string,
  targetEntityId: string,
  changes?: Record<string, unknown>
): Promise<void> {
  await createAuditLog({
    userId: adminUserId,
    action: `admin.${action}`,
    entityType: targetEntityType,
    entityId: targetEntityId,
    changes,
    metadata: { adminAction: true },
  });
}
