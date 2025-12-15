/**
 * Error Monitoring & Alerting
 * 
 * Proactive error detection and notification system.
 */

import { prisma } from '@/shared/db/prismaClient';
import { createClient } from '@/lib/supabase/server';

export interface ErrorAlert {
  id: string;
  type: 'error_rate' | 'error_spike' | 'service_down' | 'limit_exceeded';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: Record<string, unknown>;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

export interface AlertConfig {
  errorRateThreshold: number; // 0.01 = 1%
  errorSpikeMultiplier: number; // 2x = double
  checkIntervalMinutes: number; // 5 minutes
  enabled: boolean;
}

const DEFAULT_CONFIG: AlertConfig = {
  errorRateThreshold: 0.05, // 5%
  errorSpikeMultiplier: 2.0,
  checkIntervalMinutes: 5,
  enabled: true,
};

/**
 * Check for error rate violations
 */
export async function checkErrorRate(
  billingAccountId: string,
  config: AlertConfig = DEFAULT_CONFIG
): Promise<ErrorAlert | null> {
  if (!config.enabled) return null;

  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const now = new Date();

    const events = await prisma.usageEvent.findMany({
      where: {
        billingAccountId,
        timestamp: { gte: oneHourAgo, lte: now },
      },
    });

    if (events.length === 0) return null;

    let totalCalls = 0;
    let errorCount = 0;

    for (const event of events) {
      const quantity = Number(event.quantity) || 1;
      totalCalls += quantity;
      if (event.metadata && typeof event.metadata === 'object' && 'error' in event.metadata) {
        errorCount += quantity;
      }
    }

    const errorRate = totalCalls > 0 ? errorCount / totalCalls : 0;

    if (errorRate > config.errorRateThreshold) {
      return {
        id: `error-rate-${billingAccountId}-${Date.now()}`,
        type: 'error_rate',
        severity: errorRate > 0.2 ? 'critical' : errorRate > 0.1 ? 'high' : 'medium',
        message: `Error rate is ${(errorRate * 100).toFixed(2)}%, exceeding threshold of ${(config.errorRateThreshold * 100).toFixed(2)}%`,
        details: {
          errorRate,
          threshold: config.errorRateThreshold,
          totalCalls,
          errorCount,
          period: { start: oneHourAgo, end: now },
        },
        timestamp: new Date(),
        resolved: false,
      };
    }

    return null;
  } catch (error) {
    console.error('[Error Alerts] Error checking error rate:', error);
    return null;
  }
}

/**
 * Check for error spikes
 */
export async function checkErrorSpike(
  billingAccountId: string,
  config: AlertConfig = DEFAULT_CONFIG
): Promise<ErrorAlert | null> {
  if (!config.enabled) return null;

  try {
    const now = new Date();
    const currentWindowStart = new Date(now.getTime() - config.checkIntervalMinutes * 60 * 1000);
    const previousWindowStart = new Date(currentWindowStart.getTime() - config.checkIntervalMinutes * 60 * 1000);
    const previousWindowEnd = currentWindowStart;

    // Current window errors
    const currentEvents = await prisma.usageEvent.findMany({
      where: {
        billingAccountId,
        timestamp: { gte: currentWindowStart, lte: now },
      },
    });

    // Previous window errors
    const previousEvents = await prisma.usageEvent.findMany({
      where: {
        billingAccountId,
        timestamp: { gte: previousWindowStart, lte: previousWindowEnd },
      },
    });

    let currentErrors = 0;
    let previousErrors = 0;

    for (const event of currentEvents) {
      if (event.metadata && typeof event.metadata === 'object' && 'error' in event.metadata) {
        currentErrors += Number(event.quantity) || 1;
      }
    }

    for (const event of previousEvents) {
      if (event.metadata && typeof event.metadata === 'object' && 'error' in event.metadata) {
        previousErrors += Number(event.quantity) || 1;
      }
    }

    if (previousErrors > 0 && currentErrors > previousErrors * config.errorSpikeMultiplier) {
      return {
        id: `error-spike-${billingAccountId}-${Date.now()}`,
        type: 'error_spike',
        severity: currentErrors > previousErrors * 5 ? 'critical' : 'high',
        message: `Error spike detected: ${currentErrors} errors in last ${config.checkIntervalMinutes} minutes (${previousErrors} in previous period)`,
        details: {
          currentErrors,
          previousErrors,
          multiplier: currentErrors / previousErrors,
          threshold: config.errorSpikeMultiplier,
        },
        timestamp: new Date(),
        resolved: false,
      };
    }

    return null;
  } catch (error) {
    console.error('[Error Alerts] Error checking error spike:', error);
    return null;
  }
}

/**
 * Check all alerts for a billing account
 */
export async function checkAllAlerts(
  billingAccountId: string,
  config: AlertConfig = DEFAULT_CONFIG
): Promise<ErrorAlert[]> {
  const alerts: ErrorAlert[] = [];

  const errorRateAlert = await checkErrorRate(billingAccountId, config);
  if (errorRateAlert) alerts.push(errorRateAlert);

  const errorSpikeAlert = await checkErrorSpike(billingAccountId, config);
  if (errorSpikeAlert) alerts.push(errorSpikeAlert);

  return alerts;
}

/**
 * Get active alerts for a user
 */
export async function getActiveAlerts(userId: string): Promise<ErrorAlert[]> {
  try {
    const billingAccount = await prisma.billingAccount.findFirst({
      where: { userId },
      select: { id: true },
    });

    if (!billingAccount) return [];

    return await checkAllAlerts(billingAccount.id);
  } catch (error) {
    console.error('[Error Alerts] Error getting active alerts:', error);
    return [];
  }
}
