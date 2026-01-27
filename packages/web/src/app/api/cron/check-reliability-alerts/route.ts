/**
 * Cron Job: Check Reliability Alerts
 * 
 * Periodically checks for reliability issues and sends alerts.
 * Should be called every 5 minutes via Vercel Cron or similar.
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendAlert, shouldSendAlert } from '@/lib/alerts/reliability-alerts';
import { appLogger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch alerts from the alerts endpoint
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    
    const alertsResponse = await fetch(`${baseUrl}/api/admin/monitoring/alerts`, {
      headers: {
        // Note: This cron job needs to authenticate as super admin
        // In production, you might want to use a service account token
        // For now, we'll rely on the endpoint's internal auth check
      },
    });

    if (!alertsResponse.ok) {
      appLogger.error('[Cron Alerts] Failed to fetch alerts', new Error(`Status: ${alertsResponse.status}`));
      return NextResponse.json({ 
        error: 'Failed to fetch alerts',
        checked: false,
      }, { status: 200 }); // Don't fail the cron job
    }

    const { alerts, summary } = await alertsResponse.json();

    if (summary.critical > 0) {
      // Send critical alerts
      const criticalAlerts = alerts.filter((a: { severity: string }) => a.severity === 'high');
      
      for (const alert of criticalAlerts) {
        const alertKey = `${alert.type}:${alert.operation || alert.adapter || 'general'}`;
        
        if (shouldSendAlert(alertKey, 15)) {
          await sendAlert({
            severity: 'high',
            type: alert.type,
            message: alert.message,
            details: alert,
          });
        }
      }
    }

    // Send medium severity alerts to Slack only (not PagerDuty)
    const mediumAlerts = alerts.filter((a: { severity: string }) => a.severity === 'medium');
    if (mediumAlerts.length > 0) {
      for (const alert of mediumAlerts) {
        const alertKey = `${alert.type}:${alert.operation || alert.adapter || 'general'}`;
        
        if (shouldSendAlert(alertKey, 30)) {
          // Only send to Slack for medium alerts
          const { sendSlackAlert } = await import('@/lib/alerts/reliability-alerts');
          await sendSlackAlert({
            severity: 'medium',
            type: alert.type,
            message: alert.message,
            details: alert,
          });
        }
      }
    }

    return NextResponse.json({
      checked: true,
      alertsFound: alerts.length,
      alertsSent: summary.critical + mediumAlerts.length,
      summary,
      timestamp: new Date().toISOString(),
    });
  } catch {
    appLogger.error('[Cron Alerts] Error', error);
    // Don't fail the cron job - return success but log error
    return NextResponse.json({
      checked: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 200 });
  }
}
