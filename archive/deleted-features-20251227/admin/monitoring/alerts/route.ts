/**
 * Admin Reliability Alerts API Route
 * 
 * Returns active reliability alerts based on thresholds.
 */

import { NextRequest, NextResponse } from 'next/server';
import { isSuperAdmin } from '@/lib/auth/super-admin';
import { getOperationStats, getAdapterErrorRates } from '@/lib/monitoring/reliability-metrics';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export interface ReliabilityAlert {
  severity: 'high' | 'medium' | 'low';
  type: 'high_error_rate' | 'dead_letter_jobs' | 'adapter_error_rate' | 'stuck_jobs' | 'quota_exhaustion';
  operation?: string;
  adapter?: string;
  count?: number;
  successRate?: number;
  errorRate?: number;
  message: string;
  timestamp: string;
}

const ALERT_THRESHOLDS = {
  errorRate: {
    warning: 0.98,  // 98% success rate
    critical: 0.95, // 95% success rate
  },
  deadLetterJobs: {
    warning: 1,     // 1 dead-letter job
    critical: 10,   // 10 dead-letter jobs
  },
  adapterErrorRate: {
    warning: 0.05,  // 5% error rate
    critical: 0.10, // 10% error rate
  },
  stuckJobs: {
    warning: 3,     // 3 stuck jobs
    critical: 5,    // 5 stuck jobs
  },
};

async function checkStuckJobs(): Promise<number> {
  try {
    const supabase = await createClient();
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    
    const { count } = await supabase
      .from('jobs' as any)
      .select('*', { count: 'exact', head: true })
      .eq('status', 'running')
      .lt('updated_at', tenMinutesAgo);
    
    return count || 0;
  } catch {
    return 0;
  }
}

export async function GET(_request: NextRequest) {
  try {
    // CRITICAL: Require super admin access
    const adminCheck = await isSuperAdmin();
    if (!adminCheck) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const alerts: ReliabilityAlert[] = [];
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Get reliability metrics
    const criticalOperations = [
      'sync:stripe',
      'sync:shopify',
      'receipt:parse',
      'reconciliation:run',
      'export:generate',
    ];

    const operationStats = await Promise.all(
      criticalOperations.map((op) => getOperationStats(op, since))
    );

    const adapterErrorRates = await getAdapterErrorRates(since);

    // Check error rates
    for (const stats of operationStats) {
      if (!stats) continue;
      
      if (stats.successRate < ALERT_THRESHOLDS.errorRate.critical) {
        alerts.push({
          severity: 'high',
          type: 'high_error_rate',
          operation: stats.operation,
          successRate: stats.successRate,
          message: `${stats.operation} has success rate ${(stats.successRate * 100).toFixed(1)}% (critical threshold: ${(ALERT_THRESHOLDS.errorRate.critical * 100).toFixed(0)}%)`,
          timestamp: new Date().toISOString(),
        });
      } else if (stats.successRate < ALERT_THRESHOLDS.errorRate.warning) {
        alerts.push({
          severity: 'medium',
          type: 'high_error_rate',
          operation: stats.operation,
          successRate: stats.successRate,
          message: `${stats.operation} has success rate ${(stats.successRate * 100).toFixed(1)}% (warning threshold: ${(ALERT_THRESHOLDS.errorRate.warning * 100).toFixed(0)}%)`,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Check dead-letter jobs
    const supabase = await createClient();
    let deadLetterCount = 0;
    try {
      const { count } = await supabase
        .from('dead_letters' as any)
        .select('*', { count: 'exact', head: true })
        .gte('created_at', since.toISOString());
      deadLetterCount = count || 0;
    } catch {
      // Table might not exist
    }

    if (deadLetterCount >= ALERT_THRESHOLDS.deadLetterJobs.critical) {
      alerts.push({
        severity: 'high',
        type: 'dead_letter_jobs',
        count: deadLetterCount,
        message: `${deadLetterCount} dead-letter jobs require attention (critical threshold: ${ALERT_THRESHOLDS.deadLetterJobs.critical})`,
        timestamp: new Date().toISOString(),
      });
    } else if (deadLetterCount >= ALERT_THRESHOLDS.deadLetterJobs.warning) {
      alerts.push({
        severity: 'medium',
        type: 'dead_letter_jobs',
        count: deadLetterCount,
        message: `${deadLetterCount} dead-letter jobs require attention (warning threshold: ${ALERT_THRESHOLDS.deadLetterJobs.warning})`,
        timestamp: new Date().toISOString(),
      });
    }

    // Check adapter error rates
    for (const adapter of adapterErrorRates) {
      if (adapter.errorRate >= ALERT_THRESHOLDS.adapterErrorRate.critical) {
        alerts.push({
          severity: 'high',
          type: 'adapter_error_rate',
          adapter: adapter.adapterType,
          errorRate: adapter.errorRate,
          message: `${adapter.adapterType} has error rate ${(adapter.errorRate * 100).toFixed(1)}% (critical threshold: ${(ALERT_THRESHOLDS.adapterErrorRate.critical * 100).toFixed(0)}%)`,
          timestamp: new Date().toISOString(),
        });
      } else if (adapter.errorRate >= ALERT_THRESHOLDS.adapterErrorRate.warning) {
        alerts.push({
          severity: 'medium',
          type: 'adapter_error_rate',
          adapter: adapter.adapterType,
          errorRate: adapter.errorRate,
          message: `${adapter.adapterType} has error rate ${(adapter.errorRate * 100).toFixed(1)}% (warning threshold: ${(ALERT_THRESHOLDS.adapterErrorRate.warning * 100).toFixed(0)}%)`,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Check stuck jobs
    const stuckJobsCount = await checkStuckJobs();
    if (stuckJobsCount >= ALERT_THRESHOLDS.stuckJobs.critical) {
      alerts.push({
        severity: 'high',
        type: 'stuck_jobs',
        count: stuckJobsCount,
        message: `${stuckJobsCount} jobs are stuck (>10 minutes) (critical threshold: ${ALERT_THRESHOLDS.stuckJobs.critical})`,
        timestamp: new Date().toISOString(),
      });
    } else if (stuckJobsCount >= ALERT_THRESHOLDS.stuckJobs.warning) {
      alerts.push({
        severity: 'medium',
        type: 'stuck_jobs',
        count: stuckJobsCount,
        message: `${stuckJobsCount} jobs are stuck (>10 minutes) (warning threshold: ${ALERT_THRESHOLDS.stuckJobs.warning})`,
        timestamp: new Date().toISOString(),
      });
    }

    const criticalCount = alerts.filter(a => a.severity === 'high').length;
    const mediumCount = alerts.filter(a => a.severity === 'medium').length;

    return NextResponse.json({
      alerts,
      summary: {
        total: alerts.length,
        critical: criticalCount,
        medium: mediumCount,
        low: alerts.length - criticalCount - mediumCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Reliability Alerts] Error:', error);
    return NextResponse.json({
      alerts: [],
      summary: {
        total: 0,
        critical: 0,
        medium: 0,
        low: 0,
      },
      error: 'Failed to fetch alerts',
      timestamp: new Date().toISOString(),
    }, { status: 200 });
  }
}
