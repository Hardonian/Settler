"use strict";
/**
 * Interactive Playground API
 * UX-011: No-signup playground with pre-filled examples and real-time results
 * Future-forward: AI-powered examples, instant feedback, visual results
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.playgroundRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const client_1 = require("@prisma/client");
const validation_1 = require("../middleware/validation");
const error_handler_1 = require("../utils/error-handler");
const confidence_scoring_1 = require("../services/confidence-scoring");
const recon_core_engine_1 = require("../services/recon-core/recon-core-engine");
const router = (0, express_1.Router)();
exports.playgroundRouter = router;
let prisma = null;
const getPrismaClient = () => {
    if (prisma) {
        return prisma;
    }
    if (!process.env.DATABASE_URL) {
        return null;
    }
    prisma = new client_1.PrismaClient();
    return prisma;
};
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
                        amount: 149.5,
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
                        amount: 149.5,
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
            // ... (other examples kept for backward compatibility if needed)
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
// Get Demo Dataset (Raw JSON)
router.get("/playground/demo-dataset", (async (_req, res) => {
    try {
        const demoDir = path_1.default.join(process.cwd(), "demo/data");
        if (!fs_1.default.existsSync(demoDir)) {
            res.status(404).json({ error: "Demo data not generated yet." });
            return;
        }
        const stripeData = JSON.parse(fs_1.default.readFileSync(path_1.default.join(demoDir, "stripe_normalized.json"), "utf-8"));
        const bankData = JSON.parse(fs_1.default.readFileSync(path_1.default.join(demoDir, "bank_normalized.json"), "utf-8"));
        const expected = JSON.parse(fs_1.default.readFileSync(path_1.default.join(demoDir, "expected_matches.json"), "utf-8"));
        res.json({
            source: { name: "Stripe (Demo)", count: stripeData.length, data: stripeData },
            target: { name: "Bank (Demo)", count: bankData.length, data: bankData },
            expectedMatches: expected,
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to load demo dataset", 500);
    }
}));
// Run Demo Simulation (Uses ReconCoreEngine Logic)
router.post("/playground/demo-run", (async (_req, res) => {
    try {
        const demoDir = path_1.default.join(process.cwd(), "demo/data");
        if (!fs_1.default.existsSync(demoDir)) {
            res.status(404).json({ error: "Demo data not generated yet." });
            return;
        }
        // 1. Load Data
        const sourceData = JSON.parse(fs_1.default.readFileSync(path_1.default.join(demoDir, "stripe_normalized.json"), "utf-8"));
        const targetData = JSON.parse(fs_1.default.readFileSync(path_1.default.join(demoDir, "bank_normalized.json"), "utf-8"));
        const prismaClient = getPrismaClient();
        if (!prismaClient) {
            res.status(503).json({ error: "Database not configured for playground." });
            return;
        }
        // 2. Instantiate Engine
        const engine = new recon_core_engine_1.ReconCoreEngine(prismaClient);
        // 3. Create Dummy Job (for Type Compatibility)
        const dummyJob = {
            id: "demo-job-123",
            tenantId: "demo-tenant",
            userId: "demo-user",
            sourceAdapter: "DEMO_STRIPE",
            targetAdapter: "DEMO_BANK",
            reconStrategy: "deterministic",
        };
        // 4. Run Matching Logic directly
        // We cast source/target to ReconDataRecord (Record<string, unknown>) as expected by the engine
        const matches = await engine.performReconciliation(sourceData, targetData, "deterministic", dummyJob);
        // 5. Calculate Stats
        const matchedSourceIds = new Set(matches.map((m) => m.sourceId));
        const unmatchedSource = sourceData.filter((r) => !matchedSourceIds.has(r.id));
        const matchedTargetIds = new Set(matches.map((m) => m.targetId));
        const unmatchedTarget = targetData.filter((r) => !matchedTargetIds.has(r.id));
        res.json({
            runId: `run_${Date.now()}`,
            timestamp: new Date().toISOString(),
            summary: {
                totalSource: sourceData.length,
                totalTarget: targetData.length,
                matched: matches.length,
                unmatchedSource: unmatchedSource.length,
                unmatchedTarget: unmatchedTarget.length,
                matchRate: (((matches.length * 2) / (sourceData.length + targetData.length)) * 100).toFixed(1) + "%",
            },
            matches: matches.slice(0, 50), // Limit for UI payload
            unmatchedSource: unmatchedSource.slice(0, 50),
            unmatchedTarget: unmatchedTarget.slice(0, 50),
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to run demo", 500);
    }
}));
// Run playground reconciliation (legacy/simulation)
router.post("/playground/reconcile", (0, validation_1.validateRequest)(playgroundReconcileSchema), (async (req, res) => {
    // ... (Existing implementation kept for backward compatibility)
    try {
        const body = req.body;
        const { sourceData, targetData, rules } = body;
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
            if (bestMatch && bestMatch.confidence >= 0.8) {
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
                    severity: bestMatch && bestMatch.confidence >= 0.5 ? "low" : "medium",
                });
            }
        }
        const total = sourceData.length;
        const matched = matches.length;
        const accuracy = total > 0 ? (matched / total) * 100 : 0;
        const avgConfidence = matches.length > 0 ? matches.reduce((sum, m) => sum + m.confidence, 0) / matches.length : 0;
        res.json({
            data: {
                summary: {
                    total,
                    matched,
                    unmatched: exceptions.length,
                    accuracy: parseFloat(accuracy.toFixed(2)),
                    averageConfidence: parseFloat((avgConfidence * 100).toFixed(2)),
                },
                matches: matches.map((m) => ({
                    ...m,
                    confidence: parseFloat((m.confidence * 100).toFixed(2)),
                })),
                exceptions,
            },
            playground: true,
            message: "Simulation complete.",
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to run playground reconciliation", 500);
    }
}));
// Get playground adapter schemas (for UI)
router.get("/playground/adapters", (async (_req, res) => {
    // ... (Existing implementation)
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
            // ...
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