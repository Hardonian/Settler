/**
 * Anomaly Classifier Module
 * Detects and classifies reconciliation anomalies with severity levels
 */

export interface AnomalySignal {
  type: "volume" | "value" | "timing" | "pattern" | "quality";
  metric: string;
  observed: number;
  expected: number;
  deviation: number;
  timestamp: string;
}

export interface AnomalyClassification {
  id: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
  category: string;
  title: string;
  description: string;
  financial_impact: string;
  confidence: number;
  signals: AnomalySignal[];
  recommendations: string[];
  auto_resolve: boolean;
  created_at: string;
}

export class AnomalyClassifier {
  private thresholds = {
    volume: { low: 1.2, medium: 1.5, high: 2.0, critical: 3.0 },
    value: { low: 0.05, medium: 0.1, high: 0.2, critical: 0.5 },
    timing: { low: 60000, medium: 300000, high: 600000, critical: 1800000 }, // ms
    pattern: { low: 0.1, medium: 0.25, high: 0.5, critical: 0.75 },
    quality: { low: 0.02, medium: 0.05, high: 0.1, critical: 0.2 },
  };

  /**
   * Classify volume anomalies
   */
  classifyVolumeAnomaly(
    currentVolume: number,
    baselineVolume: number,
    timestamp: string
  ): AnomalyClassification | null {
    if (baselineVolume === 0) return null;

    const ratio = currentVolume / baselineVolume;
    const deviation = Math.abs(ratio - 1);

    if (deviation < this.thresholds.volume.low) return null;

    const severity = this.determineSeverity("volume", ratio > 1 ? ratio : 1 / ratio);
    const direction = ratio > 1 ? "spike" : "drop";

    return {
      id: `vol_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      severity,
      category: "volume_anomaly",
      title: `Volume ${direction === "spike" ? "Spike" : "Drop"} Detected`,
      description:
        `Transaction volume ${direction}d by ${(Math.abs(ratio - 1) * 100).toFixed(1)}%. ` +
        `Expected ${baselineVolume.toFixed(0)} transactions, observed ${currentVolume.toFixed(0)}.`,
      financial_impact: this.getVolumeFinancialImpact(
        severity,
        direction,
        currentVolume,
        baselineVolume
      ),
      confidence: Math.min(0.99, deviation * 2),
      signals: [
        {
          type: "volume",
          metric: "transaction_count",
          observed: currentVolume,
          expected: baselineVolume,
          deviation: ratio,
          timestamp,
        },
      ],
      recommendations: this.getVolumeRecommendations(severity, direction),
      auto_resolve: severity === "low",
      created_at: timestamp,
    };
  }

  /**
   * Classify value anomalies (amount discrepancies)
   */
  classifyValueAnomaly(
    currentTotal: number,
    baselineTotal: number,
    timestamp: string
  ): AnomalyClassification | null {
    if (baselineTotal === 0) return null;

    const deviation = Math.abs(currentTotal - baselineTotal) / Math.abs(baselineTotal);

    if (deviation < this.thresholds.value.low) return null;

    const severity = this.determineSeverity("value", deviation);
    const diff = currentTotal - baselineTotal;

    return {
      id: `val_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      severity,
      category: "value_anomaly",
      title: `Value ${diff > 0 ? "Surplus" : "Shortfall"} Detected`,
      description:
        `Total value deviation of ${(deviation * 100).toFixed(2)}% detected. ` +
        `Expected $${baselineTotal.toFixed(2)}, observed $${currentTotal.toFixed(2)} ` +
        `($${Math.abs(diff).toFixed(2)} ${diff > 0 ? "surplus" : "shortfall"}).`,
      financial_impact: this.getValueFinancialImpact(severity, diff),
      confidence: Math.min(0.99, deviation * 3),
      signals: [
        {
          type: "value",
          metric: "total_amount",
          observed: currentTotal,
          expected: baselineTotal,
          deviation,
          timestamp,
        },
      ],
      recommendations: this.getValueRecommendations(severity, diff > 0 ? "surplus" : "shortfall"),
      auto_resolve: false,
      created_at: timestamp,
    };
  }

  /**
   * Classify timing anomalies
   */
  classifyTimingAnomaly(
    currentDuration: number,
    baselineDuration: number,
    timestamp: string
  ): AnomalyClassification | null {
    if (baselineDuration === 0) return null;

    const deviation = currentDuration - baselineDuration;

    if (deviation < this.thresholds.timing.low) return null;

    const severity = this.determineSeverity("timing", deviation);

    return {
      id: `time_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      severity,
      category: "timing_anomaly",
      title: "Processing Time Anomaly",
      description:
        `Reconciliation processing time ${deviation > 0 ? "increased" : "decreased"} by ` +
        `${Math.abs(deviation).toFixed(0)}ms (${((Math.abs(deviation) / baselineDuration) * 100).toFixed(1)}%). ` +
        `Expected ${baselineDuration.toFixed(0)}ms, observed ${currentDuration.toFixed(0)}ms.`,
      financial_impact: this.getTimingFinancialImpact(severity, deviation),
      confidence: Math.min(0.95, Math.abs(deviation) / 1000000),
      signals: [
        {
          type: "timing",
          metric: "processing_duration_ms",
          observed: currentDuration,
          expected: baselineDuration,
          deviation: Math.abs(deviation),
          timestamp,
        },
      ],
      recommendations: this.getTimingRecommendations(severity),
      auto_resolve: severity === "low" || severity === "info",
      created_at: timestamp,
    };
  }

  /**
   * Classify pattern anomalies (unusual matching patterns)
   */
  classifyPatternAnomaly(
    pattern: string,
    frequency: number,
    baselineFrequency: number,
    timestamp: string
  ): AnomalyClassification | null {
    if (baselineFrequency === 0) return null;

    const deviation = Math.abs(frequency - baselineFrequency) / baselineFrequency;

    if (deviation < this.thresholds.pattern.low) return null;

    const severity = this.determineSeverity("pattern", deviation);

    return {
      id: `pat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      severity,
      category: "pattern_anomaly",
      title: "Matching Pattern Anomaly",
      description:
        `Unusual matching pattern detected: "${pattern}". ` +
        `Frequency changed by ${(deviation * 100).toFixed(1)}% ` +
        `(expected ${(baselineFrequency * 100).toFixed(1)}%, observed ${(frequency * 100).toFixed(1)}%).`,
      financial_impact: this.getPatternFinancialImpact(severity, pattern),
      confidence: Math.min(0.95, deviation * 1.5),
      signals: [
        {
          type: "pattern",
          metric: `pattern_${pattern}`,
          observed: frequency,
          expected: baselineFrequency,
          deviation,
          timestamp,
        },
      ],
      recommendations: [
        "Review recent data source changes",
        "Analyze pattern for business legitimacy",
        "Consider updating matching rules",
      ],
      auto_resolve: false,
      created_at: timestamp,
    };
  }

  /**
   * Classify data quality anomalies
   */
  classifyQualityAnomaly(
    errorRate: number,
    baselineErrorRate: number,
    errorTypes: Map<string, number>,
    timestamp: string
  ): AnomalyClassification | null {
    const deviation = errorRate - baselineErrorRate;

    if (deviation < this.thresholds.quality.low) return null;

    const severity = this.determineSeverity("quality", deviation);
    const topErrorTypes = Array.from(errorTypes.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type, count]) => `${type} (${count})`)
      .join(", ");

    return {
      id: `qual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      severity,
      category: "quality_anomaly",
      title: "Data Quality Degradation",
      description:
        `Error rate increased from ${(baselineErrorRate * 100).toFixed(2)}% to ` +
        `${(errorRate * 100).toFixed(2)}% (+${(deviation * 100).toFixed(2)}%). ` +
        `Top error types: ${topErrorTypes}.`,
      financial_impact: this.getQualityFinancialImpact(severity, errorRate),
      confidence: Math.min(0.98, deviation * 5),
      signals: Array.from(errorTypes.entries()).map(([type, count]) => ({
        type: "quality",
        metric: `error_${type}`,
        observed: count,
        expected: 0,
        deviation: count,
        timestamp,
      })),
      recommendations: [
        "Implement data validation pipeline",
        "Review source system data quality",
        "Add automated cleansing rules",
        "Consider data quality monitoring",
      ],
      auto_resolve: false,
      created_at: timestamp,
    };
  }

  private determineSeverity(
    type: "volume" | "value" | "timing" | "pattern" | "quality",
    value: number
  ): "info" | "low" | "medium" | "high" | "critical" {
    const thresholds = this.thresholds[type];

    if (value >= thresholds.critical) return "critical";
    if (value >= thresholds.high) return "high";
    if (value >= thresholds.medium) return "medium";
    if (value >= thresholds.low) return "low";
    return "info";
  }

  private getVolumeFinancialImpact(
    severity: string,
    direction: string,
    current: number,
    baseline: number
  ): string {
    const diff = Math.abs(current - baseline);

    switch (severity) {
      case "critical":
        return (
          `Critical volume ${direction} of ${diff} transactions threatens financial reporting accuracy. ` +
          `Immediate investigation required to prevent audit findings.`
        );
      case "high":
        return (
          `High volume ${direction} requires manual review of ${diff} additional transactions, ` +
          `impacting close timeline and increasing operational cost.`
        );
      case "medium":
        return (
          `Moderate volume ${direction} may indicate business activity change or data pipeline issue. ` +
          `Monitor for trend continuation.`
        );
      default:
        return `Minor volume variation within acceptable tolerance.`;
    }
  }

  private getVolumeRecommendations(severity: string, direction: string): string[] {
    const base = [
      `Verify ${direction} legitimacy with business stakeholders`,
      "Check for duplicate processing",
      "Review data pipeline health",
    ];

    if (severity === "critical" || severity === "high") {
      base.unshift("Escalate to finance leadership immediately");
      base.push("Initiate emergency reconciliation procedure");
    }

    return base;
  }

  private getValueFinancialImpact(severity: string, diff: number): string {
    const amount = Math.abs(diff).toFixed(2);

    switch (severity) {
      case "critical":
        return (
          `Critical value discrepancy of $${amount} represents material misstatement risk. ` +
          `Financial statements may be materially misstated.`
        );
      case "high":
        return (
          `Significant value deviation of $${amount} requires immediate reconciliation. ` +
          `May impact revenue recognition or cash reporting.`
        );
      case "medium":
        return `Moderate value difference of $${amount} should be investigated before period close.`;
      default:
        return `Minor value variance of $${amount} within acceptable tolerance.`;
    }
  }

  private getValueRecommendations(severity: string, type: string): string[] {
    return [
      `Investigate root cause of ${type}`,
      "Review source system configurations",
      "Verify exchange rate applications",
      "Check for timing differences",
      ...(severity === "critical" ? ["Notify CFO immediately", "Prepare audit documentation"] : []),
    ];
  }

  private getTimingFinancialImpact(severity: string, deviation: number): string {
    const seconds = (Math.abs(deviation) / 1000).toFixed(0);

    switch (severity) {
      case "critical":
        return (
          `Critical processing delay of ${seconds}s jeopardizes SLA compliance ` +
          `and may delay financial close.`
        );
      case "high":
        return (
          `High processing delay of ${seconds}s impacts operational efficiency ` +
          `and may affect downstream reporting.`
        );
      case "medium":
        return (
          `Moderate processing slowdown of ${seconds}s should be investigated ` +
          `to prevent future SLA breaches.`
        );
      default:
        return `Minor timing variance of ${seconds}s acceptable.`;
    }
  }

  private getTimingRecommendations(severity: string): string[] {
    return [
      "Review infrastructure resource utilization",
      "Check database query performance",
      "Analyze network latency",
      "Consider scaling reconciliation workers",
      ...(severity === "critical"
        ? ["Escalate to infrastructure team", "Consider manual reconciliation"]
        : []),
    ];
  }

  private getPatternFinancialImpact(severity: string, pattern: string): string {
    switch (severity) {
      case "critical":
        return (
          `Critical pattern change in "${pattern}" indicates fundamental data or process change ` +
          `affecting match accuracy and financial integrity.`
        );
      case "high":
        return (
          `Significant pattern shift in "${pattern}" requires rule review ` +
          `to ensure continued matching accuracy.`
        );
      case "medium":
        return (
          `Moderate pattern change in "${pattern}" should be monitored ` +
          `for potential rule optimization opportunities.`
        );
      default:
        return `Minor pattern variation in "${pattern}" acceptable.`;
    }
  }

  private getQualityFinancialImpact(severity: string, errorRate: number): string {
    const rate = (errorRate * 100).toFixed(2);

    switch (severity) {
      case "critical":
        return (
          `Critical data quality issue: ${rate}% error rate represents severe data integrity risk ` +
          `threatening financial reporting reliability.`
        );
      case "high":
        return (
          `High data quality degradation: ${rate}% error rate requires immediate intervention ` +
          `to prevent cascading financial errors.`
        );
      case "medium":
        return (
          `Moderate quality concerns: ${rate}% error rate indicates need for ` +
          `data quality improvement initiatives.`
        );
      default:
        return `Minor quality drift: ${rate}% error rate within monitoring thresholds.`;
    }
  }
}

export default AnomalyClassifier;
