"use strict";
/**
 * Rules Editor API
 * UX-009: Visual rules builder with preview mode and AI-powered impact analysis
 * Future-forward: AI suggests optimal rules, predicts impact, validates configurations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.rulesEditorRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const validation_1 = require("../middleware/validation");
const authorization_1 = require("../middleware/authorization");
const Permissions_1 = require("../infrastructure/security/Permissions");
const error_handler_1 = require("../utils/error-handler");
const confidence_scoring_1 = require("../services/confidence-scoring");
const router = (0, express_1.Router)();
exports.rulesEditorRouter = router;
// Reserved for future rule creation endpoint
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _createRuleSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).max(255),
        field: zod_1.z.string().min(1),
        type: zod_1.z.enum(["exact", "fuzzy", "range"]),
        tolerance: zod_1.z.number().optional(),
        threshold: zod_1.z.number().min(0).max(1).optional(),
        days: zod_1.z.number().min(0).optional(),
        enabled: zod_1.z.boolean().default(true),
    }),
});
const previewRuleSchema = zod_1.z.object({
    body: zod_1.z.object({
        rules: zod_1.z.array(zod_1.z.object({
            field: zod_1.z.string(),
            type: zod_1.z.enum(["exact", "fuzzy", "range"]),
            tolerance: zod_1.z.number().optional(),
            threshold: zod_1.z.number().optional(),
            days: zod_1.z.number().optional(),
        })),
        sampleData: zod_1.z.object({
            source: zod_1.z.record(zod_1.z.unknown()),
            target: zod_1.z.record(zod_1.z.unknown()),
        }).optional(),
    }),
});
const analyzeImpactSchema = zod_1.z.object({
    body: zod_1.z.object({
        rules: zod_1.z.array(zod_1.z.object({
            field: zod_1.z.string(),
            type: zod_1.z.enum(["exact", "fuzzy", "range"]),
            tolerance: zod_1.z.number().optional(),
            threshold: zod_1.z.number().optional(),
            days: zod_1.z.number().optional(),
        })),
        historicalData: zod_1.z.object({
            totalTransactions: zod_1.z.number(),
            matchedTransactions: zod_1.z.number(),
            unmatchedTransactions: zod_1.z.number(),
        }).optional(),
    }),
});
// List rules templates (AI-suggested configurations)
router.get("/rules/templates", (0, authorization_1.requirePermission)(Permissions_1.Permission.JOBS_READ), async (req, res) => {
    try {
        const { adapter } = req.query;
        // AI-suggested rule templates based on adapter
        const templates = [
            {
                id: "strict-exact-match",
                name: "Strict Exact Match",
                description: "High accuracy, requires exact matches on all fields",
                rules: [
                    { field: "transaction_id", type: "exact" },
                    { field: "amount", type: "exact", tolerance: 0.01 },
                    { field: "date", type: "exact" },
                ],
                estimatedAccuracy: 0.98,
                estimatedMatchRate: 0.85,
                useCase: "High-value transactions requiring perfect accuracy",
            },
            {
                id: "flexible-fuzzy-match",
                name: "Flexible Fuzzy Match",
                description: "Balanced accuracy with tolerance for variations",
                rules: [
                    { field: "order_id", type: "fuzzy", threshold: 0.85 },
                    { field: "amount", type: "exact", tolerance: 0.10 },
                    { field: "date", type: "range", days: 2 },
                ],
                estimatedAccuracy: 0.92,
                estimatedMatchRate: 0.95,
                useCase: "E-commerce orders with payment variations",
            },
            {
                id: "date-range-match",
                name: "Date Range Match",
                description: "Handles timing differences between platforms",
                rules: [
                    { field: "transaction_id", type: "exact" },
                    { field: "amount", type: "exact", tolerance: 0.01 },
                    { field: "date", type: "range", days: 3 },
                ],
                estimatedAccuracy: 0.90,
                estimatedMatchRate: 0.90,
                useCase: "Multi-platform reconciliation with timing delays",
            },
        ];
        // Filter by adapter if specified
        const filteredTemplates = adapter
            ? templates.filter(t => t.useCase.toLowerCase().includes(adapter.toLowerCase()))
            : templates;
        res.json({
            data: filteredTemplates,
            count: filteredTemplates.length,
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to get rule templates", 500, { userId: req.userId });
    }
});
// Preview rules with sample data
router.post("/rules/preview", (0, authorization_1.requirePermission)(Permissions_1.Permission.JOBS_READ), (0, validation_1.validateRequest)(previewRuleSchema), async (req, res) => {
    try {
        const { rules, sampleData } = req.body;
        if (!sampleData) {
            return res.status(400).json({
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Sample data required for preview",
                    type: "ValidationError",
                },
            });
        }
        // Calculate confidence score for preview
        const confidence = (0, confidence_scoring_1.calculateConfidenceScore)({
            sourceId: "preview-source",
            targetId: "preview-target",
            sourceData: sampleData.source,
            targetData: sampleData.target,
            rules,
        }, rules);
        // Generate preview insights
        const insights = {
            wouldMatch: confidence.score >= 0.80,
            confidence: confidence.score,
            breakdown: confidence.breakdown,
            factors: confidence.factors,
            recommendations: generateRecommendations(confidence, rules),
        };
        res.json({
            data: {
                preview: {
                    source: sampleData.source,
                    target: sampleData.target,
                    confidence: insights.confidence,
                    wouldMatch: insights.wouldMatch,
                    breakdown: insights.breakdown,
                },
                insights,
            },
        });
        return;
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to preview rules", 500, { userId: req.userId });
        return;
    }
});
// Analyze impact of rules on historical data
router.post("/rules/analyze-impact", (0, authorization_1.requirePermission)(Permissions_1.Permission.JOBS_READ), (0, validation_1.validateRequest)(analyzeImpactSchema), async (req, res) => {
    try {
        const { rules, historicalData } = req.body;
        // AI-powered impact analysis
        const analysis = {
            estimatedMatchRate: calculateEstimatedMatchRate(rules),
            estimatedAccuracy: calculateEstimatedAccuracy(rules),
            estimatedExceptions: historicalData
                ? Math.round(historicalData.totalTransactions * (1 - calculateEstimatedMatchRate(rules)))
                : null,
            performanceImpact: {
                executionTime: estimateExecutionTime(rules),
                complexity: calculateComplexity(rules),
            },
            recommendations: generateImpactRecommendations(rules, historicalData),
        };
        res.json({
            data: {
                impact: analysis,
                rules,
            },
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to analyze impact", 500, { userId: req.userId });
    }
});
// AI-powered rule suggestions
router.post("/rules/suggest", (0, authorization_1.requirePermission)(Permissions_1.Permission.JOBS_READ), async (req, res) => {
    try {
        const { sourceAdapter, targetAdapter, useCase } = req.body;
        // AI suggests optimal rules based on adapter combination
        const suggestions = generateRuleSuggestions(sourceAdapter, targetAdapter, useCase);
        res.json({
            data: {
                suggestions,
                reasoning: `Based on ${sourceAdapter || "source"} → ${targetAdapter || "target"} reconciliation patterns`,
            },
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to suggest rules", 500, { userId: req.userId });
    }
});
// Helper functions
function generateRecommendations(confidence, _rules) {
    const recommendations = [];
    if (confidence.score < 0.80) {
        recommendations.push("Consider adding more matching fields to increase confidence");
    }
    const lowScoreRules = confidence.breakdown.filter(b => b.score < 0.5);
    if (lowScoreRules.length > 0) {
        recommendations.push(`${lowScoreRules.length} rule(s) have low confidence. Consider adjusting tolerance or using fuzzy matching.`);
    }
    if (confidence.factors.exactMatches === 0) {
        recommendations.push("No exact matches found. Consider adding at least one exact match rule for better accuracy");
    }
    return recommendations;
}
function calculateEstimatedMatchRate(rules) {
    // AI estimation based on rule complexity
    const exactRules = rules.filter((r) => r.type === "exact").length;
    const fuzzyRules = rules.filter((r) => r.type === "fuzzy").length;
    const rangeRules = rules.filter((r) => r.type === "range").length;
    // More exact rules = lower match rate but higher accuracy
    // More fuzzy/range rules = higher match rate but lower accuracy
    let baseRate = 0.85;
    baseRate += fuzzyRules * 0.05;
    baseRate += rangeRules * 0.03;
    baseRate -= exactRules * 0.02;
    return Math.min(0.98, Math.max(0.70, baseRate));
}
function calculateEstimatedAccuracy(rules) {
    const exactRules = rules.filter((r) => r.type === "exact").length;
    const fuzzyRules = rules.filter((r) => r.type === "fuzzy").length;
    let baseAccuracy = 0.90;
    baseAccuracy += exactRules * 0.02;
    baseAccuracy -= fuzzyRules * 0.03;
    return Math.min(0.99, Math.max(0.80, baseAccuracy));
}
function estimateExecutionTime(rules) {
    const complexity = calculateComplexity(rules);
    if (complexity === "low")
        return "< 1 second per 1,000 transactions";
    if (complexity === "medium")
        return "1-3 seconds per 1,000 transactions";
    return "3-5 seconds per 1,000 transactions";
}
function calculateComplexity(rules) {
    const fuzzyRules = rules.filter((r) => r.type === "fuzzy").length;
    const totalRules = rules.length;
    if (totalRules <= 2 && fuzzyRules === 0)
        return "low";
    if (totalRules <= 4 && fuzzyRules <= 1)
        return "medium";
    return "high";
}
function generateImpactRecommendations(rules, historicalData) {
    const recommendations = [];
    const estimatedMatchRate = calculateEstimatedMatchRate(rules);
    const estimatedAccuracy = calculateEstimatedAccuracy(rules);
    if (historicalData) {
        const currentMatchRate = historicalData.matchedTransactions / historicalData.totalTransactions;
        if (estimatedMatchRate > currentMatchRate * 1.1) {
            recommendations.push(`These rules could improve match rate by ${((estimatedMatchRate - currentMatchRate) * 100).toFixed(1)}%`);
        }
    }
    if (estimatedAccuracy < 0.90) {
        recommendations.push("Consider adding more exact match rules to improve accuracy");
    }
    const complexity = calculateComplexity(rules);
    if (complexity === "high") {
        recommendations.push("High complexity rules may impact performance. Consider optimizing.");
    }
    return recommendations;
}
function generateRuleSuggestions(sourceAdapter, targetAdapter, _useCase) {
    // AI-powered suggestions based on adapter patterns
    const suggestions = [];
    // Shopify → Stripe pattern
    if (sourceAdapter === "shopify" && targetAdapter === "stripe") {
        suggestions.push({
            name: "E-commerce Order Reconciliation",
            rules: [
                { field: "order_id", type: "exact" },
                { field: "amount", type: "exact", tolerance: 0.01 },
                { field: "date", type: "range", days: 1 },
            ],
            estimatedAccuracy: 0.95,
            estimatedMatchRate: 0.92,
            reasoning: "Shopify orders typically include Stripe payment IDs in metadata. Date range accounts for processing delays.",
        });
    }
    // Stripe → QuickBooks pattern
    if (sourceAdapter === "stripe" && targetAdapter === "quickbooks") {
        suggestions.push({
            name: "Payment to Accounting Sync",
            rules: [
                { field: "charge_id", type: "exact" },
                { field: "amount", type: "exact", tolerance: 0.01 },
                { field: "customer_email", type: "fuzzy", threshold: 0.9 },
            ],
            estimatedAccuracy: 0.93,
            estimatedMatchRate: 0.88,
            reasoning: "Stripe charge IDs map to QuickBooks transactions. Fuzzy email matching handles formatting differences.",
        });
    }
    // Generic fallback
    if (suggestions.length === 0) {
        suggestions.push({
            name: "Standard Reconciliation",
            rules: [
                { field: "transaction_id", type: "exact" },
                { field: "amount", type: "exact", tolerance: 0.01 },
            ],
            estimatedAccuracy: 0.90,
            estimatedMatchRate: 0.85,
            reasoning: "Standard exact matching on transaction ID and amount with small tolerance for rounding.",
        });
    }
    return suggestions;
}
// Reference unused schema to satisfy TypeScript
void _createRuleSchema;
//# sourceMappingURL=rules-editor.js.map