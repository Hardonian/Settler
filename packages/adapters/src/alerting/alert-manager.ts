/**
 * Alert Manager
 * 
 * Manages alerts for sync failures and other critical events
 */

import { createClient } from '@supabase/supabase-js';

export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface Alert {
  id: string;
  connectorId: string;
  tenantId: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  errorType?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface AlertRule {
  id: string;
  connectorId?: string; // undefined = applies to all connectors
  condition: 'consecutive_failures' | 'error_rate' | 'sync_delay' | 'rate_limit';
  threshold: number;
  severity: AlertSeverity;
  enabled: boolean;
}

export class AlertManager {
  private supabase: ReturnType<typeof createClient>;
  private rules: AlertRule[] = [];

  constructor(supabaseUrl: string, supabaseServiceKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
    this.loadDefaultRules();
  }

  /**
   * Load default alert rules
   */
  private loadDefaultRules(): void {
    this.rules = [
      {
        id: 'consecutive_failures_5',
        condition: 'consecutive_failures',
        threshold: 5,
        severity: 'warning',
        enabled: true,
      },
      {
        id: 'consecutive_failures_10',
        condition: 'consecutive_failures',
        threshold: 10,
        severity: 'critical',
        enabled: true,
      },
      {
        id: 'error_rate_10',
        condition: 'error_rate',
        threshold: 10, // 10% error rate
        severity: 'warning',
        enabled: true,
      },
      {
        id: 'sync_delay_24h',
        condition: 'sync_delay',
        threshold: 24 * 60 * 60 * 1000, // 24 hours in ms
        severity: 'warning',
        enabled: true,
      },
      {
        id: 'rate_limit_hit',
        condition: 'rate_limit',
        threshold: 1,
        severity: 'info',
        enabled: true,
      },
    ];
  }

  /**
   * Check alerts after sync failure
   */
  async checkSyncFailure(
    connectorId: string,
    tenantId: string,
    consecutiveFailures: number,
    errorType: string,
    errorMessage: string
  ): Promise<Alert[]> {
    const alerts: Alert[] = [];

    // Check consecutive failures rule
    const consecutiveRule = this.rules.find(
      (r) => r.condition === 'consecutive_failures' && consecutiveFailures >= r.threshold
    );

    if (consecutiveRule) {
      const alert = await this.createAlert({
        connectorId,
        tenantId,
        severity: consecutiveRule.severity,
        title: `Sync Failed ${consecutiveFailures} Times`,
        message: `Connector ${connectorId} has failed ${consecutiveFailures} consecutive syncs. Last error: ${errorMessage}`,
        errorType,
        metadata: {
          consecutive_failures: consecutiveFailures,
          threshold: consecutiveRule.threshold,
        },
      });

      if (alert) alerts.push(alert);
    }

    return alerts;
  }

  /**
   * Check error rate alerts
   */
  async checkErrorRate(
    connectorId: string,
    tenantId: string,
    errorRate: number
  ): Promise<Alert[]> {
    const alerts: Alert[] = [];

    const errorRateRule = this.rules.find(
      (r) => r.condition === 'error_rate' && errorRate >= r.threshold
    );

    if (errorRateRule) {
      const alert = await this.createAlert({
        connectorId,
        tenantId,
        severity: errorRateRule.severity,
        title: `High Error Rate: ${errorRate}%`,
        message: `Connector ${connectorId} has an error rate of ${errorRate}%`,
        metadata: {
          error_rate: errorRate,
          threshold: errorRateRule.threshold,
        },
      });

      if (alert) alerts.push(alert);
    }

    return alerts;
  }

  /**
   * Check sync delay alerts
   */
  async checkSyncDelay(
    connectorId: string,
    tenantId: string,
    lastSyncAt: Date | null
  ): Promise<Alert[]> {
    const alerts: Alert[] = [];

    if (!lastSyncAt) {
      return alerts;
    }

    const delay = Date.now() - lastSyncAt.getTime();
    const delayRule = this.rules.find(
      (r) => r.condition === 'sync_delay' && delay >= r.threshold
    );

    if (delayRule) {
      const hoursDelayed = Math.round(delay / (60 * 60 * 1000));
      const alert = await this.createAlert({
        connectorId,
        tenantId,
        severity: delayRule.severity,
        title: `Sync Delayed: ${hoursDelayed} Hours`,
        message: `Connector ${connectorId} last synced ${hoursDelayed} hours ago`,
        metadata: {
          delay_ms: delay,
          delay_hours: hoursDelayed,
          threshold: delayRule.threshold,
        },
      });

      if (alert) alerts.push(alert);
    }

    return alerts;
  }

  /**
   * Create alert
   */
  private async createAlert(data: {
    connectorId: string;
    tenantId: string;
    severity: AlertSeverity;
    title: string;
    message: string;
    errorType?: string;
    metadata?: Record<string, unknown>;
  }): Promise<Alert | null> {
    try {
      // Check if alert already exists (deduplication)
      const { data: existing } = await this.supabase
        .from('connector_alerts')
        .select('id')
        .eq('connector_id', data.connectorId)
        .eq('tenant_id', data.tenantId)
        .eq('severity', data.severity)
        .is('resolved_at', null)
        .eq('title', data.title)
        .limit(1);

      if (existing && existing.length > 0) {
        return null; // Alert already exists
      }

      // Get connector record
      const { data: connector } = await this.supabase
        .from('connectors')
        .select('id')
        .eq('provider_id', data.connectorId)
        .eq('tenant_id', data.tenantId)
        .single();

      if (!connector) {
        return null;
      }

      // Create alert
      const { data: alert, error } = await this.supabase
        .from('connector_alerts')
        .insert({
          connector_id: (connector as { id: string }).id,
          tenant_id: data.tenantId,
          severity: data.severity,
          title: data.title,
          message: data.message,
          error_type: data.errorType,
          metadata: data.metadata || {},
        } as never)
        .select()
        .single();

      if (error || !alert) {
        console.error('Failed to create alert:', error);
        return null;
      }

      // Send notification (email, Slack, etc.)
      await this.sendNotification(alert as Alert);

      return alert as Alert;
    } catch (error) {
      console.error('Error creating alert:', error);
      return null;
    }
  }

  /**
   * Send notification
   */
  private async sendNotification(alert: Alert): Promise<void> {
    // TODO: Integrate with notification service (email, Slack, PagerDuty, etc.)
    console.log(`Alert: [${alert.severity.toUpperCase()}] ${alert.title} - ${alert.message}`);
    
    // Example: Send to webhook
    const webhookUrl = process.env.ALERT_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            severity: alert.severity,
            title: alert.title,
            message: alert.message,
            connector_id: alert.connectorId,
            tenant_id: alert.tenantId,
            metadata: alert.metadata,
          }),
        });
      } catch (error) {
        console.error('Failed to send webhook notification:', error);
      }
    }
  }

  /**
   * Resolve alert
   */
  async resolveAlert(alertId: string, resolvedBy: string): Promise<void> {
    await this.supabase
      .from('connector_alerts')
      .update({
        resolved_at: new Date().toISOString(),
        resolved_by: resolvedBy,
      } as never)
      .eq('id', alertId);
  }

  /**
   * Get active alerts for connector
   */
  async getActiveAlerts(connectorId: string, tenantId: string): Promise<Alert[]> {
    const { data: connector } = await this.supabase
      .from('connectors')
      .select('id')
      .eq('provider_id', connectorId)
      .eq('tenant_id', tenantId)
      .single();

    if (!connector) {
      return [];
    }

    const { data: alerts } = await this.supabase
      .from('connector_alerts')
      .select('*')
      .eq('connector_id', (connector as { id: string }).id)
      .is('resolved_at', null)
      .order('created_at', { ascending: false });

    return (alerts || []) as Alert[];
  }
}
