/**
 * Usage Insights Service
 * 
 * Analyzes usage patterns and provides insights for UI emphasis,
 * error prevention, and product improvements.
 */

import { prisma } from '@/shared/db/prismaClient';

export interface UsageInsight {
  type: 'feature_popularity' | 'common_error' | 'dropoff_point' | 'success_pattern';
  feature?: string;
  error?: string;
  dropoffPoint?: string;
  pattern?: string;
  frequency: number;
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
}

export interface UIEmphasis {
  feature: string;
  emphasis: 'highlight' | 'promote' | 'normal' | 'hide';
  reason: string;
}

/**
 * Analyze usage patterns and generate insights
 */
export async function analyzeUsageInsights(
  userId: string,
  days: number = 30
): Promise<UsageInsight[]> {
  const insights: UsageInsight[] = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  try {
    // Analyze feature popularity
    // Using AuditLog instead of activityLog (which doesn't exist in schema)
    const featureUsage = await prisma.auditLog.groupBy({
      by: ['resourceType'],
      where: {
        userId,
        createdAt: { gte: startDate },
        resourceType: { in: ['reconciliation', 'receipt', 'feature_flag', 'api_key'] },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    });

    featureUsage.forEach((usage: { resourceType: string | null; _count: { id: number } }) => {
      insights.push({
        type: 'feature_popularity',
        feature: usage.resourceType || 'unknown',
        frequency: usage._count.id,
        recommendation: `Feature "${usage.resourceType}" is frequently used. Consider highlighting it in the UI.`,
        priority: usage._count.id > 50 ? 'high' : usage._count.id > 20 ? 'medium' : 'low',
      });
    });

    // Analyze common errors
    const errors = await prisma.auditLog.findMany({
      where: {
        userId,
        createdAt: { gte: startDate },
        action: 'error',
      },
      select: {
        resourceType: true,
        metadata: true,
      },
    });

    const errorCounts = new Map<string, number>();
    errors.forEach((error) => {
      const errorType = error.resourceType || 'unknown';
      errorCounts.set(errorType, (errorCounts.get(errorType) || 0) + 1);
    });

    errorCounts.forEach((count, errorType) => {
      if (count >= 3) {
        insights.push({
          type: 'common_error',
          error: errorType,
          frequency: count,
          recommendation: `Error "${errorType}" occurs frequently. Consider adding proactive prevention or clearer error messages.`,
          priority: count > 10 ? 'high' : count > 5 ? 'medium' : 'low',
        });
      }
    });

    // Analyze dropoff points
    const onboardingSteps = await prisma.auditLog.findMany({
      where: {
        userId,
        createdAt: { gte: startDate },
        resourceType: 'onboarding',
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (onboardingSteps.length > 0) {
      const allSteps = ['welcome', 'create_api_key', 'try_playground', 'first_reconciliation', 'invite_team', 'complete'];
      // AuditLog uses 'action' field, not 'eventType'
      const completedSteps = onboardingSteps.map((s) => s.action).filter(Boolean) as string[];
      const incompleteSteps = allSteps.filter((step) => !completedSteps.includes(step));

      if (incompleteSteps.length > 0) {
        insights.push({
          type: 'dropoff_point',
          dropoffPoint: incompleteSteps[0],
          frequency: 1,
          recommendation: `User dropped off at "${incompleteSteps[0]}". Consider simplifying this step or adding guidance.`,
          priority: 'medium',
        });
      }
    }

    // Analyze success patterns - get from ReconResult instead
    const reconciliationResults = await prisma.reconResult.findMany({
      where: {
        reconJob: {
          userId,
          createdAt: { gte: startDate },
        },
        status: 'completed',
      },
      select: {
        summary: true,
      },
    });

    if (reconciliationResults.length > 0) {
      const highAccuracyCount = reconciliationResults.filter((r) => {
        const summary = r.summary as Record<string, unknown> | null;
        const accuracy = summary?.accuracy ? Number(summary.accuracy) : 0;
        return accuracy >= 95;
      }).length;

      if (highAccuracyCount / reconciliationResults.length > 0.8) {
        insights.push({
          type: 'success_pattern',
          pattern: 'high_accuracy_reconciliations',
          frequency: highAccuracyCount,
          recommendation: 'User consistently achieves high accuracy. Consider highlighting this success pattern.',
          priority: 'low',
        });
      }
    }
  } catch (error) {
    console.error('[Usage Insights] Error analyzing insights:', error);
  }

  return insights;
}

/**
 * Generate UI emphasis recommendations based on usage insights
 */
export async function generateUIEmphasis(
  userId: string,
  days: number = 30
): Promise<UIEmphasis[]> {
  const insights = await analyzeUsageInsights(userId, days);
  const emphasis: UIEmphasis[] = [];

  // Feature popularity insights → UI emphasis
  const popularFeatures = insights
    .filter((i: any) => i.type === 'feature_popularity')
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 3);

  popularFeatures.forEach((insight) => {
    if (insight.feature) {
      emphasis.push({
        feature: insight.feature,
        emphasis: insight.priority === 'high' ? 'highlight' : 'promote',
        reason: `Frequently used (${insight.frequency} times in last ${days} days)`,
      });
    }
  });

  // Common errors → Hide or de-emphasize problematic features
  const commonErrors = insights.filter((i: any) => i.type === 'common_error' && i.priority === 'high');
  commonErrors.forEach((insight) => {
    if (insight.error) {
      emphasis.push({
        feature: insight.error,
        emphasis: 'hide',
        reason: `Frequent errors (${insight.frequency} times). Consider hiding or fixing.`,
      });
    }
  });

  return emphasis;
}
