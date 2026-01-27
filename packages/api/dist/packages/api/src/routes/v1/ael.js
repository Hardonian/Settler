"use strict";
/**
 * Autonomous Evolution Layer API Routes
 *
 * Part 7: Autonomous AIOS Evolution
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - PrismaClient is generated at build time
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - PrismaClient is generated at build time
const client_1 = require("@prisma/client");
const auth_1 = require("../../middleware/auth");
const tenant_1 = require("../../middleware/tenant");
const autonomous_evolution_layer_1 = require("../../services/ael/autonomous-evolution-layer");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
const ael = new autonomous_evolution_layer_1.AutonomousEvolutionLayer(prisma);
/**
 * GET /api/v1/ael/evolve
 * Run evolution cycle
 */
router.get('/evolve', auth_1.authMiddleware, tenant_1.tenantMiddleware, async (_req, res) => {
    try {
        const proposals = await ael.evolve();
        return res.json({
            data: proposals,
            message: 'Evolution cycle completed',
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return res.status(500).json({
            error: 'EvolutionError',
            message: errorMessage,
        });
    }
});
/**
 * GET /api/v1/ael/log
 * Get evolution log
 */
router.get('/log', auth_1.authMiddleware, tenant_1.tenantMiddleware, async (_req, res) => {
    try {
        const log = ael.getEvolutionLog();
        return res.json({
            data: log,
            message: 'Evolution log retrieved',
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return res.status(500).json({
            error: 'EvolutionError',
            message: errorMessage,
        });
    }
});
exports.default = router;
//# sourceMappingURL=ael.js.map