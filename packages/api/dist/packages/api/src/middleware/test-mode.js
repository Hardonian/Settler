"use strict";
/**
 * Test Mode Middleware
 * UX-004: Test mode toggle - Sandbox environment for safe testing
 * Future-forward: Automatic test mode detection, sandbox isolation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkTestMode = checkTestMode;
exports.testModeMiddleware = testModeMiddleware;
exports.validateTestMode = validateTestMode;
const db_1 = require("../db");
/**
 * Check if user has test mode enabled
 */
async function checkTestMode(req) {
    if (!req.userId) {
        return false;
    }
    try {
        const users = await (0, db_1.query)(`SELECT COALESCE(test_mode_enabled, false) as test_mode_enabled
       FROM users WHERE id = $1`, [req.userId]);
        return users.length > 0 && users[0] ? (users[0].test_mode_enabled === true) : false;
    }
    catch {
        return false;
    }
}
/**
 * Test mode middleware - routes requests to sandbox environment
 */
async function testModeMiddleware(req, _res, next) {
    const authReq = req;
    if (!authReq.userId) {
        return next();
    }
    const isTestMode = await checkTestMode(authReq);
    if (isTestMode) {
        // Add test mode header
        req.headers["x-settler-test-mode"] = "true";
        // Modify adapter configs to use test/sandbox endpoints
        if (req.body?.source?.config) {
            req.body.source.config.testMode = true;
        }
        if (req.body?.target?.config) {
            req.body.target.config.testMode = true;
        }
        // Log test mode usage
        await (0, db_1.query)(`INSERT INTO events (user_id, event_name, properties)
       VALUES ($1, $2, $3)`, [
            authReq.userId,
            "TestModeUsed",
            JSON.stringify({
                path: req.path,
                method: req.method,
            }),
        ]).catch(() => {
            // Events table might not exist, ignore
        });
    }
    next();
}
/**
 * Validate test mode restrictions
 */
function validateTestMode(req, _res, next) {
    const isTestMode = req.headers["x-settler-test-mode"] === "true";
    if (isTestMode) {
        // Test mode restrictions
        // - No production API keys allowed
        // - Limited to test data
        // - Rate limits reduced
        if (req.body?.source?.config?.apiKey && !req.body.source.config.apiKey.includes("test")) {
            _res.status(400).json({
                error: {
                    code: "TEST_MODE_RESTRICTION",
                    message: "Test mode requires test API keys",
                    type: "ValidationError",
                    suggestion: "Use test API keys (e.g., sk_test_... for Stripe) in test mode",
                },
            });
            return;
        }
    }
    next();
}
//# sourceMappingURL=test-mode.js.map