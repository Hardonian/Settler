"use strict";
/**
 * AI Assistant API
 * Future-forward: AI-powered assistance for reconciliation setup, troubleshooting, optimization
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiAssistantRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const validation_1 = require("../middleware/validation");
const authorization_1 = require("../middleware/authorization");
const Permissions_1 = require("../infrastructure/security/Permissions");
const error_handler_1 = require("../utils/error-handler");
const db_1 = require("../db");
const deterministic_ai_sandbox_1 = require("../services/ai-assistant/deterministic-ai-sandbox");
const router = (0, express_1.Router)();
exports.aiAssistantRouter = router;
const aiQuerySchema = zod_1.z.object({
    body: zod_1.z.object({
        query: zod_1.z.string().min(1).max(1000),
        modelProvider: zod_1.z.enum(["openai", "anthropic", "local", "mcp"]).optional(),
        model: zod_1.z.string().min(1).max(255).optional(),
        context: zod_1.z
            .object({
            jobId: zod_1.z.string().uuid().optional(),
            adapter: zod_1.z.string().optional(),
            error: zod_1.z.string().optional(),
        })
            .optional(),
    }),
});
// AI assistant chat endpoint
router.post("/ai/assistant", (0, authorization_1.requirePermission)(Permissions_1.Permission.JOBS_READ), (0, validation_1.validateRequest)(aiQuerySchema), async (req, res) => {
    try {
        const { query: userQuery, context } = req.body;
        const userId = req.userId;
        const tenantId = req.tenantId;
        const response = deterministic_ai_sandbox_1.deterministicAISandbox.execute({
            prompt: userQuery,
            context,
            preferredProvider: req.body.modelProvider,
            preferredModel: req.body.model,
        });
        await (0, db_1.query)(`INSERT INTO audit_logs (event, user_id, tenant_id, ip, user_agent, path, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`, [
            "ai_assistant_response_generated",
            userId,
            tenantId || null,
            req.ip || null,
            req.get("user-agent") || null,
            req.originalUrl,
            JSON.stringify({
                prompt: userQuery,
                provider: response.provider,
                model: response.model,
                responseHash: response.responseHash,
            }),
        ]);
        res.json({
            data: {
                query: userQuery,
                response: response.answer,
                model: response.model,
                provider: response.provider,
                responseHash: response.responseHash,
                suggestions: response.workflowSuggestions.map((item) => item.title),
                workflowSuggestions: response.workflowSuggestions,
                policyRecommendations: response.policyRecommendations,
                anomalies: response.anomalies,
            },
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to get AI assistant response", 500, {
            userId: req.userId,
        });
    }
});
// AI-powered optimization suggestions
router.get("/jobs/:jobId/ai-optimize", (0, authorization_1.requirePermission)(Permissions_1.Permission.JOBS_READ), async (req, res) => {
    try {
        const { jobId } = req.params;
        const userId = req.userId;
        const tenantId = req.tenantId;
        // Get job details — scoped by tenant_id
        const jobs = await (0, db_1.query)(`SELECT id, rules, source_adapter, target_adapter FROM jobs WHERE id = $1 AND user_id = $2 AND tenant_id = $3`, [jobId || null, userId, tenantId]);
        if (jobs.length === 0 || !jobs[0]) {
            res.status(404).json({ error: "Job not found" });
            return;
        }
        const job = jobs[0];
        // Get performance metrics
        const metrics = await (0, db_1.query)(`SELECT 
           AVG((summary->>'accuracy')::float) as avg_accuracy,
           AVG((SELECT AVG(confidence) FROM matches WHERE execution_id = e.id)) as avg_confidence,
           COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM exceptions WHERE execution_id = e.id))::float / NULLIF(COUNT(*), 0) as exception_rate,
           AVG((summary->>'matched')::int::float / NULLIF((summary->>'total')::int, 0)) as match_rate
         FROM executions e
         WHERE job_id = $1 AND tenant_id = $2`, [jobId || null, tenantId]);
        const m = metrics[0] || {
            avg_accuracy: 0,
            avg_confidence: 0,
            exception_rate: 0,
            match_rate: 0,
        };
        // Generate AI optimization suggestions
        const optimizations = generateOptimizationSuggestions(job, m);
        res.json({
            data: {
                jobId,
                currentMetrics: {
                    accuracy: m.avg_accuracy || 0,
                    confidence: m.avg_confidence || 0,
                    exceptionRate: m.exception_rate || 0,
                    matchRate: m.match_rate || 0,
                },
                optimizations,
            },
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to get AI optimization suggestions", 500, {
            userId: req.userId,
        });
    }
});
function generateOptimizationSuggestions(job, metrics) {
    const suggestions = [];
    // Low accuracy suggestions
    if (metrics.avg_accuracy < 0.9) {
        suggestions.push({
            type: "matching",
            priority: "high",
            title: "Improve Matching Accuracy",
            description: `Current accuracy is ${(metrics.avg_accuracy * 100).toFixed(1)}%. Consider adding more exact match rules.`,
            impact: "Could improve accuracy by 5-10%",
            action: "Add exact match rule for transaction_id or order_id",
        });
    }
    // Low confidence suggestions
    if (metrics.avg_confidence < 0.85) {
        suggestions.push({
            type: "rule",
            priority: "medium",
            title: "Increase Match Confidence",
            description: `Average confidence is ${(metrics.avg_confidence * 100).toFixed(1)}%. Review matching rules.`,
            impact: "Could improve confidence by 10-15%",
            action: "Add exact match rules or reduce tolerance values",
        });
    }
    // High exception rate
    if (metrics.exception_rate > 0.1) {
        suggestions.push({
            type: "tolerance",
            priority: "high",
            title: "Reduce Exception Rate",
            description: `Exception rate is ${(metrics.exception_rate * 100).toFixed(1)}%. Consider adjusting tolerance.`,
            impact: "Could reduce exceptions by 20-30%",
            action: "Increase amount tolerance or add date range matching",
        });
    }
    // Low match rate
    if (metrics.match_rate < 0.8) {
        suggestions.push({
            type: "matching",
            priority: "high",
            title: "Improve Match Rate",
            description: `Match rate is ${(metrics.match_rate * 100).toFixed(1)}%. Rules may be too strict.`,
            impact: "Could improve match rate by 10-20%",
            action: "Add fuzzy matching or increase date range tolerance",
        });
    }
    // Adapter-specific suggestions
    if (job.source_adapter === "shopify" && job.target_adapter === "stripe") {
        suggestions.push({
            type: "rule",
            priority: "low",
            title: "Optimize Shopify-Stripe Matching",
            description: "For Shopify-Stripe reconciliation, match on order_id from Stripe metadata.",
            impact: "Could improve accuracy by 5%",
            action: "Add exact match rule: field='order_id', type='exact'",
        });
    }
    return suggestions;
}
//# sourceMappingURL=ai-assistant.js.map