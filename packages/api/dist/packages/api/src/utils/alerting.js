"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.alertManager = exports.AlertManager = void 0;
const logger_1 = require("./logger");
const defaultThresholds = {
    errorRate: 0.01,
    errorCount: 100,
    latencyP95: 1000,
    databaseConnections: 0.8,
};
// Simple alerting system (for MVP)
// In production, integrate with PagerDuty, Opsgenie, etc.
class AlertManager {
    thresholds;
    alertHistory = [];
    maxHistory = 1000;
    constructor(thresholds = {}) {
        this.thresholds = { ...defaultThresholds, ...thresholds };
    }
    async send(alert) {
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
            (0, logger_1.logError)(`ALERT: ${alert.title}`, new Error(alert.message), alert.metadata);
        }
        else {
            (0, logger_1.logWarn)(`ALERT: ${alert.title}`, alert.metadata);
        }
        // In production, send to alerting service
        // await sendToPagerDuty(alert);
    }
    async checkErrorRate(errorCount, totalRequests, windowMs) {
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
    async checkLatency(p95Latency) {
        if (p95Latency > this.thresholds.latencyP95) {
            await this.send({
                severity: p95Latency > 5000 ? 'critical' : 'high',
                title: 'High latency detected',
                message: `P95 latency: ${p95Latency}ms (threshold: ${this.thresholds.latencyP95}ms)`,
                metadata: { p95Latency, threshold: this.thresholds.latencyP95 },
            });
        }
    }
    async checkDatabaseConnections(utilization) {
        if (utilization > this.thresholds.databaseConnections) {
            await this.send({
                severity: utilization > 0.95 ? 'critical' : 'high',
                title: 'High database connection pool utilization',
                message: `Pool utilization: ${(utilization * 100).toFixed(1)}%`,
                metadata: { utilization, threshold: this.thresholds.databaseConnections },
            });
        }
    }
    getRecentAlerts(limit = 100) {
        return this.alertHistory.slice(-limit);
    }
}
exports.AlertManager = AlertManager;
exports.alertManager = new AlertManager();
//# sourceMappingURL=alerting.js.map