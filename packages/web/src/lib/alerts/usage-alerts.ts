/**
 * Usage Alerts
 * 
 * Proactive alerts when approaching usage limits.
 */

import { prisma } from '@/shared/db/prismaClient';
import { getCurrentUsage } from '@/lib/usage/tracking';
import { getAccountPlanCode } from '@/domain/billing/entitlements';

export interface UsageAlert {
  service: 'reconcile' | 'receipts' | 'featureFlags' | 'playground' | 'exceptions';
  current: number;
  limit: number;
  remaining: number;
  percentage: number;
  severity: 'info' | 'warning' | 'critical';
  message: string;
}

/**
 * Check usage limits and generate alerts
 */
export async function checkUsageAlerts(
  billingAccountId: string
): Promise<UsageAlert[]> {
  const alerts: UsageAlert[] = [];

  try {
    await getAccountPlanCode(billingAccountId).catch(() => 'starter');

    const services: Array<'reconcile' | 'exceptions'> = [
      'reconcile',
      'exceptions',
    ];

    for (const service of services) {
      try {
        const usage = await getCurrentUsage(billingAccountId, service, 'monthly');
        
        if (usage.limit === -1) continue; // Unlimited

        const percentage = (usage.current / usage.limit) * 100;
        const remaining = usage.remaining;

        let severity: 'info' | 'warning' | 'critical' = 'info';
        let message = '';

        if (percentage >= 100) {
          severity = 'critical';
          message = `You've reached your ${service} limit. Upgrade to continue.`;
        } else if (percentage >= 90) {
          severity = 'critical';
          message = `You're at ${Math.round(percentage)}% of your ${service} limit. Upgrade soon.`;
        } else if (percentage >= 75) {
          severity = 'warning';
          message = `You're at ${Math.round(percentage)}% of your ${service} limit.`;
        } else if (percentage >= 50) {
          severity = 'info';
          message = `You've used ${Math.round(percentage)}% of your ${service} limit.`;
        }

        if (message) {
          alerts.push({
            service,
            current: usage.current,
            limit: usage.limit,
            remaining,
            percentage,
            severity,
            message,
          });
        }
      } catch (_error) {
        console.error(`[Usage Alerts] Error checking ${service}:`, error);
      }
    }
  } catch (_error) {
    console.error('[Usage Alerts] Error:', error);
  }

  return alerts;
}

/**
 * Get usage alerts for current user
 */
export async function getCurrentUserUsageAlerts(): Promise<UsageAlert[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return [];

    const billingAccount = await prisma.billingAccount.findFirst({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!billingAccount) return [];

    return await checkUsageAlerts(billingAccount.id);
  } catch (_error) {
    console.error('[Usage Alerts] Error getting alerts:', error);
    return [];
  }
}

import { createClient } from '@/lib/supabase/server';
