/**
 * Alerting System
 * 
 * Provides alerting for critical system events and anomalies.
 */

import { performHealthCheck } from './health-check';
import { getApiCallStats } from '@/domain/console/api-logs';

export interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  resolved?: boolean;
  metadata?: Record<string, unknown>;
}

const alerts: Map<string, Alert> = new Map();

/**
 * Check for system health alerts
 */
export async function checkHealthAlerts(): Promise<Alert[]> {
  const health = await performHealthCheck();
  const newAlerts: Alert[] = [];
  
  for (const check of health.checks) {
    if (check.status === 'unhealthy') {
      const alertId = `health-${check.service}`;
      
      if (!alerts.has(alertId)) {
        const alert: Alert = {
          id: alertId,
          severity: 'critical',
          title: `${check.service} is unhealthy`,
          message: check.error || 'Service is not responding',
          timestamp: new Date(),
          metadata: {
            service: check.service,
            latency: check.latency,
            error: check.error,
          },
        };
        
        alerts.set(alertId, alert);
        newAlerts.push(alert);
      }
    } else if (check.status === 'degraded') {
      const alertId = `health-${check.service}`;
      
      if (!alerts.has(alertId)) {
        const alert: Alert = {
          id: alertId,
          severity: 'warning',
          title: `${check.service} is degraded`,
          message: `Service is responding slowly (${check.latency}ms)`,
          timestamp: new Date(),
          metadata: {
            service: check.service,
            latency: check.latency,
          },
        };
        
        alerts.set(alertId, alert);
        newAlerts.push(alert);
      }
    } else {
      // Service is healthy, resolve any existing alerts
      const alertId = `health-${check.service}`;
      const existingAlert = alerts.get(alertId);
      if (existingAlert && !existingAlert.resolved) {
        existingAlert.resolved = true;
      }
    }
  }
  
  return newAlerts;
}

/**
 * Check for high error rate alerts
 */
export async function checkErrorRateAlerts(tenantId?: string): Promise<Alert[]> {
  try {
    const stats = await getApiCallStats({ tenantId });
    const newAlerts: Alert[] = [];
    
    // Alert if error rate is above 10%
    if (stats.errorRate > 0.1) {
      const alertId = `error-rate-${tenantId || 'global'}`;
      
      if (!alerts.has(alertId)) {
        const alert: Alert = {
          id: alertId,
          severity: stats.errorRate > 0.25 ? 'critical' : 'warning',
          title: `High error rate detected`,
          message: `Error rate is ${(stats.errorRate * 100).toFixed(1)}% (threshold: 10%)`,
          timestamp: new Date(),
          metadata: {
            tenantId,
            errorRate: stats.errorRate,
            totalCalls: stats.totalCalls,
          },
        };
        
        alerts.set(alertId, alert);
        newAlerts.push(alert);
      }
    } else {
      // Error rate is normal, resolve any existing alerts
      const alertId = `error-rate-${tenantId || 'global'}`;
      const existingAlert = alerts.get(alertId);
      if (existingAlert && !existingAlert.resolved) {
        existingAlert.resolved = true;
      }
    }
    
    return newAlerts;
  } catch (error) {
    console.error('[alerts] Failed to check error rate:', error);
    return [];
  }
}

/**
 * Check for slow response time alerts
 */
export async function checkPerformanceAlerts(tenantId?: string): Promise<Alert[]> {
  try {
    const stats = await getApiCallStats({ tenantId });
    const newAlerts: Alert[] = [];
    
    // Alert if average response time is above 1 second
    if (stats.averageResponseTime > 1000) {
      const alertId = `performance-${tenantId || 'global'}`;
      
      if (!alerts.has(alertId)) {
        const alert: Alert = {
          id: alertId,
          severity: stats.averageResponseTime > 2000 ? 'critical' : 'warning',
          title: `Slow response times detected`,
          message: `Average response time is ${Math.round(stats.averageResponseTime)}ms (threshold: 1000ms)`,
          timestamp: new Date(),
          metadata: {
            tenantId,
            averageResponseTime: stats.averageResponseTime,
            totalCalls: stats.totalCalls,
          },
        };
        
        alerts.set(alertId, alert);
        newAlerts.push(alert);
      }
    } else {
      // Performance is normal, resolve any existing alerts
      const alertId = `performance-${tenantId || 'global'}`;
      const existingAlert = alerts.get(alertId);
      if (existingAlert && !existingAlert.resolved) {
        existingAlert.resolved = true;
      }
    }
    
    return newAlerts;
  } catch (error) {
    console.error('[alerts] Failed to check performance:', error);
    return [];
  }
}

/**
 * Run all alert checks
 */
export async function runAllAlertChecks(tenantId?: string): Promise<Alert[]> {
  const allAlerts: Alert[] = [];
  
  // Check health
  const healthAlerts = await checkHealthAlerts();
  allAlerts.push(...healthAlerts);
  
  // Check error rates
  const errorAlerts = await checkErrorRateAlerts(tenantId);
  allAlerts.push(...errorAlerts);
  
  // Check performance
  const performanceAlerts = await checkPerformanceAlerts(tenantId);
  allAlerts.push(...performanceAlerts);
  
  return allAlerts;
}

/**
 * Get active alerts
 */
export function getActiveAlerts(): Alert[] {
  return Array.from(alerts.values()).filter(alert => !alert.resolved);
}

/**
 * Resolve alert
 */
export function resolveAlert(alertId: string): void {
  const alert = alerts.get(alertId);
  if (alert) {
    alert.resolved = true;
  }
}

/**
 * Clear resolved alerts older than 24 hours
 */
export function clearOldAlerts(): void {
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  
  for (const [id, alert] of alerts.entries()) {
    if (alert.resolved && alert.timestamp.getTime() < oneDayAgo) {
      alerts.delete(id);
    }
  }
}
