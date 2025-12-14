/**
 * Data Retention Policies
 * 
 * Implements automated data retention and cleanup policies.
 */

import { prisma } from '@/shared/db/prismaClient';

export interface RetentionPolicy {
  resourceType: string;
  retentionDays: number;
  description: string;
}

const RETENTION_POLICIES: RetentionPolicy[] = [
  {
    resourceType: 'receipt',
    retentionDays: 365, // 1 year
    description: 'Receipts are retained for 1 year for compliance and audit purposes',
  },
  {
    resourceType: 'receipt_upload',
    retentionDays: 90, // 3 months
    description: 'Receipt uploads are retained for 3 months',
  },
  {
    resourceType: 'audit_log',
    retentionDays: 2555, // 7 years (compliance)
    description: 'Audit logs are retained for 7 years for compliance',
  },
  {
    resourceType: 'activity_log',
    retentionDays: 90, // 3 months
    description: 'Activity logs are retained for 3 months',
  },
  {
    resourceType: 'usage_event',
    retentionDays: 365, // 1 year
    description: 'Usage events are retained for 1 year for billing and analytics',
  },
];

/**
 * Get retention policy for a resource type
 */
export function getRetentionPolicy(resourceType: string): RetentionPolicy | null {
  return RETENTION_POLICIES.find(p => p.resourceType === resourceType) || null;
}

/**
 * Clean up expired data for a resource type
 */
export async function cleanupExpiredData(resourceType: string): Promise<number> {
  const policy = getRetentionPolicy(resourceType);
  if (!policy) {
    return 0;
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - policy.retentionDays);

  try {
    switch (resourceType) {
      case 'receipt':
        const receiptsDeleted = await prisma.receipt.deleteMany({
          where: {
            createdAt: {
              lt: cutoffDate,
            },
          },
        });
        return receiptsDeleted.count;

      case 'receipt_upload':
        const uploadsDeleted = await prisma.receiptUpload.deleteMany({
          where: {
            createdAt: {
              lt: cutoffDate,
            },
            status: 'completed', // Only delete completed uploads
          },
        });
        return uploadsDeleted.count;

      case 'audit_log':
        const auditLogsDeleted = await prisma.auditLog.deleteMany({
          where: {
            createdAt: {
              lt: cutoffDate,
            },
          },
        });
        return auditLogsDeleted.count;

      case 'activity_log':
        // Activity logs are in Supabase, would need to use Supabase client
        // For now, return 0
        return 0;

      case 'usage_event':
        // Usage events are in UsageEvent table
        const usageEventsDeleted = await prisma.usageEvent.deleteMany({
          where: {
            timestamp: {
              lt: cutoffDate,
            },
          },
        });
        return usageEventsDeleted.count;

      default:
        return 0;
    }
  } catch (error) {
    console.error(`[Data Retention] Error cleaning up ${resourceType}:`, error);
    return 0;
  }
}

/**
 * Clean up all expired data
 */
export async function cleanupAllExpiredData(): Promise<Record<string, number>> {
  const results: Record<string, number> = {};

  for (const policy of RETENTION_POLICIES) {
    const deleted = await cleanupExpiredData(policy.resourceType);
    results[policy.resourceType] = deleted;
  }

  return results;
}

/**
 * Get data retention summary
 */
export async function getRetentionSummary(): Promise<Array<{
  resourceType: string;
  retentionDays: number;
  totalRecords: number;
  expiredRecords: number;
  nextCleanup: Date;
}>> {
  const summary = [];

  for (const policy of RETENTION_POLICIES) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - policy.retentionDays);

    try {
      let totalRecords = 0;
      let expiredRecords = 0;

      switch (policy.resourceType) {
        case 'receipt':
          totalRecords = await prisma.receipt.count();
          expiredRecords = await prisma.receipt.count({
            where: {
              createdAt: {
                lt: cutoffDate,
              },
            },
          });
          break;

        case 'receipt_upload':
          totalRecords = await prisma.receiptUpload.count();
          expiredRecords = await prisma.receiptUpload.count({
            where: {
              createdAt: {
                lt: cutoffDate,
              },
            },
          });
          break;

        case 'audit_log':
          totalRecords = await prisma.auditLog.count();
          expiredRecords = await prisma.auditLog.count({
            where: {
              createdAt: {
                lt: cutoffDate,
              },
            },
          });
          break;

        case 'usage_event':
          totalRecords = await prisma.usageEvent.count();
          expiredRecords = await prisma.usageEvent.count({
            where: {
              timestamp: {
                lt: cutoffDate,
              },
            },
          });
          break;

        default:
          break;
      }

      summary.push({
        resourceType: policy.resourceType,
        retentionDays: policy.retentionDays,
        totalRecords,
        expiredRecords,
        nextCleanup: cutoffDate,
      });
    } catch (error) {
      console.error(`[Data Retention] Error getting summary for ${policy.resourceType}:`, error);
    }
  }

  return summary;
}
