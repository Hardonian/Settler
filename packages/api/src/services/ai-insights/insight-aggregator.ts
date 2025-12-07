/**
 * Insight Aggregation Service
 * Aggregates all AI-generated insights into actionable reports
 */

import { logInfo } from "../../utils/logger";
import { analyzeDropOffSteps, DropOffAnalysis } from "./dropoff-analyzer";
import { identifyFrictionPoints, FrictionAnalysis } from "./friction-detector";
import { analyzeErrorPatterns, ErrorPattern } from "./error-analyzer";
import { detectFeatureDependencies, FeatureDependency } from "./pattern-detector";
import { getAllWarningSignals, WarningSignal } from "./early-warning";

export interface InsightReport {
  period: "day" | "week" | "month";
  generatedAt: Date;
  summary: string;
  topIssues: Array<{
    type: string;
    description: string;
    severity: "low" | "medium" | "high";
    count?: number;
  }>;
  recommendations: string[];
  trends: {
    dropOff: DropOffAnalysis | null;
    friction: FrictionAnalysis | null;
    errors: ErrorPattern[];
    warnings: WarningSignal[];
    dependencies: FeatureDependency[];
  };
}

/**
 * Aggregate insights from all AI services
 */
export async function aggregateInsights(
  period: "day" | "week" | "month" = "week"
): Promise<InsightReport> {
  try {
    logInfo("Aggregating insights", { period });

    // Collect insights from all services
    const errorPeriod = period === "day" ? "day" : period === "week" ? "week" : "day";
    const [dropOff, friction, errors, warnings, dependencies] = await Promise.all([
      analyzeDropOffSteps("onboarding", period === "day" ? 1 : period === "week" ? 7 : 30),
      identifyFrictionPoints(period),
      analyzeErrorPatterns(errorPeriod),
      getAllWarningSignals(),
      detectFeatureDependencies(period === "day" ? 1 : period === "week" ? 7 : 30),
    ]);

    // Build top issues
    const topIssues: InsightReport["topIssues"] = [];

    // Top drop-off issue
    if (dropOff.biggestDropOff) {
      topIssues.push({
        type: "drop_off",
        description: `${Math.round(dropOff.biggestDropOff.dropOffRate)}% drop-off at "${dropOff.biggestDropOff.step}"`,
        severity:
          dropOff.biggestDropOff.dropOffRate > 50
            ? "high"
            : dropOff.biggestDropOff.dropOffRate > 30
              ? "medium"
              : "low",
        count: dropOff.biggestDropOff.droppedUsers,
      });
    }

    // Top friction point
    if (friction.topIssue) {
      topIssues.push({
        type: "friction",
        description: friction.topIssue.issue,
        severity: friction.topIssue.severity,
        count: friction.topIssue.frequency,
      });
    }

    // Top error pattern
    if (errors.length > 0 && errors[0]) {
      const topError = errors[0];
      topIssues.push({
        type: "error",
        description: topError.pattern,
        severity: topError.severity,
        count: topError.count,
      });
    }

    // High-severity warnings
    const highWarnings = warnings.filter((w) => w.severity === "high");
    if (highWarnings.length > 0) {
      topIssues.push({
        type: "warning",
        description: `${highWarnings.length} high-severity warning signals detected`,
        severity: "high",
        count: highWarnings.length,
      });
    }

    // Build recommendations
    const recommendations: string[] = [];

    // Add drop-off recommendations
    if (dropOff.suggestions.length > 0) {
      recommendations.push(...dropOff.suggestions);
    }

    // Add friction recommendations
    if (friction.frictionPoints.length > 0 && friction.frictionPoints[0]) {
      const topFriction = friction.frictionPoints[0];
      recommendations.push(
        `Fix friction point: ${topFriction.issue} - ${topFriction.suggestedFix}`
      );
    }

    // Add error recommendations
    if (errors.length > 0 && errors[0]) {
      const topError = errors[0];
      recommendations.push(`Address error pattern: ${topError.pattern} - ${topError.suggestedFix}`);
    }

    // Add warning recommendations
    if (highWarnings.length > 0) {
      recommendations.push(`Intervene with ${highWarnings.length} high-risk users immediately`);
    }

    // Generate summary
    const summary = `Insight report for ${period}: ${topIssues.length} top issues identified, ${recommendations.length} recommendations generated.`;

    return {
      period,
      generatedAt: new Date(),
      summary,
      topIssues,
      recommendations,
      trends: {
        dropOff,
        friction,
        errors,
        warnings,
        dependencies,
      },
    };
  } catch (error) {
    logInfo("Failed to aggregate insights", {
      period,
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      period,
      generatedAt: new Date(),
      summary: "Failed to generate insights",
      topIssues: [],
      recommendations: [],
      trends: {
        dropOff: null,
        friction: {
          timeWindow: period,
          frictionPoints: [],
          totalIssues: 0,
          topIssue: null,
          summary: "Failed to analyze",
        },
        errors: [],
        warnings: [],
        dependencies: [],
      },
    };
  }
}
