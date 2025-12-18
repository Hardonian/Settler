"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_1 = require("./middleware/auth");
const tenant_1 = require("./middleware/tenant");
const error_1 = require("./middleware/error");
const idempotency_1 = require("./middleware/idempotency");
const health_1 = require("./routes/health");
const metrics_1 = require("./routes/metrics");
const openapi_1 = require("./routes/openapi");
const auth_2 = require("./routes/auth");
const api_keys_1 = require("./routes/api-keys");
const exceptions_1 = require("./routes/exceptions");
const test_mode_1 = require("./routes/test-mode");
const dashboards_1 = require("./routes/dashboards");
const feedback_1 = require("./routes/feedback");
const alerts_1 = require("./routes/alerts");
const adapter_test_1 = require("./routes/adapter-test");
const reports_enhanced_1 = require("./routes/reports-enhanced");
const confidence_1 = require("./routes/confidence");
const reconciliation_status_1 = require("./routes/reconciliation-status");
const rules_editor_1 = require("./routes/rules-editor");
const playground_1 = require("./routes/playground");
const cli_wizard_1 = require("./routes/cli-wizard");
const export_enhanced_1 = require("./routes/export-enhanced");
const ai_assistant_1 = require("./routes/ai-assistant");
const audit_trail_1 = require("./routes/audit-trail");
const tenant_data_1 = require("./routes/tenant-data");
const webhook_management_1 = require("./routes/webhook-management");
const notifications_1 = require("./routes/notifications");
const usage_1 = require("./routes/usage");
const batch_1 = require("./routes/batch");
const exports_1 = require("./routes/exports");
const test_mode_2 = require("./middleware/test-mode");
const feature_flags_1 = require("./middleware/feature-flags");
const usage_tracking_1 = require("./middleware/usage-tracking");
const rate_limiter_1 = require("./utils/rate-limiter");
const db_1 = require("./db");
const config_1 = require("./config");
const logger_1 = require("./utils/logger");
const uuid_1 = require("uuid");
const data_retention_1 = require("./jobs/data-retention");
const materialized_view_refresh_1 = require("./jobs/materialized-view-refresh");
const webhook_queue_1 = require("./utils/webhook-queue");
const versioning_1 = require("./middleware/versioning");
const v1_1 = require("./routes/v1");
const v2_1 = require("./routes/v2");
const reconciliation_summary_1 = require("./routes/reconciliation-summary");
const SecretsManager_1 = require("./infrastructure/security/SecretsManager");
const tracing_1 = require("./infrastructure/observability/tracing");
const compression_1 = require("./middleware/compression");
const observability_1 = require("./middleware/observability");
const event_tracking_1 = require("./middleware/event-tracking");
const graceful_shutdown_1 = require("./utils/graceful-shutdown");
const request_timeout_1 = require("./middleware/request-timeout");
const sentry_1 = require("./middleware/sentry");
const profiling_1 = require("./infrastructure/observability/profiling");
const csrf_1 = require("./middleware/csrf");
const input_sanitization_1 = require("./middleware/input-sanitization");
const startup_validation_1 = require("./utils/startup-validation");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const websocket_1 = require("./infrastructure/websocket");
const http_1 = require("http");
const app = (0, express_1.default)();
const PORT = config_1.config.port;
// Initialize Sentry before other middleware
(0, sentry_1.initializeSentry)();
// Sentry request and tracing handlers (must be first)
app.use((0, sentry_1.sentryRequestHandler)());
app.use((0, sentry_1.sentryTracingHandler)());
// Security middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));
app.use((0, cors_1.default)({
    origin: config_1.config.allowedOrigins,
    credentials: true,
}));
// Compression middleware (Gzip and Brotli)
app.use(compression_1.compressionMiddleware);
app.use(compression_1.brotliCompressionMiddleware);
// Cookie parser (needed for CSRF protection)
app.use((0, cookie_parser_1.default)());
// Observability middleware (tracing, metrics, logging)
app.use(observability_1.observabilityMiddleware);
// Performance profiling middleware
app.use(profiling_1.profilingMiddleware);
// CSRF token setup (for web UI)
app.use(csrf_1.setCsrfToken);
// CSRF protection (for web UI state-changing operations)
app.use(csrf_1.csrfProtection);
// Event tracking middleware (for analytics)
app.use("/api", event_tracking_1.eventTrackingMiddleware);
// Feature flags middleware (loads feature flags for each request)
app.use("/api", (0, feature_flags_1.featureFlagsMiddleware)());
// Usage tracking middleware (tracks API usage for billing)
app.use("/api", (0, usage_tracking_1.usageTrackingMiddleware)());
// Request timeout middleware (must be before routes)
if (config_1.config.features.enableRequestTimeout) {
    app.use((req, res, next) => {
        const timeout = (0, request_timeout_1.getRequestTimeout)(req.path, req.method);
        return (0, request_timeout_1.requestTimeoutMiddleware)(timeout)(req, res, next);
    });
}
// Trace ID middleware
app.use((req, res, next) => {
    const traceId = req.headers['x-trace-id'] || (0, uuid_1.v4)();
    req.traceId = traceId;
    res.setHeader('X-Trace-Id', traceId);
    next();
});
// Global IP-based rate limiting (backup)
const ipLimiter = (0, express_rate_limit_1.default)({
    windowMs: config_1.config.rateLimiting.windowMs,
    max: 1000, // Higher limit for legitimate users
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
});
app.use("/api/", ipLimiter);
// Body parsing with size and depth limits
function countDepth(obj, current = 0) {
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
        return current;
    }
    const depths = Object.values(obj).map(v => countDepth(v, current + 1));
    return Math.max(current, ...depths);
}
app.use(express_1.default.json({
    limit: "1mb", // Reduced from 10mb
    verify: (_req, _res, buf) => {
        try {
            const parsed = JSON.parse(buf.toString());
            const depth = countDepth(parsed);
            if (depth > 20) {
                throw new Error('JSON depth exceeds maximum of 20 levels');
            }
        }
        catch (error) {
            if (error instanceof Error && error.message.includes('depth')) {
                throw error;
            }
            // Ignore JSON parse errors, let express handle them
        }
    },
}));
app.use(express_1.default.urlencoded({ extended: true, limit: "1mb" }));
// Initialize tracing
(0, tracing_1.initializeTracing)();
// Input sanitization middleware (defense-in-depth)
app.use(input_sanitization_1.sanitizeInput);
app.use(input_sanitization_1.sanitizeUrlParams);
// Validate secrets at startup (production and preview)
if (config_1.config.nodeEnv === 'production' || config_1.config.nodeEnv === 'preview') {
    try {
        SecretsManager_1.SecretsManager.validateSecrets(SecretsManager_1.REQUIRED_SECRETS);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Secret validation failed:', message);
        process.exit(1);
    }
}
// Health check (no auth required)
app.use("/health", health_1.healthRouter);
// Metrics endpoint (no auth required, but should be protected in production)
app.use("/metrics", metrics_1.metricsRouter);
// API Documentation (no auth required)
app.use("/api/v1", openapi_1.openApiRouter);
// API versioning middleware
app.use("/api", versioning_1.versionMiddleware);
// Idempotency middleware for state-changing operations
app.use("/api/v1", (0, idempotency_1.idempotencyMiddleware)());
app.use("/api/v2", (0, idempotency_1.idempotencyMiddleware)());
// Rate limiting per API key
app.use("/api/v1", auth_1.authMiddleware, (0, rate_limiter_1.rateLimitMiddleware)());
app.use("/api/v2", auth_1.authMiddleware, (0, rate_limiter_1.rateLimitMiddleware)());
// Test mode middleware (after auth, before routes)
app.use("/api/v1", auth_1.authMiddleware, test_mode_2.testModeMiddleware);
app.use("/api/v2", auth_1.authMiddleware, test_mode_2.testModeMiddleware);
app.use("/api/v1", auth_1.authMiddleware, test_mode_2.validateTestMode);
app.use("/api/v2", auth_1.authMiddleware, test_mode_2.validateTestMode);
// Auth routes (no auth required for login/refresh)
app.use("/api/v1/auth", auth_2.authRouter);
app.use("/api/v2/auth", auth_2.authRouter);
// API Keys routes (requires auth)
app.use("/api/v1", auth_1.authMiddleware, api_keys_1.apiKeysRouter);
app.use("/api/v2", auth_1.authMiddleware, api_keys_1.apiKeysRouter);
// Exceptions routes (requires auth)
app.use("/api/v1", auth_1.authMiddleware, exceptions_1.exceptionsRouter);
app.use("/api/v2", auth_1.authMiddleware, exceptions_1.exceptionsRouter);
// Test mode routes (requires auth)
app.use("/api/v1", auth_1.authMiddleware, test_mode_1.testModeRouter);
app.use("/api/v2", auth_1.authMiddleware, test_mode_1.testModeRouter);
// Dashboard routes (requires auth)
app.use("/api/v1", auth_1.authMiddleware, dashboards_1.dashboardsRouter);
app.use("/api/v2", auth_1.authMiddleware, dashboards_1.dashboardsRouter);
// Feedback routes (requires auth)
app.use("/api/v1", auth_1.authMiddleware, feedback_1.feedbackRouter);
app.use("/api/v2", auth_1.authMiddleware, feedback_1.feedbackRouter);
// Alert routes (requires auth)
app.use("/api/v1", auth_1.authMiddleware, alerts_1.alertsRouter);
app.use("/api/v2", auth_1.authMiddleware, alerts_1.alertsRouter);
// Adapter test routes (requires auth)
app.use("/api/v1", auth_1.authMiddleware, adapter_test_1.adapterTestRouter);
app.use("/api/v2", auth_1.authMiddleware, adapter_test_1.adapterTestRouter);
// Enhanced reports routes (requires auth)
app.use("/api/v1", auth_1.authMiddleware, reports_enhanced_1.reportsEnhancedRouter);
app.use("/api/v2", auth_1.authMiddleware, reports_enhanced_1.reportsEnhancedRouter);
// Confidence score routes (requires auth)
app.use("/api/v1", auth_1.authMiddleware, confidence_1.confidenceRouter);
app.use("/api/v2", auth_1.authMiddleware, confidence_1.confidenceRouter);
// Reconciliation status routes (requires auth)
app.use("/api/v1", auth_1.authMiddleware, reconciliation_status_1.reconciliationStatusRouter);
app.use("/api/v2", auth_1.authMiddleware, reconciliation_status_1.reconciliationStatusRouter);
// Rules editor routes (requires auth)
app.use("/api/v1", auth_1.authMiddleware, rules_editor_1.rulesEditorRouter);
app.use("/api/v2", auth_1.authMiddleware, rules_editor_1.rulesEditorRouter);
// Playground routes (no auth, rate-limited)
app.use("/api/v1/playground", playground_1.playgroundRouter);
app.use("/api/v2/playground", playground_1.playgroundRouter);
// CSRF token endpoint (for web UI)
app.get("/api/csrf-token", csrf_1.getCsrfToken);
// CLI wizard routes (requires auth)
app.use("/api/v1", auth_1.authMiddleware, cli_wizard_1.cliWizardRouter);
app.use("/api/v2", auth_1.authMiddleware, cli_wizard_1.cliWizardRouter);
// Enhanced export routes (requires auth)
app.use("/api/v1", auth_1.authMiddleware, export_enhanced_1.exportEnhancedRouter);
app.use("/api/v2", auth_1.authMiddleware, export_enhanced_1.exportEnhancedRouter);
// AI assistant routes (requires auth)
app.use("/api/v1", auth_1.authMiddleware, ai_assistant_1.aiAssistantRouter);
app.use("/api/v2", auth_1.authMiddleware, ai_assistant_1.aiAssistantRouter);
// Audit trail routes (requires auth)
app.use("/api/v1", auth_1.authMiddleware, audit_trail_1.auditTrailRouter);
app.use("/api/v2", auth_1.authMiddleware, audit_trail_1.auditTrailRouter);
// Tenant data management routes (requires auth + tenant context)
app.use("/api/v1/tenant", auth_1.authMiddleware, tenant_1.tenantMiddleware, tenant_data_1.tenantDataRouter);
app.use("/api/v2/tenant", auth_1.authMiddleware, tenant_1.tenantMiddleware, tenant_data_1.tenantDataRouter);
// Webhook management routes (requires auth)
app.use("/api/v1/webhooks", auth_1.authMiddleware, webhook_management_1.webhookManagementRouter);
app.use("/api/v2/webhooks", auth_1.authMiddleware, webhook_management_1.webhookManagementRouter);
// Notification routes (requires auth)
app.use("/api/v1/notifications", auth_1.authMiddleware, notifications_1.notificationsRouter);
app.use("/api/v2/notifications", auth_1.authMiddleware, notifications_1.notificationsRouter);
// Usage tracking routes (requires auth)
app.use("/api/v1/usage", auth_1.authMiddleware, usage_1.usageRouter);
app.use("/api/v2/usage", auth_1.authMiddleware, usage_1.usageRouter);
// Batch processing routes (requires auth)
app.use("/api/v1/batch", auth_1.authMiddleware, batch_1.batchRouter);
app.use("/api/v2/batch", auth_1.authMiddleware, batch_1.batchRouter);
// Export routes (requires auth)
app.use("/api/v1/exports", auth_1.authMiddleware, exports_1.exportsRouter);
app.use("/api/v2/exports", auth_1.authMiddleware, exports_1.exportsRouter);
// Versioned API routes
app.use("/api/v1", auth_1.authMiddleware, v1_1.v1Router);
app.use("/api/v2", auth_1.authMiddleware, v2_1.v2Router);
// Optimized reconciliation summary endpoint
app.use("/api/v1/reconciliations", auth_1.authMiddleware, reconciliation_summary_1.reconciliationSummaryRouter);
// Sentry error handler (before custom error handler)
app.use((0, sentry_1.sentryErrorHandler)());
// Error handling
app.use(error_1.errorHandler);
// 404 handler - always returns JSON with trace_id
app.use((req, res) => {
    const authReq = req;
    res.status(404).json({
        error: "Not Found",
        errorCode: "NOT_FOUND",
        message: `Cannot ${req.method} ${req.path}`,
        traceId: authReq.traceId,
        timestamp: new Date().toISOString(),
    });
});
// Initialize database on startup
async function startServer() {
    try {
        // Run startup validations
        const validation = await (0, startup_validation_1.validateStartup)();
        if (!validation.passed) {
            (0, logger_1.logError)('Startup validation failed', undefined, { validation });
            if (config_1.config.nodeEnv === 'production') {
                process.exit(1);
            }
            else {
                (0, logger_1.logWarn)('Continuing despite validation failures (non-production mode)');
            }
        }
        await (0, db_1.initDatabase)();
        (0, logger_1.logInfo)('Database initialized');
        // Start background jobs
        (0, data_retention_1.startDataRetentionJob)();
        (0, materialized_view_refresh_1.startMaterializedViewRefreshJob)();
        // Process pending webhooks every minute
        const webhookInterval = setInterval(() => {
            (0, webhook_queue_1.processPendingWebhooks)().catch(error => {
                (0, logger_1.logError)('Failed to process pending webhooks', error);
            });
        }, 60000);
        // Register webhook interval cleanup
        (0, graceful_shutdown_1.registerShutdownHandler)(async () => {
            clearInterval(webhookInterval);
            (0, logger_1.logInfo)('Webhook processing stopped');
        });
        const httpServer = (0, http_1.createServer)(app);
        // Initialize WebSocket server
        (0, websocket_1.initializeWebSocket)(httpServer);
        const server = httpServer.listen(PORT, () => {
            (0, logger_1.logInfo)(`Settler API server running on port ${PORT}`, { port: PORT });
        });
        // Setup graceful shutdown handlers
        (0, graceful_shutdown_1.setupSignalHandlers)(server, {
            timeout: 30000, // 30 seconds
            onShutdown: async () => {
                (0, logger_1.logInfo)('Custom shutdown tasks completed');
            },
        });
        return server;
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
// Start server
if (require.main === module) {
    startServer();
}
exports.default = app;
//# sourceMappingURL=index.js.map