/**
 * Milestone Tracker
 * 
 * Tracks user milestones and triggers celebrations when milestones are reached.
 */

import { prisma } from '@/shared/db/prismaClient';
import { MilestoneType } from '@/components/milestones/MilestoneCelebration';

export interface MilestoneEvent {
  userId: string;
  milestone: MilestoneType;
  metadata?: Record<string, unknown>;
}

/**
 * Check if a milestone should be celebrated
 */
export async function shouldCelebrateMilestone(
  userId: string,
  milestone: MilestoneType
): Promise<boolean> {
  try {
<<<<<<< HEAD
    // Check if milestone was already dismissed (using metadata in audit log)
    const dismissed = await prisma.auditLog.findFirst({
      where: {
        userId,
        resourceType: 'milestone',
        action: 'dismiss',
        metadata: {
          path: ['milestone'],
          equals: milestone,
        },
      },
    });

    if (dismissed) {
      return false;
    }

    // Check if milestone was already celebrated
=======
    // Check if milestone was already dismissed (using localStorage since userPreference doesn't exist)
    // Note: This is a client-side check, server-side would need different approach
    if (typeof window !== 'undefined') {
      const dismissed = localStorage.getItem(`milestone_dismissed_${milestone}`);
      if (dismissed === 'true') {
        return false;
      }
    }

    // Check if milestone was already celebrated (using AuditLog instead of activityLog)
>>>>>>> origin/main
    const celebrated = await prisma.auditLog.findFirst({
      where: {
        userId,
        resourceType: 'milestone',
<<<<<<< HEAD
        action: 'celebrate',
        metadata: {
          path: ['milestone'],
          equals: milestone,
        },
=======
        action: milestone,
>>>>>>> origin/main
      },
    });

    return !celebrated;
  } catch (error) {
    console.error('[Milestone Tracker] Error checking milestone:', error);
    return false;
  }
}

/**
 * Record a milestone event
 */
export async function recordMilestone(event: MilestoneEvent): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: event.userId,
        resourceType: 'milestone',
<<<<<<< HEAD
        action: 'celebrate',
        metadata: {
          milestone: event.milestone,
          ...event.metadata,
        },
=======
        action: event.milestone,
        changes: event.metadata || {},
>>>>>>> origin/main
      },
    });
  } catch (error) {
    console.error('[Milestone Tracker] Error recording milestone:', error);
    // Don't throw - milestone tracking is non-critical
  }
}

/**
 * Check and trigger milestone celebrations based on user activity
 */
export async function checkMilestones(userId: string): Promise<MilestoneType[]> {
  const milestones: MilestoneType[] = [];

  try {
<<<<<<< HEAD
    // Check API keys count (API keys model doesn't exist yet, skip for now)
    // TODO: Implement when API keys model is added
    // const apiKeyCount = await prisma.apiKey.count({
    //   where: {
    //     userId,
    //     revokedAt: null,
    //   },
    // });
=======
    // Check API keys count (apiKey model doesn't exist in schema - using AuditLog as proxy)
    const apiKeyCount = await prisma.auditLog.count({
      where: {
        userId,
        resourceType: 'api_key',
        action: 'create',
      },
    });

    if (apiKeyCount === 1) {
      const shouldCelebrate = await shouldCelebrateMilestone(userId, 'first_api_key');
      if (shouldCelebrate) {
        milestones.push('first_api_key');
        await recordMilestone({ userId, milestone: 'first_api_key' });
      }
    }
>>>>>>> origin/main

    // Check reconciliation count
    const reconciliationCount = await prisma.reconJob.count({
      where: {
        userId,
        status: 'active', // Using 'active' instead of 'completed' as status values may differ
      },
    });

    if (reconciliationCount === 1) {
      const shouldCelebrate = await shouldCelebrateMilestone(userId, 'first_reconciliation');
      if (shouldCelebrate) {
        milestones.push('first_reconciliation');
        await recordMilestone({ userId, milestone: 'first_reconciliation' });
      }
    } else if (reconciliationCount === 10) {
      const shouldCelebrate = await shouldCelebrateMilestone(userId, 'ten_reconciliations');
      if (shouldCelebrate) {
        milestones.push('ten_reconciliations');
        await recordMilestone({ userId, milestone: 'ten_reconciliations' });
      }
    } else if (reconciliationCount === 100) {
      const shouldCelebrate = await shouldCelebrateMilestone(userId, 'hundred_reconciliations');
      if (shouldCelebrate) {
        milestones.push('hundred_reconciliations');
        await recordMilestone({ userId, milestone: 'hundred_reconciliations' });
      }
    }

<<<<<<< HEAD
    // Check receipts count (Receipt doesn't have userId, check via ReceiptUpload)
    const receiptCount = await prisma.receiptUpload.count({
      where: {
        // ReceiptUpload doesn't have userId either, skip for now
        // TODO: Add userId to ReceiptUpload or link via billingAccountId
=======
    // Check receipts count (Receipt doesn't have userId - using AuditLog as proxy)
    const receiptCount = await prisma.auditLog.count({
      where: {
        userId,
        resourceType: 'receipt',
        action: 'create',
>>>>>>> origin/main
      },
    });

    if (receiptCount === 1) {
      const shouldCelebrate = await shouldCelebrateMilestone(userId, 'first_receipt_parsed');
      if (shouldCelebrate) {
        milestones.push('first_receipt_parsed');
        await recordMilestone({ userId, milestone: 'first_receipt_parsed' });
      }
    }

<<<<<<< HEAD
    // Check feature flags count (FeatureFlag doesn't have userId, uses billingAccountId)
    // TODO: Get billingAccountId from userId first
    const flagCount = 0; // Placeholder until we can link userId to billingAccountId
=======
    // Check feature flags count (FeatureFlag doesn't have userId - using AuditLog as proxy)
    const flagCount = await prisma.auditLog.count({
      where: {
        userId,
        resourceType: 'feature_flag',
        action: 'create',
      },
    });
>>>>>>> origin/main

    if (flagCount === 1) {
      const shouldCelebrate = await shouldCelebrateMilestone(userId, 'first_feature_flag');
      if (shouldCelebrate) {
        milestones.push('first_feature_flag');
        await recordMilestone({ userId, milestone: 'first_feature_flag' });
      }
    }
  } catch (error) {
    console.error('[Milestone Tracker] Error checking milestones:', error);
  }

  return milestones;
}
