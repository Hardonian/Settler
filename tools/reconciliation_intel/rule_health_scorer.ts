/**
 * Rule Health Scorer Module
 * Tracks and scores reconciliation rule effectiveness over time
 */

export interface RulePerformance {
  rule_id: string;
  rule_name: string;
  invocations: number;
  matches: number;
  false_positives: number;
  false_negatives: number;
  confidence_sum: number;
  avg_confidence: number;
  accuracy_rate: number;
  precision: number;
  recall: number;
  f1_score: number;
  trend: "improving" | "stable" | "declining" | "volatile";
  health_score: number; // 0-100
}

export interface RuleRecommendation {
  rule_id: string;
  action: "refine" | "retire" | "monitor" | "promote";
  priority: "low" | "medium" | "high" | "urgent";
  reason: string;
  suggestions: string[];
  expected_impact: string;
}

export interface RuleHealthReport {
  generated_at: string;
  total_rules: number;
  healthy_rules: number;
  at_risk_rules: number;
  critical_rules: number;
  overall_health: number; // 0-100
  rules: RulePerformance[];
  recommendations: RuleRecommendation[];
}

export class RuleHealthScorer {
  private ruleHistory: Map<string, RulePerformance[]> = new Map();
  private readonly HISTORY_WINDOW = 30; // Keep 30 data points per rule

  /**
   * Record a rule invocation outcome
   */
  recordOutcome(
    ruleId: string,
    ruleName: string,
    outcome: {
      matched: boolean;
      confidence: number;
      verified?: boolean; // Manual verification result
      expected?: boolean; // Expected match result
    }
  ): void {
    const history = this.ruleHistory.get(ruleId) || [];

    // Calculate metrics based on this single outcome
    const isFalsePositive = outcome.matched && outcome.verified === false;
    const isFalseNegative = !outcome.matched && outcome.expected === true;

    const performance: RulePerformance = {
      rule_id: ruleId,
      rule_name: ruleName,
      invocations: 1,
      matches: outcome.matched ? 1 : 0,
      false_positives: isFalsePositive ? 1 : 0,
      false_negatives: isFalseNegative ? 1 : 0,
      confidence_sum: outcome.confidence,
      avg_confidence: outcome.confidence,
      accuracy_rate:
        outcome.verified === undefined ? (outcome.matched ? 1 : 0) : outcome.verified ? 1 : 0,
      precision: isFalsePositive ? 0 : outcome.matched ? 1 : 0,
      recall: isFalseNegative ? 0 : outcome.matched || outcome.expected ? 1 : 0,
      f1_score: 0, // Calculated below
      trend: "stable",
      health_score: 0, // Calculated below
    };

    // Calculate F1
    if (performance.precision + performance.recall > 0) {
      performance.f1_score =
        (2 * (performance.precision * performance.recall)) /
        (performance.precision + performance.recall);
    }

    // Calculate health score
    performance.health_score = this.calculateHealthScore(performance);

    history.push(performance);

    // Trim history
    if (history.length > this.HISTORY_WINDOW) {
      history.shift();
    }

    this.ruleHistory.set(ruleId, history);
  }

  /**
   * Aggregate performance data for a rule
   */
  getRulePerformance(ruleId: string): RulePerformance | null {
    const history = this.ruleHistory.get(ruleId);
    if (!history || history.length === 0) return null;

    const firstEntry = history[0];
    if (!firstEntry) return null;

    const aggregated: RulePerformance = {
      rule_id: ruleId,
      rule_name: firstEntry.rule_name,
      invocations: 0,
      matches: 0,
      false_positives: 0,
      false_negatives: 0,
      confidence_sum: 0,
      avg_confidence: 0,
      accuracy_rate: 0,
      precision: 0,
      recall: 0,
      f1_score: 0,
      trend: "stable",
      health_score: 0,
    };

    // Aggregate counts
    history.forEach((h) => {
      aggregated.invocations += h.invocations;
      aggregated.matches += h.matches;
      aggregated.false_positives += h.false_positives;
      aggregated.false_negatives += h.false_negatives;
      aggregated.confidence_sum += h.confidence_sum;
    });

    // Calculate averages
    aggregated.avg_confidence = aggregated.confidence_sum / aggregated.invocations;

    // Calculate accuracy
    const verifiedCount = history.filter((h) => h.accuracy_rate !== undefined).length;
    if (verifiedCount > 0) {
      aggregated.accuracy_rate =
        history.reduce((sum, h) => sum + h.accuracy_rate, 0) / verifiedCount;
    } else {
      aggregated.accuracy_rate = aggregated.matches / aggregated.invocations;
    }

    // Calculate precision and recall
    const truePositives = aggregated.matches - aggregated.false_positives;
    const falsePositives = aggregated.false_positives;
    const falseNegatives = aggregated.false_negatives;

    aggregated.precision =
      truePositives + falsePositives > 0 ? truePositives / (truePositives + falsePositives) : 0;

    aggregated.recall =
      truePositives + falseNegatives > 0 ? truePositives / (truePositives + falseNegatives) : 0;

    // Calculate F1
    if (aggregated.precision + aggregated.recall > 0) {
      aggregated.f1_score =
        (2 * (aggregated.precision * aggregated.recall)) /
        (aggregated.precision + aggregated.recall);
    }

    // Determine trend
    aggregated.trend = this.calculateTrend(history);

    // Calculate health score
    aggregated.health_score = this.calculateHealthScore(aggregated);

    return aggregated;
  }

  /**
   * Generate comprehensive health report for all rules
   */
  generateHealthReport(): RuleHealthReport {
    const rules: RulePerformance[] = [];
    const recommendations: RuleRecommendation[] = [];

    this.ruleHistory.forEach((_, ruleId) => {
      const performance = this.getRulePerformance(ruleId);
      if (performance) {
        rules.push(performance);

        const rec = this.generateRecommendation(performance);
        if (rec) {
          recommendations.push(rec);
        }
      }
    });

    // Sort rules by health score
    rules.sort((a, b) => b.health_score - a.health_score);

    // Sort recommendations by priority
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    const healthyRules = rules.filter((r) => r.health_score >= 80).length;
    const atRiskRules = rules.filter((r) => r.health_score >= 60 && r.health_score < 80).length;
    const criticalRules = rules.filter((r) => r.health_score < 60).length;

    const overallHealth =
      rules.length > 0 ? rules.reduce((sum, r) => sum + r.health_score, 0) / rules.length : 0;

    return {
      generated_at: new Date().toISOString(),
      total_rules: rules.length,
      healthy_rules: healthyRules,
      at_risk_rules: atRiskRules,
      critical_rules: criticalRules,
      overall_health: Math.round(overallHealth),
      rules,
      recommendations,
    };
  }

  /**
   * Detect rule effectiveness decay
   */
  detectDecay(minSamples: number = 10): Array<{ ruleId: string; decay: number; reason: string }> {
    const decaying: Array<{ ruleId: string; decay: number; reason: string }> = [];

    this.ruleHistory.forEach((history, ruleId) => {
      if (history.length < minSamples) return;

      // Split history in half
      const mid = Math.floor(history.length / 2);
      const firstHalf = history.slice(0, mid);
      const secondHalf = history.slice(mid);

      // Calculate F1 scores for each half
      const calcF1 = (h: RulePerformance[]) => {
        const totalMatches = h.reduce((sum, r) => sum + r.matches, 0);
        const totalFP = h.reduce((sum, r) => sum + r.false_positives, 0);
        const totalFN = h.reduce((sum, r) => sum + r.false_negatives, 0);

        const tp = totalMatches - totalFP;
        const precision = tp + totalFP > 0 ? tp / (tp + totalFP) : 0;
        const recall = tp + totalFN > 0 ? tp / (tp + totalFN) : 0;

        return precision + recall > 0 ? (2 * (precision * recall)) / (precision + recall) : 0;
      };

      const f1First = calcF1(firstHalf);
      const f1Second = calcF1(secondHalf);

      if (f1First > 0) {
        const decayRate = (f1First - f1Second) / f1First;

        if (decayRate > 0.15) {
          let reason = "Rule effectiveness declining";
          if (decayRate > 0.3) reason = "Severe rule degradation detected";
          else if (decayRate > 0.5) reason = "Critical rule failure - immediate action required";

          decaying.push({
            ruleId,
            decay: decayRate,
            reason,
          });
        }
      }
    });

    return decaying.sort((a, b) => b.decay - a.decay);
  }

  private calculateHealthScore(performance: RulePerformance): number {
    // Weighted scoring
    const weights = {
      accuracy: 0.3,
      precision: 0.25,
      recall: 0.25,
      confidence: 0.2,
    };

    const score =
      performance.accuracy_rate * weights.accuracy * 100 +
      performance.precision * weights.precision * 100 +
      performance.recall * weights.recall * 100 +
      performance.avg_confidence * weights.confidence * 100;

    // Penalize for false positives/negatives
    const errorRate =
      (performance.false_positives + performance.false_negatives) /
      Math.max(performance.invocations, 1);
    const penalty = errorRate * 20; // Up to 20 point penalty

    return Math.max(0, Math.min(100, Math.round(score - penalty)));
  }

  private calculateTrend(
    history: RulePerformance[]
  ): "improving" | "stable" | "declining" | "volatile" {
    if (history.length < 5) return "stable";

    const recent = history.slice(-5);
    const scores = recent.map((h) => this.calculateHealthScore(h));

    // Calculate slope
    const n = scores.length;
    const sumX = recent.reduce((sum, _, i) => sum + i, 0);
    const sumY = scores.reduce((sum, s) => sum + s, 0);
    const sumXY = scores.reduce((sum, s, i) => sum + i * s, 0);
    const sumXX = recent.reduce((sum, _, i) => sum + i * i, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

    // Calculate volatility
    const avg = sumY / n;
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / n;
    const volatility = Math.sqrt(variance);

    if (volatility > 15) return "volatile";
    if (slope > 2) return "improving";
    if (slope < -2) return "declining";
    return "stable";
  }

  private generateRecommendation(performance: RulePerformance): RuleRecommendation | null {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let action: RuleRecommendation["action"] = "monitor";
    let priority: RuleRecommendation["priority"] = "low";

    // Analyze health score
    if (performance.health_score < 40) {
      action = "retire";
      priority = "urgent";
      issues.push(`Critical health score (${performance.health_score})`);
      suggestions.push("Consider rule retirement");
      suggestions.push("Implement replacement rule");
    } else if (performance.health_score < 60) {
      action = "refine";
      priority = "high";
      issues.push(`Poor health score (${performance.health_score})`);
      suggestions.push("Review rule logic");
      suggestions.push("Adjust thresholds");
    } else if (performance.health_score < 80) {
      action = "refine";
      priority = "medium";
      issues.push(`Declining health score (${performance.health_score})`);
      suggestions.push("Monitor closely");
      suggestions.push("Consider optimization");
    }

    // Analyze accuracy
    if (performance.accuracy_rate < 0.7) {
      issues.push(`Low accuracy (${(performance.accuracy_rate * 100).toFixed(1)}%)`);
      suggestions.push("Review match criteria");
    }

    // Analyze precision vs recall
    if (performance.precision < 0.7 && performance.recall > 0.8) {
      issues.push("High false positive rate");
      suggestions.push("Tighten match criteria");
      suggestions.push("Add additional validation");
    } else if (performance.recall < 0.7 && performance.precision > 0.8) {
      issues.push("High false negative rate");
      suggestions.push("Relax match criteria");
      suggestions.push("Consider fuzzy matching");
    }

    // Analyze trend
    if (performance.trend === "declining") {
      priority = priority === "low" ? "medium" : priority;
      issues.push("Performance declining");
      suggestions.push("Investigate data drift");
    } else if (performance.trend === "volatile") {
      issues.push("Inconsistent performance");
      suggestions.push("Analyze input data stability");
    }

    // Check for low usage
    if (performance.invocations < 10) {
      action = "monitor";
      issues.push("Low invocation count");
      suggestions.push("Evaluate rule necessity");
    }

    // High performer
    if (performance.health_score >= 90 && performance.trend === "stable") {
      action = "promote";
      priority = "low";
      issues.push("High performing rule");
      suggestions.push("Document as best practice");
      suggestions.push("Consider as template for new rules");
    }

    if (issues.length === 0) return null;

    return {
      rule_id: performance.rule_id,
      action,
      priority,
      reason: issues.join("; "),
      suggestions,
      expected_impact:
        action === "retire"
          ? "Eliminate poor quality matches"
          : action === "refine"
            ? `Improve health score by ~${Math.min(20, 100 - performance.health_score)} points`
            : action === "promote"
              ? "Standardize best practices"
              : "Maintain current performance",
    };
  }
}

export default RuleHealthScorer;
