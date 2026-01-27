"use strict";
/**
 * Adapter Connection Testing Routes
 * E1: Test adapter connections before creating jobs
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.adapterTestRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const validation_1 = require("../middleware/validation");
const authorization_1 = require("../middleware/authorization");
const Permissions_1 = require("../infrastructure/security/Permissions");
const error_handler_1 = require("../utils/error-handler");
const adapter_connection_tester_1 = require("../services/adapter-connection-tester");
const router = (0, express_1.Router)();
exports.adapterTestRouter = router;
const testConnectionSchema = zod_1.z.object({
    body: zod_1.z.object({
        adapter: zod_1.z.string().min(1),
        config: zod_1.z.record(zod_1.z.unknown()),
    }),
});
// Test adapter connection
router.post("/adapters/:adapter/test", (0, authorization_1.requirePermission)(Permissions_1.Permission.WEBHOOKS_READ), (0, validation_1.validateRequest)(testConnectionSchema), async (req, res) => {
    try {
        const { adapter } = req.params;
        if (!adapter) {
            res.status(400).json({ error: "Adapter parameter required" });
            return;
        }
        const { config } = req.body;
        const result = await (0, adapter_connection_tester_1.testAdapterConnection)(adapter, config);
        if (result.success) {
            res.json({
                data: {
                    success: true,
                    latency: result.latency,
                    adapter: result.adapter,
                },
                message: "Connection test successful",
            });
        }
        else {
            res.status(400).json({
                data: {
                    success: false,
                    error: result.error,
                    latency: result.latency,
                    adapter: result.adapter,
                },
                message: "Connection test failed",
            });
        }
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to test adapter connection", 500, { userId: req.userId });
    }
});
//# sourceMappingURL=adapter-test.js.map