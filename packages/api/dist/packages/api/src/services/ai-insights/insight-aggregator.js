"use strict";
/**
 * Insight Aggregation Service
 * Aggregates all AI-generated insights into actionable reports
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.aggregateInsights = aggregateInsights;
const logger_1 = require("../../utils/logger");
const dropoff_analyzer_1 = require("./dropoff-analyzer");
const friction_detector_1 = require("./friction-detector");
const error_analyzer_1 = require("./error-analyzer");
const pattern_detector_1 = require("./pattern-detector");
const early_warning_1 = require("./early-warning");
/**
 * Aggregate insights from all AI services
 */
async function aggregateInsights(period = "week") {
    try {
        (0, logger_1.logInfo)("Aggregating insights", { period });
        // Collect insights from all services
        const errorPeriod = period === "day" ? "day" : period === "week" ? "week" : "day";
        const [dropOff, friction, errors, warnings, dependencies] = await Promise.all([
            (0, dropoff_analyzer_1.analyzeDropOffSteps)("onboarding", period === "day" ? 1 : period === "week" ? 7 : 30),
            (0, friction_detector_1.identifyFrictionPoints)(period),
            (0, error_analyzer_1.analyzeErrorPatterns)(errorPeriod),
            (0, early_warning_1.getAllWarningSignals)(),
            (0, pattern_detector_1.detectFeatureDependencies)(period === "day" ? 1 : period === "week" ? 7 : 30),
        ]);
        // Build top issues
        const topIssues = [];
        // Top drop-off issue
        if (dropOff.biggestDropOff) {
            topIssues.push({
                type: "drop_off",
                description: `${Math.round(dropOff.biggestDropOff.dropOffRate)}% drop-off at "${dropOff.biggestDropOff.step}"`,
                severity: dropOff.biggestDropOff.dropOffRate > 50
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
        const recommendations = [];
        // Add drop-off recommendations
        if (dropOff.suggestions.length > 0) {
            recommendations.push(...dropOff.suggestions);
        }
        // Add friction recommendations
        if (friction.frictionPoints.length > 0 && friction.frictionPoints[0]) {
            const topFriction = friction.frictionPoints[0];
            recommendations.push(`Fix friction point: ${topFriction.issue} - ${topFriction.suggestedFix}`);
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
    }
    catch (error) {
        (0, logger_1.logInfo)("Failed to aggregate insights", {
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
//# sourceMappingURL=insight-aggregator.js.map