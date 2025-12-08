import { logError, logWarn } from "./logger";

interface AlertThresholds {
  errorRate: number; // 0.01 = 1%
  errorCount: number; // 100 errors in window
  latencyP95: number; // milliseconds
  databaseConnections: number; // 0.8 = 80%
}

const defaultThresholds: AlertThresholds = {
  errorRate: 0.01,
  errorCount: 100,
  latencyP95: 1000,
  databaseConnections: 0.8,
};

interface Alert {
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}

// Simple alerting system (for MVP)
// In production, integrate with PagerDuty, Opsgenie, etc.
export class AlertManager {
  private thresholds: AlertThresholds;
  private alertHistory: Alert[] = [];
  private maxHistory = 1000;

  constructor(thresholds: Partial<AlertThresholds> = {}) {
    this.thresholds = { ...defaultThresholds, ...thresholds };
  }

  async send(alert: Alert): Promise<void> {
    // Store in history
    this.alertHistory.push({
      ...alert,
      metadata: {
        ...alert.metadata,
        timestamp: new Date().toISOString(),
      },
    });

    // Keep only recent alerts
    if (this.alertHistory.length > this.maxHistory) {
      this.alertHistory = this.alertHistory.slice(-this.maxHistory);
    }

    // Log alert
    if (alert.severity === 'critical' || alert.severity === 'high') {
      logError(`ALERT: ${alert.title}`, new Error(alert.message), alert.metadata);
    } else {
      logWarn(`ALERT: ${alert.title}`, alert.metadata);
    }

    // In production, send to alerting service
    // await sendToPagerDuty(alert);
  }

  async checkErrorRate(errorCount: number, totalRequests: number, windowMs: number): Promise<void> {
    const errorRate = totalRequests > 0 ? errorCount / totalRequests : 0;

    if (errorRate > this.thresholds.errorRate) {
      await this.send({
        severity: errorRate > 0.1 ? 'critical' : 'high',
        title: 'High error rate detected',
        message: `Error rate: ${(errorRate * 100).toFixed(2)}% (threshold: ${(this.thresholds.errorRate * 100)}%)`,
        metadata: { errorRate, errorCount, totalRequests, windowMs },
      });
    }

    if (errorCount > this.thresholds.errorCount) {
      await this.send({
        severity: 'high',
        title: 'High error count detected',
        message: `${errorCount} errors in ${windowMs}ms`,
        metadata: { errorCount, windowMs },
      });
    }
  }

  async checkLatency(p95Latency: number): Promise<void> {
    if (p95Latency > this.thresholds.latencyP95) {
      await this.send({
        severity: p95Latency > 5000 ? 'critical' : 'high',
        title: 'High latency detected',
        message: `P95 latency: ${p95Latency}ms (threshold: ${this.thresholds.latencyP95}ms)`,
        metadata: { p95Latency, threshold: this.thresholds.latencyP95 },
      });
    }
  }

  async checkDatabaseConnections(utilization: number): Promise<void> {
    if (utilization > this.thresholds.databaseConnections) {
      await this.send({
        severity: utilization > 0.95 ? 'critical' : 'high',
        title: 'High database connection pool utilization',
        message: `Pool utilization: ${(utilization * 100).toFixed(1)}%`,
        metadata: { utilization, threshold: this.thresholds.databaseConnections },
      });
    }
  }

  getRecentAlerts(limit: number = 100): Alert[] {
    return this.alertHistory.slice(-limit);
  }
}

export const alertManager = new AlertManager();
