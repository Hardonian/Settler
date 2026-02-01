/**
 * Reconciliation Intelligence Engine
 * Main orchestrator for Continuous Financial Truth Layer
 *
 * Integrates:
 * - Drift Detection
 * - Anomaly Classification
 * - Rule Health Scoring
 * - Alert Generation
 * - Compliance Snapshots
 */

export { DriftDetector, DriftReport, DriftMetrics, TruthTableEntry } from "./drift_detector";
export { AnomalyClassifier, AnomalyClassification, AnomalySignal } from "./anomaly_classifier";
export {
  RuleHealthScorer,
  RulePerformance,
  RuleRecommendation,
  RuleHealthReport,
} from "./rule_health_scorer";
export { AlertGenerator, AlertArtifact, AlertBundle } from "./alert_generator";
export {
  ComplianceSnapshotBuilder,
  ComplianceSnapshot,
  ComplianceRun,
  Attestation,
  ProofLink,
} from "./compliance_snapshot";

import { DriftDetector, TruthTableEntry } from "./drift_detector";
import { AnomalyClassifier } from "./anomaly_classifier";
import { RuleHealthScorer } from "./rule_health_scorer";
import { AlertGenerator } from "./alert_generator";
import { ComplianceSnapshotBuilder } from "./compliance_snapshot";

export interface ReconciliationIntelConfig {
  drift_window_size?: number;
  alert_auto_acknowledge_low?: boolean;
  enable_compliance_mode?: boolean;
  anomaly_thresholds?: {
    volume?: number;
    value?: number;
    timing?: number;
  };
}

export interface IntelResult {
  drift_reports: ReturnType<DriftDetector["detectDrift"]>;
  anomalies: Array<ReturnType<AnomalyClassifier["classifyVolumeAnomaly"]>>;
  rule_health: ReturnType<RuleHealthScorer["generateHealthReport"]>;
  alerts: ReturnType<AlertGenerator["createBundle"]>;
  compliance_ready: boolean;
}

export class ReconciliationIntel {
  driftDetector: DriftDetector;
  anomalyClassifier: AnomalyClassifier;
  ruleHealthScorer: RuleHealthScorer;
  alertGenerator: AlertGenerator;
  complianceBuilder: ComplianceSnapshotBuilder;

  private config: ReconciliationIntelConfig;
  private runHistory: Array<{
    run_id: string;
    timestamp: string;
    source: string;
    target: string;
    truth_table: TruthTableEntry[];
  }> = [];

  constructor(config: ReconciliationIntelConfig = {}) {
    this.config = {
      drift_window_size: 7,
      alert_auto_acknowledge_low: true,
      enable_compliance_mode: true,
      ...config,
    };

    this.driftDetector = new DriftDetector(this.config.drift_window_size);
    this.anomalyClassifier = new AnomalyClassifier();
    this.ruleHealthScorer = new RuleHealthScorer();
    this.alertGenerator = new AlertGenerator();
    this.complianceBuilder = new ComplianceSnapshotBuilder();
  }

  /**
   * Process a reconciliation run through the intelligence engine
   */
  processRun(
    runId: string,
    sourceSystem: string,
    targetSystem: string,
    truthTable: TruthTableEntry[],
    invariantPassed: boolean,
    violations: string[]
  ): IntelResult {
    const timestamp = new Date().toISOString();

    // 1. Feed to drift detector
    this.driftDetector.ingestRun(truthTable);

    // 2. Record for compliance
    this.runHistory.push({
      run_id: runId,
      timestamp,
      source: sourceSystem,
      target: targetSystem,
      truth_table: truthTable,
    });

    // 3. Update compliance builder
    this.complianceBuilder.addRun(
      runId,
      timestamp,
      sourceSystem,
      targetSystem,
      truthTable,
      invariantPassed,
      violations
    );

    // 4. Record rule outcomes for health scoring
    truthTable.forEach((entry) => {
      this.ruleHealthScorer.recordOutcome(entry.rule_applied, entry.rule_applied, {
        matched: entry.match_status === "matched",
        confidence: entry.confidence,
        verified: undefined,
        expected: entry.match_status === "matched",
      });
    });

    // 5. Detect drift
    const driftReports = this.driftDetector.detectDrift();

    // 6. Detect anomalies
    const anomalies = this.detectAnomalies(truthTable, timestamp);

    // 7. Generate alerts
    driftReports.forEach((report) => {
      this.alertGenerator.fromDrift(report, runId);
    });

    anomalies.forEach((anomaly) => {
      if (anomaly) {
        this.alertGenerator.fromAnomaly(anomaly, runId);
      }
    });

    // 8. Get rule health
    const ruleHealth = this.ruleHealthScorer.generateHealthReport();

    // 9. Generate rule health alerts
    ruleHealth.recommendations.forEach((rec) => {
      if (rec.priority === "high" || rec.priority === "urgent") {
        this.alertGenerator.fromRuleRecommendation(rec);
      }
    });

    // 10. Auto-acknowledge low severity if configured
    if (this.config.alert_auto_acknowledge_low) {
      this.alertGenerator
        .getActiveAlerts()
        .filter((a) => a.severity === "low")
        .forEach((a) => {
          this.alertGenerator.suppress(a.alert_id, "Auto-suppressed: Low severity");
        });
    }

    // 11. Create alert bundle
    const alertBundle = this.alertGenerator.createBundle();

    return {
      drift_reports: driftReports,
      anomalies: anomalies.filter((a) => a !== null) as any[],
      rule_health: ruleHealth,
      alerts: alertBundle,
      compliance_ready: this.config.enable_compliance_mode || false,
    };
  }

  /**
   * Generate compliance snapshot for date range
   */
  generateComplianceSnapshot(
    startDate: string,
    endDate: string,
    frozenBy: string
  ): ReturnType<ComplianceSnapshotBuilder["build"]> {
    if (!this.config.enable_compliance_mode) {
      throw new Error("Compliance mode not enabled");
    }

    return this.complianceBuilder.build(startDate, endDate, frozenBy);
  }

  /**
   * Replay compliance snapshot
   */
  replayComplianceSnapshot(
    snapshot: ReturnType<ComplianceSnapshotBuilder["build"]>
  ): ReturnType<ComplianceSnapshotBuilder["replay"]> {
    return this.complianceBuilder.replay(snapshot);
  }

  /**
   * Export artifacts to files
   */
  exportArtifacts(
    outputDir: string,
    result: IntelResult,
    snapshot?: ReturnType<ComplianceSnapshotBuilder["build"]>
  ): void {
    const fs = require("fs");
    const path = require("path");

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Export anomaly_alert.json
    const alertsJson = this.alertGenerator.exportToJson(result.alerts.alerts);
    fs.writeFileSync(path.join(outputDir, "anomaly_alert.json"), alertsJson);

    // Export anomaly_alert.md
    const alertsMd = this.alertGenerator.exportToMarkdown(result.alerts);
    fs.writeFileSync(path.join(outputDir, "anomaly_alert.md"), alertsMd);

    // Export rule health report
    fs.writeFileSync(
      path.join(outputDir, "rule_health_report.json"),
      JSON.stringify(result.rule_health, null, 2)
    );

    // Export compliance snapshot if provided
    if (snapshot) {
      fs.writeFileSync(
        path.join(outputDir, "compliance_snapshot.json"),
        this.complianceBuilder.exportToJson(snapshot)
      );

      fs.writeFileSync(
        path.join(outputDir, "compliance_snapshot.md"),
        this.complianceBuilder.exportToMarkdown(snapshot)
      );
    }

    // Export drift report
    fs.writeFileSync(
      path.join(outputDir, "drift_report.json"),
      JSON.stringify(result.drift_reports, null, 2)
    );
  }

  /**
   * Get system status summary
   */
  getStatus(): {
    runs_processed: number;
    drift_detected: boolean;
    active_alerts: number;
    critical_alerts: number;
    overall_health: number;
    compliance_enabled: boolean;
  } {
    const activeAlerts = this.alertGenerator.getActiveAlerts();
    const ruleHealth = this.ruleHealthScorer.generateHealthReport();

    return {
      runs_processed: this.runHistory.length,
      drift_detected: this.driftDetector.detectDrift().length > 0,
      active_alerts: activeAlerts.length,
      critical_alerts: activeAlerts.filter((a) => a.severity === "critical").length,
      overall_health: ruleHealth.overall_health,
      compliance_enabled: this.config.enable_compliance_mode || false,
    };
  }

  private detectAnomalies(
    truthTable: TruthTableEntry[],
    timestamp: string
  ): Array<ReturnType<AnomalyClassifier["classifyVolumeAnomaly"]>> {
    const anomalies: Array<ReturnType<AnomalyClassifier["classifyVolumeAnomaly"]>> = [];

    // Volume anomaly
    const currentVolume = truthTable.length;
    const prevRun =
      this.runHistory.length > 0 ? this.runHistory[this.runHistory.length - 1] : undefined;
    const baselineVolume = prevRun ? prevRun.truth_table.length : currentVolume;

    anomalies.push(
      this.anomalyClassifier.classifyVolumeAnomaly(currentVolume, baselineVolume, timestamp)
    );

    // Value anomaly - calculate total amounts
    const currentTotal = truthTable.reduce((sum, t) => {
      const amount = t.source_values?.amount || t.target_values?.amount || 0;
      return sum + amount;
    }, 0);

    const prevPrevRun =
      this.runHistory.length > 1 ? this.runHistory[this.runHistory.length - 2] : undefined;
    const baselineTotal = prevPrevRun
      ? prevPrevRun.truth_table.reduce((sum, t) => {
          const amount = t.source_values?.amount || t.target_values?.amount || 0;
          return sum + amount;
        }, 0)
      : currentTotal;

    anomalies.push(
      this.anomalyClassifier.classifyValueAnomaly(currentTotal, baselineTotal, timestamp)
    );

    // Quality anomaly - check for low confidence matches
    const lowConfidenceCount = truthTable.filter((t) => t.confidence < 0.8).length;
    const errorRate = truthTable.length > 0 ? lowConfidenceCount / truthTable.length : 0;

    const errorTypes = new Map<string, number>();
    truthTable
      .filter((t) => t.match_status === "mismatched")
      .forEach((t) => {
        const type = t.rule_applied || "unknown";
        errorTypes.set(type, (errorTypes.get(type) || 0) + 1);
      });

    anomalies.push(
      this.anomalyClassifier.classifyQualityAnomaly(errorRate, 0.05, errorTypes, timestamp)
    );

    return anomalies;
  }
}

export default ReconciliationIntel;
