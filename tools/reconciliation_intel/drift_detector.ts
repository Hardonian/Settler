/**
 * Drift Detector Module
 * Analyzes historical truth tables to detect reconciliation drift patterns
 */

export interface TruthTableEntry {
  source_record_id: string;
  target_record_id: string;
  match_status: "matched" | "mismatched" | "orphan";
  rule_applied: string;
  confidence: number;
  source_values: Record<string, any>;
  target_values: Record<string, any>;
  timestamp: string;
}

export interface DriftMetrics {
  match_rate_trend: number; // -1 to 1 (decreasing to increasing)
  confidence_trend: number;
  volume_variance: number;
  timing_variance_ms: number;
  rule_usage_shift: Map<string, number>;
}

export interface DriftReport {
  detected: boolean;
  severity: "low" | "medium" | "high" | "critical";
  drift_type:
    | "match_rate_decline"
    | "confidence_decay"
    | "volume_spike"
    | "timing_anomaly"
    | "rule_shift";
  magnitude: number;
  baseline_period: { start: string; end: string };
  current_period: { start: string; end: string };
  explanation: string;
  financial_impact: string;
  recommended_action: string;
}

export class DriftDetector {
  private historicalData: TruthTableEntry[][] = [];
  private baselineWindow: number = 7; // 7 reconciliations for baseline

  constructor(windowSize: number = 7) {
    this.baselineWindow = windowSize;
  }

  /**
   * Add a reconciliation run to the historical dataset
   */
  ingestRun(truthTable: TruthTableEntry[]): void {
    this.historicalData.push(truthTable);

    // Keep only recent history to prevent memory bloat
    if (this.historicalData.length > this.baselineWindow * 2) {
      this.historicalData = this.historicalData.slice(-this.baselineWindow * 2);
    }
  }

  /**
   * Calculate comprehensive drift metrics
   */
  calculateDriftMetrics(): DriftMetrics {
    if (this.historicalData.length < 2) {
      return {
        match_rate_trend: 0,
        confidence_trend: 0,
        volume_variance: 0,
        timing_variance_ms: 0,
        rule_usage_shift: new Map(),
      };
    }

    const baseline = this.historicalData.slice(0, this.baselineWindow);
    const current = this.historicalData.slice(-this.baselineWindow);

    return {
      match_rate_trend: this.calculateMatchRateTrend(baseline, current),
      confidence_trend: this.calculateConfidenceTrend(baseline, current),
      volume_variance: this.calculateVolumeVariance(baseline, current),
      timing_variance_ms: this.calculateTimingVariance(current),
      rule_usage_shift: this.calculateRuleUsageShift(baseline, current),
    };
  }

  /**
   * Detect all drift patterns and return actionable reports
   */
  detectDrift(): DriftReport[] {
    const reports: DriftReport[] = [];
    const metrics = this.calculateDriftMetrics();

    // Match rate decline detection
    if (metrics.match_rate_trend < -0.1) {
      reports.push({
        detected: true,
        severity:
          metrics.match_rate_trend < -0.3
            ? "critical"
            : metrics.match_rate_trend < -0.2
              ? "high"
              : "medium",
        drift_type: "match_rate_decline",
        magnitude: Math.abs(metrics.match_rate_trend),
        baseline_period: this.getPeriodRange(0, this.baselineWindow),
        current_period: this.getPeriodRange(-this.baselineWindow, 0),
        explanation:
          `Match rate declining at ${(metrics.match_rate_trend * 100).toFixed(1)}% per reconciliation. ` +
          `This indicates deteriorating data quality or source system changes.`,
        financial_impact:
          "Unmatched transactions require manual review, increasing operational cost and delaying financial close.",
        recommended_action:
          "Review source data quality, verify integration health, consider rule relaxation or data cleansing pipeline.",
      });
    }

    // Confidence decay detection
    if (metrics.confidence_trend < -0.05) {
      reports.push({
        detected: true,
        severity: metrics.confidence_trend < -0.15 ? "high" : "medium",
        drift_type: "confidence_decay",
        magnitude: Math.abs(metrics.confidence_trend),
        baseline_period: this.getPeriodRange(0, this.baselineWindow),
        current_period: this.getPeriodRange(-this.baselineWindow, 0),
        explanation:
          `Match confidence decaying at ${(metrics.confidence_trend * 100).toFixed(1)}% per reconciliation. ` +
          `Rules are producing less certain matches.`,
        financial_impact:
          "Lower confidence increases risk of false positives/negatives, potentially leading to incorrect financial reporting.",
        recommended_action:
          "Analyze rule effectiveness, review fuzzy matching thresholds, consider ML-based matching enhancement.",
      });
    }

    // Volume anomaly detection
    if (metrics.volume_variance > 2.0) {
      reports.push({
        detected: true,
        severity:
          metrics.volume_variance > 5.0
            ? "critical"
            : metrics.volume_variance > 3.0
              ? "high"
              : "medium",
        drift_type: "volume_spike",
        magnitude: metrics.volume_variance,
        baseline_period: this.getPeriodRange(0, this.baselineWindow),
        current_period: this.getPeriodRange(-this.baselineWindow, 0),
        explanation:
          `Volume variance of ${metrics.volume_variance.toFixed(2)}x detected. ` +
          `Transaction volume significantly deviates from baseline.`,
        financial_impact:
          "Volume spikes may indicate system issues, fraud, or business events requiring immediate financial attention.",
        recommended_action:
          "Investigate volume source, verify business event legitimacy, check for duplicate processing.",
      });
    }

    // Timing irregularity detection
    if (metrics.timing_variance_ms > 300000) {
      // 5 minutes
      reports.push({
        detected: true,
        severity: metrics.timing_variance_ms > 600000 ? "high" : "medium",
        drift_type: "timing_anomaly",
        magnitude: metrics.timing_variance_ms,
        baseline_period: this.getPeriodRange(0, this.baselineWindow),
        current_period: this.getPeriodRange(-this.baselineWindow, 0),
        explanation:
          `Reconciliation timing variance of ${(metrics.timing_variance_ms / 1000).toFixed(0)}s detected. ` +
          `Processing times are inconsistent.`,
        financial_impact:
          "Timing irregularities may indicate infrastructure issues, potentially delaying financial close and audit deadlines.",
        recommended_action:
          "Review infrastructure performance, check for resource contention, optimize reconciliation queries.",
      });
    }

    // Rule usage shift detection
    metrics.rule_usage_shift.forEach((shift, rule) => {
      if (Math.abs(shift) > 0.2) {
        reports.push({
          detected: true,
          severity: Math.abs(shift) > 0.5 ? "high" : "medium",
          drift_type: "rule_shift",
          magnitude: Math.abs(shift),
          baseline_period: this.getPeriodRange(0, this.baselineWindow),
          current_period: this.getPeriodRange(-this.baselineWindow, 0),
          explanation:
            `Rule "${rule}" usage shifted by ${(shift * 100).toFixed(1)}%. ` +
            `${shift > 0 ? "Increased" : "Decreased"} reliance on this rule.`,
          financial_impact:
            "Rule shifts indicate changing data patterns, potentially requiring rule optimization or new rule creation.",
          recommended_action:
            shift > 0
              ? `Rule "${rule}" is being used more - verify it captures intended matches correctly.`
              : `Rule "${rule}" usage declining - consider deprecation or threshold adjustment.`,
        });
      }
    });

    return reports;
  }

  private calculateMatchRateTrend(
    baseline: TruthTableEntry[][],
    current: TruthTableEntry[][]
  ): number {
    const baselineRate = this.averageMatchRate(baseline);
    const currentRate = this.averageMatchRate(current);

    if (baselineRate === 0) return 0;
    return (currentRate - baselineRate) / baselineRate;
  }

  private calculateConfidenceTrend(
    baseline: TruthTableEntry[][],
    current: TruthTableEntry[][]
  ): number {
    const baselineConf = this.averageConfidence(baseline);
    const currentConf = this.averageConfidence(current);

    if (baselineConf === 0) return 0;
    return (currentConf - baselineConf) / baselineConf;
  }

  private calculateVolumeVariance(
    baseline: TruthTableEntry[][],
    current: TruthTableEntry[][]
  ): number {
    const baselineVolume = this.averageVolume(baseline);
    const currentVolume = this.averageVolume(current);

    if (baselineVolume === 0) return 0;
    return currentVolume / baselineVolume;
  }

  private calculateTimingVariance(runs: TruthTableEntry[][]): number {
    if (runs.length < 2) return 0;

    const timestamps = runs.flatMap((run) =>
      run.map((entry) => new Date(entry.timestamp).getTime())
    );

    if (timestamps.length < 2) return 0;

    const diffs: number[] = [];
    for (let i = 1; i < timestamps.length; i++) {
      diffs.push(Math.abs(timestamps[i] - timestamps[i - 1]));
    }

    const mean = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    const variance = diffs.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / diffs.length;

    return Math.sqrt(variance);
  }

  private calculateRuleUsageShift(
    baseline: TruthTableEntry[][],
    current: TruthTableEntry[][]
  ): Map<string, number> {
    const baselineRules = this.countRuleUsage(baseline);
    const currentRules = this.countRuleUsage(current);
    const shifts = new Map<string, number>();

    const allRules = new Set([...baselineRules.keys(), ...currentRules.keys()]);

    allRules.forEach((rule) => {
      const baselineCount = baselineRules.get(rule) || 0;
      const currentCount = currentRules.get(rule) || 0;
      const totalBaseline = Array.from(baselineRules.values()).reduce((a, b) => a + b, 0);

      if (totalBaseline > 0) {
        const baselineRate = baselineCount / totalBaseline;
        const currentRate =
          currentCount / (Array.from(currentRules.values()).reduce((a, b) => a + b, 0) || 1);
        shifts.set(rule, currentRate - baselineRate);
      }
    });

    return shifts;
  }

  private averageMatchRate(runs: TruthTableEntry[][]): number {
    if (runs.length === 0) return 0;
    const rates = runs.map((run) => {
      const total = run.length;
      const matched = run.filter((r) => r.match_status === "matched").length;
      return total > 0 ? matched / total : 0;
    });
    return rates.reduce((a, b) => a + b, 0) / rates.length;
  }

  private averageConfidence(runs: TruthTableEntry[][]): number {
    if (runs.length === 0) return 0;
    const allEntries = runs.flat();
    if (allEntries.length === 0) return 0;
    return allEntries.reduce((acc, entry) => acc + entry.confidence, 0) / allEntries.length;
  }

  private averageVolume(runs: TruthTableEntry[][]): number {
    if (runs.length === 0) return 0;
    return runs.reduce((acc, run) => acc + run.length, 0) / runs.length;
  }

  private countRuleUsage(runs: TruthTableEntry[][]): Map<string, number> {
    const counts = new Map<string, number>();
    runs.flat().forEach((entry) => {
      const count = counts.get(entry.rule_applied) || 0;
      counts.set(entry.rule_applied, count + 1);
    });
    return counts;
  }

  private getPeriodRange(start: number, end: number): { start: string; end: string } {
    const data =
      start < 0
        ? this.historicalData.slice(start, end === 0 ? undefined : end)
        : this.historicalData.slice(start, end);

    if (data.length === 0) {
      return { start: new Date().toISOString(), end: new Date().toISOString() };
    }

    const allTimestamps = data.flatMap((run) =>
      run.map((entry) => new Date(entry.timestamp).getTime())
    );

    return {
      start: new Date(Math.min(...allTimestamps)).toISOString(),
      end: new Date(Math.max(...allTimestamps)).toISOString(),
    };
  }
}

export default DriftDetector;
