"use strict";
/**
 * Interactive Playground API
 * UX-011: No-signup playground with pre-filled examples and real-time results
 * Future-forward: AI-powered examples, instant feedback, visual results
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.playgroundRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const validation_1 = require("../middleware/validation");
const error_handler_1 = require("../utils/error-handler");
const confidence_scoring_1 = require("../services/confidence-scoring");
const adapter_config_validator_1 = require("../utils/adapter-config-validator");
const router = (0, express_1.Router)();
exports.playgroundRouter = router;
// No auth required for playground (rate-limited)
const playgroundReconcileSchema = zod_1.z.object({
    body: zod_1.z.object({
        sourceAdapter: zod_1.z.string(),
        sourceData: zod_1.z.array(zod_1.z.record(zod_1.z.unknown())),
        targetAdapter: zod_1.z.string(),
        targetData: zod_1.z.array(zod_1.z.record(zod_1.z.unknown())),
        rules: zod_1.z.array(zod_1.z.object({
            field: zod_1.z.string(),
            type: zod_1.z.enum(["exact", "fuzzy", "range"]),
            tolerance: zod_1.z.number().optional(),
            threshold: zod_1.z.number().optional(),
            days: zod_1.z.number().optional(),
        })),
    }),
});
// Get playground examples (pre-filled)
router.get("/playground/examples", (async (_req, res) => {
    try {
        const examples = [
            {
                id: "shopify-stripe",
                name: "Shopify → Stripe Reconciliation",
                description: "Match Shopify orders with Stripe payments",
                sourceAdapter: "shopify",
                targetAdapter: "stripe",
                sourceData: [
                    {
                        order_id: "12345",
                        amount: 99.99,
                        currency: "USD",
                        date: "2026-01-15T10:00:00Z",
                        customer_email: "customer@example.com",
                    },
                    {
                        order_id: "12346",
                        amount: 149.50,
                        currency: "USD",
                        date: "2026-01-15T11:00:00Z",
                        customer_email: "customer2@example.com",
                    },
                ],
                targetData: [
                    {
                        charge_id: "ch_stripe_123",
                        amount: 99.99,
                        currency: "USD",
                        date: "2026-01-15T10:01:00Z",
                        metadata: { order_id: "12345" },
                    },
                    {
                        charge_id: "ch_stripe_124",
                        amount: 149.50,
                        currency: "USD",
                        date: "2026-01-15T11:01:00Z",
                        metadata: { order_id: "12346" },
                    },
                ],
                rules: [
                    { field: "order_id", type: "exact" },
                    { field: "amount", type: "exact", tolerance: 0.01 },
                    { field: "date", type: "range", days: 1 },
                ],
            },
            {
                id: "stripe-quickbooks",
                name: "Stripe → QuickBooks Sync",
                description: "Reconcile Stripe payments with QuickBooks transactions",
                sourceAdapter: "stripe",
                targetAdapter: "quickbooks",
                sourceData: [
                    {
                        charge_id: "ch_abc123",
                        amount: 199.99,
                        currency: "USD",
                        date: "2026-01-15T09:00:00Z",
                        customer_email: "customer@example.com",
                    },
                ],
                targetData: [
                    {
                        transaction_id: "QB_TXN_456",
                        amount: 199.99,
                        currency: "USD",
                        date: "2026-01-15T09:05:00Z",
                        customer_email: "customer@example.com",
                    },
                ],
                rules: [
                    { field: "charge_id", type: "exact" },
                    { field: "amount", type: "exact", tolerance: 0.01 },
                    { field: "customer_email", type: "fuzzy", threshold: 0.9 },
                ],
            },
            {
                id: "multi-currency",
                name: "Multi-Currency Reconciliation",
                description: "Match transactions in different currencies",
                sourceAdapter: "stripe",
                targetAdapter: "quickbooks",
                sourceData: [
                    {
                        charge_id: "ch_eur_123",
                        amount: 100.00,
                        currency: "EUR",
                        date: "2026-01-15T10:00:00Z",
                    },
                ],
                targetData: [
                    {
                        transaction_id: "QB_USD_456",
                        amount: 110.00,
                        currency: "USD",
                        date: "2026-01-15T10:00:00Z",
                    },
                ],
                rules: [
                    { field: "charge_id", type: "exact" },
                    { field: "amount", type: "exact", tolerance: 0.01 },
                ],
                fxConversion: {
                    enabled: true,
                    baseCurrency: "USD",
                    rate: 1.10,
                },
            },
        ];
        res.json({
            data: examples,
            count: examples.length,
        });
        return;
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to get playground examples", 500);
        return;
    }
}));
// Run playground reconciliation (no auth, rate-limited)
router.post("/playground/reconcile", (0, validation_1.validateRequest)(playgroundReconcileSchema), (async (req, res) => {
    try {
        const body = req.body;
        const { sourceAdapter, sourceData, targetAdapter, targetData, rules } = body;
        // Validate adapter configs (without actual API keys)
        try {
            (0, adapter_config_validator_1.validateAdapterConfig)(sourceAdapter, { apiKey: "test" });
            (0, adapter_config_validator_1.validateAdapterConfig)(targetAdapter, { apiKey: "test" });
        }
        catch (error) {
            res.status(400).json({
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Invalid adapter configuration",
                    type: "ValidationError",
                    details: error instanceof Error ? [{ field: "adapter", message: error.message, code: "INVALID_ADAPTER" }] : undefined,
                },
            });
        }
        // Run reconciliation simulation
        const matches = [];
        const exceptions = [];
        // Match source to target
        for (const source of sourceData) {
            let bestMatch = null;
            for (const target of targetData) {
                const confidence = (0, confidence_scoring_1.calculateConfidenceScore)({
                    sourceId: String(source.id || source.order_id || source.charge_id || "unknown"),
                    targetId: String(target.id || target.transaction_id || target.charge_id || "unknown"),
                    sourceData: source,
                    targetData: target,
                    rules: rules,
                }, rules);
                if (!bestMatch || confidence.score > bestMatch.confidence) {
                    bestMatch = {
                        target,
                        confidence: confidence.score,
                        breakdown: confidence.breakdown,
                    };
                }
            }
            if (bestMatch && bestMatch.confidence >= 0.80) {
                matches.push({
                    sourceId: String(source.id || source.order_id || source.charge_id || "unknown"),
                    targetId: String(bestMatch.target.id ||
                        bestMatch.target.transaction_id ||
                        bestMatch.target.charge_id ||
                        "unknown"),
                    confidence: bestMatch.confidence,
                    breakdown: bestMatch.breakdown,
                });
            }
            else {
                exceptions.push({
                    sourceId: String(source.id || source.order_id || source.charge_id || "unknown"),
                    reason: bestMatch
                        ? `Low confidence match (${(bestMatch.confidence * 100).toFixed(1)}%)`
                        : "No matching target found",
                    severity: bestMatch && bestMatch.confidence >= 0.50 ? "low" : "medium",
                });
            }
        }
        // Calculate summary
        const total = sourceData.length;
        const matched = matches.length;
        const unmatched = exceptions.length;
        const accuracy = total > 0 ? (matched / total) * 100 : 0;
        const avgConfidence = matches.length > 0
            ? matches.reduce((sum, m) => sum + m.confidence, 0) / matches.length
            : 0;
        res.json({
            data: {
                summary: {
                    total,
                    matched,
                    unmatched,
                    accuracy: parseFloat(accuracy.toFixed(2)),
                    averageConfidence: parseFloat((avgConfidence * 100).toFixed(2)),
                },
                matches: matches.map(m => ({
                    ...m,
                    confidence: parseFloat((m.confidence * 100).toFixed(2)),
                })),
                exceptions,
                visualization: {
                    matchRate: parseFloat(((matched / total) * 100).toFixed(2)),
                    confidenceDistribution: {
                        high: matches.filter(m => m.confidence >= 0.95).length,
                        medium: matches.filter(m => m.confidence >= 0.80 && m.confidence < 0.95).length,
                        low: matches.filter(m => m.confidence < 0.80).length,
                    },
                },
            },
            playground: true, // Indicates this is a playground result
            message: "This is a simulation. Sign up to run real reconciliations.",
        });
        return;
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to run playground reconciliation", 500);
        return;
    }
}));
// Get playground adapter schemas (for UI)
router.get("/playground/adapters", (async (_req, res) => {
    try {
        const adapters = [
            {
                id: "stripe",
                name: "Stripe",
                fields: ["charge_id", "amount", "currency", "date", "customer_email"],
                sampleData: {
                    charge_id: "ch_abc123",
                    amount: 99.99,
                    currency: "USD",
                    date: "2026-01-15T10:00:00Z",
                    customer_email: "customer@example.com",
                },
            },
            {
                id: "shopify",
                name: "Shopify",
                fields: ["order_id", "amount", "currency", "date", "customer_email"],
                sampleData: {
                    order_id: "12345",
                    amount: 99.99,
                    currency: "USD",
                    date: "2026-01-15T10:00:00Z",
                    customer_email: "customer@example.com",
                },
            },
            {
                id: "quickbooks",
                name: "QuickBooks",
                fields: ["transaction_id", "amount", "currency", "date", "customer_email"],
                sampleData: {
                    transaction_id: "QB_TXN_456",
                    amount: 99.99,
                    currency: "USD",
                    date: "2026-01-15T10:00:00Z",
                    customer_email: "customer@example.com",
                },
            },
        ];
        res.json({
            data: adapters,
            count: adapters.length,
        });
        return;
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to get playground adapters", 500);
        return;
    }
}));
//# sourceMappingURL=playground.js.map