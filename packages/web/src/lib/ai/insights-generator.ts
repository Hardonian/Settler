/**
 * AI-Powered Insights Generator
 * 
 * Generates actionable insights from usage data:
 * - Cost optimization recommendations
 * - Performance improvements
 * - Usage patterns
 * - Anomaly detection
 */

import { prisma } from '@/shared/db/prismaClient';
import { getCurrentUsage } from '@/lib/usage/tracking';
import { getAccountPlanCode } from '@/domain/billing/entitlements';
import { getPlanConfig } from '@/domain/billing/planConfig';

export interface Insight {
  id: string;
  type: 'cost_optimization' | 'performance' | 'usage_pattern' | 'anomaly' | 'recommendation';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  impact: string;
  action: {
    label: string;
    url: string;
  };
  estimatedSavings?: number;
  confidence: number; // 0-1
}

/**
 * Generate cost optimization insights
 */
async function generateCostInsights(
  billingAccountId: string
): Promise<Insight[]> {
  const insights: Insight[] = [];

  try {
    const planCode = await getAccountPlanCode(billingAccountId).catch(() => 'free');
    const planConfig = getPlanConfig(planCode);

    // Check if user is on free plan but using a lot
    if (planCode === 'free') {
      const services: Array<'reconcile' | 'receipts' | 'featureFlags'> = [
        'reconcile',
        'receipts',
        'featureFlags',
      ];

      let totalUsage = 0;
      let totalLimit = 0;

      for (const service of services) {
        try {
          const usage = await getCurrentUsage(billingAccountId, service, 'monthly');
          totalUsage += usage.current;
          if (usage.limit !== -1) {
            totalLimit += usage.limit;
          }
        } catch {
          // Skip on error
        }
      }

      const usagePercent = totalLimit > 0 ? (totalUsage / totalLimit) * 100 : 0;

      if (usagePercent > 80) {
        insights.push({
          id: `cost-optimization-${billingAccountId}-upgrade`,
          type: 'cost_optimization',
          severity: 'warning',
          title: 'Consider Upgrading to Pro',
          description: `You're using ${Math.round(usagePercent)}% of your free plan limits. Upgrading to Pro would give you 100x more capacity.`,
          impact: 'Prevent service interruptions and get priority support',
          action: {
            label: 'View Plans',
            url: '/pricing',
          },
          estimatedSavings: 0, // Actually cost, but prevents downtime
          confidence: 0.9,
        });
      }
    }

    // Check for unused services
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const events = await prisma.usageEvent.findMany({
      where: {
        billingAccountId,
        timestamp: { gte: thirtyDaysAgo },
      },
      select: { eventType: true },
    });

    const serviceUsage: Record<string, number> = {};
    for (const event of events) {
      const service = event.eventType.split('-')[0] || 'unknown';
      serviceUsage[service] = (serviceUsage[service] || 0) + 1;
    }

    // If user is paying but not using much
    if (planCode !== 'free' && Object.keys(serviceUsage).length === 0) {
      insights.push({
        id: `cost-optimization-${billingAccountId}-downgrade`,
        type: 'cost_optimization',
        severity: 'info',
        title: 'Consider Downgrading',
        description: 'You haven\'t used any services in the last 30 days. Consider downgrading to save costs.',
        impact: `Save $${planConfig?.pricing?.monthly || 0}/month`,
        action: {
          label: 'View Plans',
          url: '/pricing',
        },
        estimatedSavings: planConfig?.pricing?.monthly || 0,
        confidence: 0.8,
      });
    }
  } catch (error) {
    console.error('[AI Insights] Error generating cost insights:', error);
  }

  return insights;
}

/**
 * Generate performance insights
 */
async function generatePerformanceInsights(
  billingAccountId: string
): Promise<Insight[]> {
  const insights: Insight[] = [];

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const events = await prisma.usageEvent.findMany({
      where: {
        billingAccountId,
        timestamp: { gte: thirtyDaysAgo },
      },
      select: {
        eventType: true,
        metadata: true,
        timestamp: true,
      },
    });

    // Calculate error rate
    let totalCalls = 0;
    let errorCount = 0;
    const errorRates: Record<string, { total: number; errors: number }> = {};

    for (const event of events) {
      const service = event.eventType.split('-')[0] || 'unknown';
      const quantity = 1; // Simplified
      totalCalls += quantity;

      if (event.metadata && typeof event.metadata === 'object' && 'error' in event.metadata) {
        errorCount += quantity;
        if (!errorRates[service]) {
          errorRates[service] = { total: 0, errors: 0 };
        }
        errorRates[service].errors += quantity;
      }

      if (!errorRates[service]) {
        errorRates[service] = { total: 0, errors: 0 };
      }
      errorRates[service].total += quantity;
    }

    const overallErrorRate = totalCalls > 0 ? errorCount / totalCalls : 0;

    if (overallErrorRate > 0.05) {
      insights.push({
        id: `performance-${billingAccountId}-error-rate`,
        type: 'performance',
        severity: 'warning',
        title: 'High Error Rate Detected',
        description: `Your error rate is ${(overallErrorRate * 100).toFixed(2)}%. This may indicate integration issues.`,
        impact: 'Improve reliability and reduce failed requests',
        action: {
          label: 'View Error Details',
          url: '/console/usage',
        },
        confidence: 0.85,
      });
    }

    // Check for specific service issues
    for (const [service, rates] of Object.entries(errorRates)) {
      const serviceErrorRate = rates.total > 0 ? rates.errors / rates.total : 0;
      if (serviceErrorRate > 0.1 && rates.total > 10) {
        insights.push({
          id: `performance-${billingAccountId}-${service}`,
          type: 'performance',
          severity: 'critical',
          title: `${service} Service Issues`,
          description: `${service} has a ${(serviceErrorRate * 100).toFixed(2)}% error rate. Check your integration.`,
          impact: 'Fix integration issues to improve reliability',
          action: {
            label: 'View Documentation',
            url: `/docs/${service}`,
          },
          confidence: 0.9,
        });
      }
    }
  } catch (error) {
    console.error('[AI Insights] Error generating performance insights:', error);
  }

  return insights;
}

/**
 * Generate usage pattern insights
 */
async function generateUsagePatternInsights(
  billingAccountId: string
): Promise<Insight[]> {
  const insights: Insight[] = [];

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const events = await prisma.usageEvent.findMany({
      where: {
        billingAccountId,
        timestamp: { gte: thirtyDaysAgo },
      },
      select: {
        eventType: true,
        timestamp: true,
      },
      orderBy: { timestamp: 'asc' },
    });

    // Detect usage spikes
    const dailyUsage: Record<string, number> = {};
    for (const event of events) {
      const date = event.timestamp.toISOString().split('T')[0];
      dailyUsage[date] = (dailyUsage[date] || 0) + 1;
    }

    const dailyValues = Object.values(dailyUsage);
    if (dailyValues.length > 7) {
      const avgDaily = dailyValues.reduce((a, b) => a + b, 0) / dailyValues.length;
      const maxDaily = Math.max(...dailyValues);

      if (maxDaily > avgDaily * 3) {
        insights.push({
          id: `usage-pattern-${billingAccountId}-spike`,
          type: 'usage_pattern',
          severity: 'info',
          title: 'Usage Spike Detected',
          description: `You had a usage spike of ${maxDaily} calls in a single day (${Math.round(avgDaily)} average). Consider implementing rate limiting or caching.`,
          impact: 'Optimize usage patterns to reduce costs',
          action: {
            label: 'View Usage Analytics',
            url: '/console/usage',
          },
          confidence: 0.75,
        });
      }
    }

    // Detect unused features
    const serviceUsage: Record<string, number> = {};
    for (const event of events) {
      const service = event.eventType.split('-')[0] || 'unknown';
      serviceUsage[service] = (serviceUsage[service] || 0) + 1;
    }

    const availableServices = ['reconcile', 'receipts', 'featureFlags'];
    const unusedServices = availableServices.filter(
      (s) => !serviceUsage[s] || serviceUsage[s] < 5
    );

    if (unusedServices.length > 0 && Object.keys(serviceUsage).length > 0) {
      insights.push({
        id: `usage-pattern-${billingAccountId}-unused`,
        type: 'usage_pattern',
        severity: 'info',
        title: 'Unused Features Available',
        description: `You haven't tried ${unusedServices.join(', ')} yet. These features could help automate your workflow.`,
        impact: 'Discover new capabilities to improve efficiency',
        action: {
          label: 'Explore Features',
          url: '/docs',
        },
        confidence: 0.7,
      });
    }
  } catch (error) {
    console.error('[AI Insights] Error generating usage pattern insights:', error);
  }

  return insights;
}

/**
 * Generate all insights for a billing account
 */
export async function generateAllInsights(
  billingAccountId: string
): Promise<Insight[]> {
  const [costInsights, performanceInsights, usageInsights] = await Promise.all([
    generateCostInsights(billingAccountId),
    generatePerformanceInsights(billingAccountId),
    generateUsagePatternInsights(billingAccountId),
  ]);

  return [...costInsights, ...performanceInsights, ...usageInsights].sort(
    (a, b) => {
      // Sort by severity (critical > warning > info)
      const severityOrder = { critical: 3, warning: 2, info: 1 };
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
      if (severityDiff !== 0) return severityDiff;
      
      // Then by confidence
      return b.confidence - a.confidence;
    }
  );
}

/**
 * Get insights for current user
 */
export async function getCurrentUserInsights(): Promise<Insight[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return [];

    const billingAccount = await prisma.billingAccount.findFirst({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!billingAccount) return [];

    return await generateAllInsights(billingAccount.id);
  } catch (error) {
    console.error('[AI Insights] Error getting insights:', error);
    return [];
  }
}

import { createClient } from '@/lib/supabase/server';
