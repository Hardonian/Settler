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
    // Check if milestone was already dismissed
    const dismissed = await prisma.userPreference.findUnique({
      where: {
        userId_key: {
          userId,
          key: `milestone_dismissed_${milestone}`,
        },
      },
    });

    if (dismissed?.value === 'true') {
      return false;
    }

    // Check if milestone was already celebrated
    const celebrated = await prisma.activityLog.findFirst({
      where: {
        userId,
        entityType: 'milestone',
        eventType: milestone,
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
    await prisma.activityLog.create({
      data: {
        userId: event.userId,
        entityType: 'milestone',
        eventType: event.milestone,
        metadata: event.metadata || {},
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
    // Check API keys count
    const apiKeyCount = await prisma.apiKey.count({
      where: {
        userId,
        revokedAt: null,
      },
    });

    if (apiKeyCount === 1) {
      const shouldCelebrate = await shouldCelebrateMilestone(userId, 'first_api_key');
      if (shouldCelebrate) {
        milestones.push('first_api_key');
        await recordMilestone({ userId, milestone: 'first_api_key' });
      }
    }

    // Check reconciliation count
    const reconciliationCount = await prisma.reconciliationJob.count({
      where: {
        userId,
        status: 'completed',
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

    // Check receipts count
    const receiptCount = await prisma.receipt.count({
      where: {
        userId,
      },
    });

    if (receiptCount === 1) {
      const shouldCelebrate = await shouldCelebrateMilestone(userId, 'first_receipt_parsed');
      if (shouldCelebrate) {
        milestones.push('first_receipt_parsed');
        await recordMilestone({ userId, milestone: 'first_receipt_parsed' });
      }
    }

    // Check feature flags count
    const flagCount = await prisma.featureFlag.count({
      where: {
        userId,
      },
    });

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
