/**
 * Alert Generator Module
 * Generates anomaly_alert.json and anomaly_alert.md artifacts
 */

import { AnomalyClassification } from "./anomaly_classifier";
import { DriftReport } from "./drift_detector";
import { RuleRecommendation } from "./rule_health_scorer";

export interface AlertArtifact {
  alert_id: string;
  alert_type: "drift" | "anomaly" | "rule_health" | "compliance";
  severity: "info" | "low" | "medium" | "high" | "critical";
  status: "active" | "acknowledged" | "resolved" | "suppressed";
  title: string;
  what_changed: string;
  why_it_matters: string;
  confidence_score: number;
  recommended_action: string;
  created_at: string;
  acknowledged_at?: string;
  resolved_at?: string;
  acknowledged_by?: string;
  resolution_notes?: string;
  related_alerts?: string[];
  metadata: {
    source: string;
    reconciliation_run_id?: string;
    rule_id?: string;
    affected_records?: number;
    financial_impact_usd?: number;
  };
}

export interface AlertBundle {
  bundle_id: string;
  generated_at: string;
  alert_count: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  alerts: AlertArtifact[];
  summary: {
    total_financial_impact_usd: number;
    requires_immediate_action: boolean;
    affected_systems: string[];
  };
}

export class AlertGenerator {
  private alerts: AlertArtifact[] = [];
  private alertCounter = 0;

  /**
   * Generate alert from drift report
   */
  fromDrift(report: DriftReport, runId?: string): AlertArtifact {
    const severityMap: Record<string, AlertArtifact["severity"]> = {
      low: "low",
      medium: "medium",
      high: "high",
      critical: "critical",
    };

    const alert: AlertArtifact = {
      alert_id: this.generateAlertId(),
      alert_type: "drift",
      severity: severityMap[report.severity] || "medium",
      status: "active",
      title: `Drift Detected: ${this.formatDriftType(report.drift_type)}`,
      what_changed: report.explanation,
      why_it_matters: report.financial_impact,
      confidence_score: Math.min(0.99, report.magnitude * 0.8 + 0.1),
      recommended_action: report.recommended_action,
      created_at: new Date().toISOString(),
      metadata: {
        source: "drift_detector",
        reconciliation_run_id: runId,
        affected_records: Math.floor(report.magnitude * 100),
      },
    };

    this.alerts.push(alert);
    return alert;
  }

  /**
   * Generate alert from anomaly classification
   */
  fromAnomaly(anomaly: AnomalyClassification, runId?: string): AlertArtifact {
    const alert: AlertArtifact = {
      alert_id: anomaly.id,
      alert_type: "anomaly",
      severity: anomaly.severity,
      status: "active",
      title: anomaly.title,
      what_changed: anomaly.description,
      why_it_matters: anomaly.financial_impact,
      confidence_score: anomaly.confidence,
      recommended_action: anomaly.recommendations[0] || "Investigate and monitor",
      created_at: anomaly.created_at,
      metadata: {
        source: "anomaly_classifier",
        reconciliation_run_id: runId,
        affected_records: anomaly.signals.reduce((sum, s) => sum + (s.observed || 0), 0),
      },
    };

    this.alerts.push(alert);
    return alert;
  }

  /**
   * Generate alert from rule recommendation
   */
  fromRuleRecommendation(rec: RuleRecommendation): AlertArtifact {
    const prioritySeverity: Record<string, AlertArtifact["severity"]> = {
      low: "low",
      medium: "medium",
      high: "high",
      urgent: "critical",
    };

    const actionDescriptions: Record<string, string> = {
      refine: "Rule requires refinement",
      retire: "Rule should be retired",
      monitor: "Rule needs monitoring",
      promote: "Rule performing well - promote as best practice",
      unknown: "Rule status unknown",
    };

    const alert: AlertArtifact = {
      alert_id: this.generateAlertId(),
      alert_type: "rule_health",
      severity: prioritySeverity[rec.priority] || "medium",
      status: "active",
      title: `Rule Health: ${rec.rule_id}`,
      what_changed: actionDescriptions[rec.action] || "Rule status update",
      why_it_matters: rec.reason,
      confidence_score: rec.action === "retire" ? 0.95 : rec.action === "refine" ? 0.8 : 0.7,
      recommended_action: rec.suggestions.join("; "),
      created_at: new Date().toISOString(),
      metadata: {
        source: "rule_health_scorer",
        rule_id: rec.rule_id,
        affected_records: 0,
      },
    };

    this.alerts.push(alert);
    return alert;
  }

  /**
   * Generate compliance alert
   */
  fromCompliance(
    issue: string,
    severity: AlertArtifact["severity"],
    financialImpact: string,
    action: string,
    snapshotId?: string
  ): AlertArtifact {
    const alert: AlertArtifact = {
      alert_id: this.generateAlertId(),
      alert_type: "compliance",
      severity,
      status: "active",
      title: "Compliance Issue Detected",
      what_changed: issue,
      why_it_matters: financialImpact,
      confidence_score: 0.95,
      recommended_action: action,
      created_at: new Date().toISOString(),
      metadata: {
        source: "compliance_snapshot",
        affected_records: 0,
      },
    };

    if (snapshotId) {
      alert.metadata.reconciliation_run_id = snapshotId;
    }

    this.alerts.push(alert);
    return alert;
  }

  /**
   * Create alert bundle from all active alerts
   */
  createBundle(): AlertBundle {
    const active = this.alerts.filter((a) => a.status === "active");

    return {
      bundle_id: `bundle_${Date.now()}`,
      generated_at: new Date().toISOString(),
      alert_count: active.length,
      critical_count: active.filter((a) => a.severity === "critical").length,
      high_count: active.filter((a) => a.severity === "high").length,
      medium_count: active.filter((a) => a.severity === "medium").length,
      low_count: active.filter((a) => a.severity === "low").length,
      alerts: active,
      summary: {
        total_financial_impact_usd: this.estimateFinancialImpact(active),
        requires_immediate_action: active.some((a) => a.severity === "critical"),
        affected_systems: [...new Set(active.map((a) => a.metadata.source))],
      },
    };
  }

  /**
   * Export alerts to JSON artifact
   */
  exportToJson(alerts?: AlertArtifact[]): string {
    const toExport = alerts || this.alerts;
    return JSON.stringify(toExport, null, 2);
  }

  /**
   * Export alerts to Markdown artifact
   */
  exportToMarkdown(bundle?: AlertBundle): string {
    const b = bundle || this.createBundle();

    let md = `# Anomaly Alert Report\n\n`;
    md += `**Generated:** ${b.generated_at}  \n`;
    md += `**Bundle ID:** ${b.bundle_id}  \n`;
    md += `**Total Alerts:** ${b.alert_count}  \n\n`;

    md += `## Executive Summary\n\n`;
    md += `- **Critical:** ${b.critical_count}  \n`;
    md += `- **High:** ${b.high_count}  \n`;
    md += `- **Medium:** ${b.medium_count}  \n`;
    md += `- **Low:** ${b.low_count}  \n`;
    md += `- **Estimated Financial Impact:** $${b.summary.total_financial_impact_usd.toLocaleString()}  \n`;
    md += `- **Requires Immediate Action:** ${b.summary.requires_immediate_action ? "YES" : "No"}  \n\n`;

    if (b.alerts.length === 0) {
      md += `## No Active Alerts\n\n`;
      md += `All systems operating within normal parameters. 🎉\n`;
      return md;
    }

    md += `## Active Alerts\n\n`;

    // Group by severity
    const bySeverity = this.groupBySeverity(b.alerts);

    ["critical", "high", "medium", "low", "info"].forEach((severity) => {
      const alerts = bySeverity[severity] || [];
      if (alerts.length === 0) return;

      md += `### ${severity.toUpperCase()} (${alerts.length})\n\n`;

      alerts.forEach((alert, idx) => {
        md += `#### ${idx + 1}. ${alert.title}\n\n`;
        md += `- **Alert ID:** ${alert.alert_id}  \n`;
        md += `- **Type:** ${alert.alert_type}  \n`;
        md += `- **Confidence:** ${(alert.confidence_score * 100).toFixed(1)}%  \n`;
        md += `- **Created:** ${alert.created_at}  \n\n`;

        md += `**What Changed:**  \n`;
        md += `${alert.what_changed}  \n\n`;

        md += `**Why It Matters:**  \n`;
        md += `${alert.why_it_matters}  \n\n`;

        md += `**Recommended Action:**  \n`;
        md += `${alert.recommended_action}  \n\n`;

        if (alert.metadata.affected_records && alert.metadata.affected_records > 0) {
          md += `**Affected Records:** ${alert.metadata.affected_records}  \n\n`;
        }

        md += `---\n\n`;
      });
    });

    md += `## Affected Systems\n\n`;
    b.summary.affected_systems.forEach((system) => {
      md += `- ${system}\n`;
    });
    md += `\n`;

    md += `## Recommended Actions Summary\n\n`;
    b.alerts.slice(0, 5).forEach((alert) => {
      md += `1. [${alert.severity.toUpperCase()}] ${alert.recommended_action}\n`;
    });

    if (b.alerts.length > 5) {
      md += `\n*... and ${b.alerts.length - 5} more alerts*\n`;
    }

    return md;
  }

  /**
   * Acknowledge an alert
   */
  acknowledge(alertId: string, user: string): boolean {
    const alert = this.alerts.find((a) => a.alert_id === alertId);
    if (!alert || alert.status !== "active") return false;

    alert.status = "acknowledged";
    alert.acknowledged_at = new Date().toISOString();
    alert.acknowledged_by = user;
    return true;
  }

  /**
   * Resolve an alert
   */
  resolve(alertId: string, notes: string): boolean {
    const alert = this.alerts.find((a) => a.alert_id === alertId);
    if (!alert) return false;

    alert.status = "resolved";
    alert.resolved_at = new Date().toISOString();
    alert.resolution_notes = notes;
    return true;
  }

  /**
   * Suppress an alert (auto-resolved)
   */
  suppress(alertId: string, reason: string): boolean {
    const alert = this.alerts.find((a) => a.alert_id === alertId);
    if (!alert) return false;

    alert.status = "suppressed";
    alert.resolved_at = new Date().toISOString();
    alert.resolution_notes = `Suppressed: ${reason}`;
    return true;
  }

  /**
   * Get all alerts
   */
  getAlerts(): AlertArtifact[] {
    return [...this.alerts];
  }

  /**
   * Get active alerts only
   */
  getActiveAlerts(): AlertArtifact[] {
    return this.alerts.filter((a) => a.status === "active");
  }

  /**
   * Clear all alerts
   */
  clear(): void {
    this.alerts = [];
  }

  private generateAlertId(): string {
    this.alertCounter++;
    return `alert_${Date.now()}_${this.alertCounter.toString().padStart(4, "0")}`;
  }

  private formatDriftType(type: string): string {
    const map: Record<string, string> = {
      match_rate_decline: "Match Rate Declining",
      confidence_decay: "Confidence Decay",
      volume_spike: "Volume Anomaly",
      timing_anomaly: "Processing Time Anomaly",
      rule_shift: "Rule Usage Shift",
    };
    return map[type] || type;
  }

  private groupBySeverity(alerts: AlertArtifact[]): Record<string, AlertArtifact[]> {
    return alerts.reduce(
      (acc, alert) => {
        const severity = alert.severity || "info";
        if (!acc[severity]) acc[severity] = [];
        acc[severity].push(alert);
        return acc;
      },
      {} as Record<string, AlertArtifact[]>
    );
  }

  private estimateFinancialImpact(alerts: AlertArtifact[]): number {
    return alerts.reduce((sum, alert) => {
      // Extract financial impact from text or use metadata
      const impact = alert.metadata?.financial_impact_usd || 0;

      // Estimate based on severity if no explicit value
      if (impact === 0) {
        const severityEstimate: Record<string, number> = {
          critical: 50000,
          high: 10000,
          medium: 2500,
          low: 500,
          info: 0,
        };
        return sum + (severityEstimate[alert.severity] || 0);
      }

      return sum + impact;
    }, 0);
  }
}

export default AlertGenerator;
