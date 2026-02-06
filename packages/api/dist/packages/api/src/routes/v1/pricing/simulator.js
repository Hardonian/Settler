"use strict";
/**
 * Pricing Simulator API Routes
 *
 * Part of Section 9: Pricing Intelligence
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../../middleware/auth");
const tenant_1 = require("../../../middleware/tenant");
const usage_simulator_1 = require("../../../services/pricing/usage-simulator");
const router = (0, express_1.Router)();
// Prisma client will be initialized at runtime
const prisma = {};
const simulator = new usage_simulator_1.UsageSimulator(prisma);
/**
 * GET /api/v1/pricing/simulator
 * Simulate usage and costs
 */
router.get('/', auth_1.authMiddleware, tenant_1.tenantMiddleware, async (req, res) => {
    try {
        const period = req.query.period || 'monthly';
        if (!req.tenantId) {
            return res.status(401).json({ error: 'Unauthorized', message: 'Tenant ID required' });
        }
        const simulation = await simulator.simulateUsage(req.tenantId, period);
        return res.json({
            data: simulation,
            message: 'Usage simulation generated',
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return res.status(500).json({
            error: 'SimulationError',
            message: errorMessage,
        });
    }
});
exports.default = router;
//# sourceMappingURL=simulator.js.map