"use strict";
/**
 * Middleware Setup Module
 * Extracts middleware configuration from index.ts for better organization
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupMiddlewareAndRoutes = setupMiddlewareAndRoutes;
const auth_1 = require("../middleware/auth");
const rate_limiter_1 = require("../utils/rate-limiter");
const test_mode_1 = require("../middleware/test-mode");
const idempotency_1 = require("../middleware/idempotency");
const versioning_1 = require("../middleware/versioning");
const csrf_1 = require("../middleware/csrf");
const profiling_1 = require("../infrastructure/observability/profiling");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const jobs_1 = require("./jobs");
const reports_1 = require("./reports");
const webhooks_1 = require("./webhooks");
const adapters_1 = require("./adapters");
const health_1 = require("./health");
const metrics_1 = require("./metrics");
const openapi_1 = require("./openapi");
const users_1 = require("./users");
const auth_2 = require("./auth");
const api_keys_1 = require("./api-keys");
const exceptions_1 = require("./exceptions");
const test_mode_2 = require("./test-mode");
const dashboards_1 = require("./dashboards");
const feedback_1 = require("./feedback");
const alerts_1 = require("./alerts");
const adapter_test_1 = require("./adapter-test");
const reports_enhanced_1 = require("./reports-enhanced");
const observability_1 = require("./observability");
const confidence_1 = require("./confidence");
const reconciliation_status_1 = require("./reconciliation-status");
const rules_editor_1 = require("./rules-editor");
const playground_1 = require("./playground");
const cli_wizard_1 = require("./cli-wizard");
const export_enhanced_1 = require("./export-enhanced");
const ai_assistant_1 = require("./ai-assistant");
const audit_trail_1 = require("./audit-trail");
const v1_1 = require("./v1");
const v2_1 = require("./v2");
const reconciliation_summary_1 = require("./reconciliation-summary");
const route_helpers_1 = require("./route-helpers");
/**
 * Setup all middleware and routes
 *
 * @param app - Express application instance
 */
function setupMiddlewareAndRoutes(app) {
    // Cookie parser (needed for CSRF protection)
    app.use((0, cookie_parser_1.default)());
    // Performance profiling middleware
    app.use(profiling_1.profilingMiddleware);
    // CSRF token setup (for web UI)
    app.use(csrf_1.setCsrfToken);
    // CSRF protection (for web UI state-changing operations)
    app.use(csrf_1.csrfProtection);
    // API versioning middleware
    app.use('/api', versioning_1.versionMiddleware);
    // Idempotency middleware for state-changing operations
    app.use('/api/v1', (0, idempotency_1.idempotencyMiddleware)());
    app.use('/api/v2', (0, idempotency_1.idempotencyMiddleware)());
    // Rate limiting per API key
    app.use('/api/v1', auth_1.authMiddleware, (0, rate_limiter_1.rateLimitMiddleware)());
    app.use('/api/v2', auth_1.authMiddleware, (0, rate_limiter_1.rateLimitMiddleware)());
    // Test mode middleware (after auth, before routes)
    app.use('/api/v1', auth_1.authMiddleware, test_mode_1.testModeMiddleware);
    app.use('/api/v2', auth_1.authMiddleware, test_mode_1.testModeMiddleware);
    app.use('/api/v1', auth_1.authMiddleware, test_mode_1.validateTestMode);
    app.use('/api/v2', auth_1.authMiddleware, test_mode_1.validateTestMode);
    // Health check (no auth required)
    app.use('/health', health_1.healthRouter);
    // Metrics endpoint (no auth required, but should be protected in production)
    app.use('/metrics', metrics_1.metricsRouter);
    // API Documentation (no auth required)
    app.use('/api/v1', openapi_1.openApiRouter);
    // CSRF token endpoint (for web UI)
    app.get('/api/csrf-token', csrf_1.getCsrfToken);
    // Auth routes (no auth required for login/refresh)
    app.use('/api/v1/auth', auth_2.authRouter);
    app.use('/api/v2/auth', auth_2.authRouter);
    // Mount versioned routes with auth middleware
    (0, route_helpers_1.mountVersionedRoutes)(app, '/jobs', jobs_1.jobsRouter, auth_1.authMiddleware);
    (0, route_helpers_1.mountVersionedRoutes)(app, '/reports', reports_1.reportsRouter, auth_1.authMiddleware);
    (0, route_helpers_1.mountVersionedRoutes)(app, '/webhooks', webhooks_1.webhooksRouter, auth_1.authMiddleware);
    (0, route_helpers_1.mountVersionedRoutes)(app, '/adapters', adapters_1.adaptersRouter, auth_1.authMiddleware);
    (0, route_helpers_1.mountVersionedRoutes)(app, '/users', users_1.usersRouter, auth_1.authMiddleware);
    (0, route_helpers_1.mountVersionedRoutes)(app, '/api-keys', api_keys_1.apiKeysRouter, auth_1.authMiddleware);
    (0, route_helpers_1.mountVersionedRoutes)(app, '/exceptions', exceptions_1.exceptionsRouter, auth_1.authMiddleware);
    (0, route_helpers_1.mountVersionedRoutes)(app, '/test-mode', test_mode_2.testModeRouter, auth_1.authMiddleware);
    (0, route_helpers_1.mountVersionedRoutes)(app, '/observability', observability_1.observabilityRouter, auth_1.authMiddleware);
    (0, route_helpers_1.mountVersionedRoutes)(app, '/dashboards', dashboards_1.dashboardsRouter, auth_1.authMiddleware);
    (0, route_helpers_1.mountVersionedRoutes)(app, '/feedback', feedback_1.feedbackRouter, auth_1.authMiddleware);
    (0, route_helpers_1.mountVersionedRoutes)(app, '/alerts', alerts_1.alertsRouter, auth_1.authMiddleware);
    (0, route_helpers_1.mountVersionedRoutes)(app, '/adapter-test', adapter_test_1.adapterTestRouter, auth_1.authMiddleware);
    (0, route_helpers_1.mountVersionedRoutes)(app, '/reports-enhanced', reports_enhanced_1.reportsEnhancedRouter, auth_1.authMiddleware);
    (0, route_helpers_1.mountVersionedRoutes)(app, '/confidence', confidence_1.confidenceRouter, auth_1.authMiddleware);
    (0, route_helpers_1.mountVersionedRoutes)(app, '/reconciliation-status', reconciliation_status_1.reconciliationStatusRouter, auth_1.authMiddleware);
    (0, route_helpers_1.mountVersionedRoutes)(app, '/rules-editor', rules_editor_1.rulesEditorRouter, auth_1.authMiddleware);
    (0, route_helpers_1.mountVersionedRoutes)(app, '/cli-wizard', cli_wizard_1.cliWizardRouter, auth_1.authMiddleware);
    (0, route_helpers_1.mountVersionedRoutes)(app, '/export-enhanced', export_enhanced_1.exportEnhancedRouter, auth_1.authMiddleware);
    (0, route_helpers_1.mountVersionedRoutes)(app, '/ai-assistant', ai_assistant_1.aiAssistantRouter, auth_1.authMiddleware);
    (0, route_helpers_1.mountVersionedRoutes)(app, '/audit-trail', audit_trail_1.auditTrailRouter, auth_1.authMiddleware);
    // Playground routes (no auth, rate-limited)
    app.use('/api/v1/playground', playground_1.playgroundRouter);
    app.use('/api/v2/playground', playground_1.playgroundRouter);
    // Versioned API routes
    app.use('/api/v1', auth_1.authMiddleware, v1_1.v1Router);
    app.use('/api/v2', auth_1.authMiddleware, v2_1.v2Router);
    // Optimized reconciliation summary endpoint
    app.use('/api/v1/reconciliations', auth_1.authMiddleware, reconciliation_summary_1.reconciliationSummaryRouter);
}
//# sourceMappingURL=middleware-setup.js.map