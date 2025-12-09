"use strict";
/**
 * Improvement Suggestion Engine
 * Automatically suggests product improvements based on insights
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.suggestImprovements = suggestImprovements;
exports.saveImprovementSuggestions = saveImprovementSuggestions;
const logger_1 = require("../../utils/logger");
const insight_aggregator_1 = require("./insight-aggregator");
const db_1 = require("../../db");
/**
 * Generate improvement suggestions based on insights
 */
async function suggestImprovements() {
    try {
        const insights = await (0, insight_aggregator_1.aggregateInsights)("week");
        const suggestions = [];
        // Analyze drop-off insights
        if (insights.trends.dropOff?.biggestDropOff) {
            const dropOff = insights.trends.dropOff.biggestDropOff;
            if (dropOff.step === "first_job" && dropOff.dropOffRate > 25) {
                suggestions.push({
                    type: "ux",
                    priority: "high",
                    description: "Add demo mode for first-time users to reduce drop-off at 'first_job' step",
                    impact: "high",
                    effort: "medium",
                    relatedIssues: [`${Math.round(dropOff.dropOffRate)}% drop-off at first_job`],
                    estimatedImpact: `Could reduce drop-off by ${Math.round(dropOff.dropOffRate * 0.3)}%`,
                });
            }
            if (dropOff.step === "first_reconciliation" && dropOff.dropOffRate > 30) {
                suggestions.push({
                    type: "ux",
                    priority: "high",
                    description: "Simplify reconciliation setup with guided wizard",
                    impact: "high",
                    effort: "medium",
                    relatedIssues: [`${Math.round(dropOff.dropOffRate)}% drop-off at first_reconciliation`],
                    estimatedImpact: `Could improve completion by ${Math.round(dropOff.dropOffRate * 0.2)}%`,
                });
            }
        }
        // Analyze friction points
        if (insights.trends.friction && insights.trends.friction.topIssue) {
            const friction = insights.trends.friction.topIssue;
            if (friction.severity === "high") {
                suggestions.push({
                    type: "bug_fix",
                    priority: "high",
                    description: `Fix high-frequency error: ${friction.issue}`,
                    impact: "high",
                    effort: friction.issue.toLowerCase().includes("timeout") ? "medium" : "low",
                    relatedIssues: [`${friction.frequency} occurrences`, friction.suggestedFix],
                    estimatedImpact: `Could reduce errors by ${Math.round(friction.frequency * 0.8)}`,
                });
            }
        }
        // Analyze error patterns
        if (insights.trends.errors.length > 0 && insights.trends.errors[0]) {
            const topError = insights.trends.errors[0];
            if (topError.severity === "high" && topError.count > 20) {
                suggestions.push({
                    type: "performance",
                    priority: "high",
                    description: `Optimize ${topError.pattern} error handling`,
                    impact: "high",
                    effort: "medium",
                    relatedIssues: [`${topError.count} occurrences`, topError.suggestedFix],
                    estimatedImpact: `Could reduce errors by ${Math.round(topError.count * 0.7)}`,
                });
            }
        }
        // Analyze feature dependencies
        if (insights.trends.dependencies.length > 0 && insights.trends.dependencies[0]) {
            const topDependency = insights.trends.dependencies[0];
            if (topDependency.correlation > 0.8) {
                suggestions.push({
                    type: "feature",
                    priority: "medium",
                    description: `Bundle ${topDependency.featureA} and ${topDependency.featureB} features (${Math.round(topDependency.correlation * 100)}% correlation)`,
                    impact: "medium",
                    effort: "low",
                    relatedIssues: [`${topDependency.sampleSize} users use both features`],
                    estimatedImpact: "Could improve feature discovery and usage",
                });
            }
        }
        // Analyze warnings
        const highWarnings = insights.trends.warnings.filter((w) => w.severity === "high");
        if (highWarnings.length > 10) {
            suggestions.push({
                type: "ux",
                priority: "high",
                description: `Implement automated intervention system for ${highWarnings.length} high-risk users`,
                impact: "high",
                effort: "medium",
                relatedIssues: [`${highWarnings.length} high-severity warnings`],
                estimatedImpact: "Could improve retention by 15-20%",
            });
        }
        // Sort by priority and impact
        suggestions.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            const impactOrder = { high: 3, medium: 2, low: 1 };
            if (priorityOrder[b.priority] !== priorityOrder[a.priority]) {
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            }
            return impactOrder[b.impact] - impactOrder[a.impact];
        });
        return suggestions;
    }
    catch (error) {
        (0, logger_1.logInfo)("Failed to suggest improvements", {
            error: error instanceof Error ? error.message : String(error),
        });
        return [];
    }
}
/**
 * Save improvement suggestions to database
 */
async function saveImprovementSuggestions(suggestions) {
    try {
        for (const suggestion of suggestions) {
            await (0, db_1.query)(`INSERT INTO improvement_suggestions (type, priority, description, impact, effort, related_issues, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT DO NOTHING`, [
                suggestion.type,
                suggestion.priority,
                suggestion.description,
                suggestion.impact,
                suggestion.effort,
                JSON.stringify(suggestion.relatedIssues),
            ]);
        }
        (0, logger_1.logInfo)("Improvement suggestions saved", { count: suggestions.length });
    }
    catch (error) {
        (0, logger_1.logInfo)("Failed to save improvement suggestions", {
            error: error instanceof Error ? error.message : String(error),
        });
    }
}
//# sourceMappingURL=improvement-suggester.js.map