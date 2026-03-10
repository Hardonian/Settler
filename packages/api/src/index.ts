import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { authMiddleware, AuthRequest } from "./middleware/auth";
import { tenantMiddleware } from "./middleware/tenant";
import { errorHandler } from "./middleware/error";
import { idempotencyMiddleware } from "./middleware/idempotency";
import { healthRouter } from "./routes/health";
import { metricsRouter } from "./routes/metrics";
import { openApiRouter } from "./routes/openapi";
import { authRouter } from "./routes/auth";
import { apiKeysRouter } from "./routes/api-keys";
import { exceptionsRouter } from "./routes/exceptions";
import { testModeRouter } from "./routes/test-mode";
import { dashboardsRouter } from "./routes/dashboards";
import { feedbackRouter } from "./routes/feedback";
import { alertsRouter } from "./routes/alerts";
import { adapterTestRouter } from "./routes/adapter-test";
import { reportsEnhancedRouter } from "./routes/reports-enhanced";
import { confidenceRouter } from "./routes/confidence";
import { reconciliationStatusRouter } from "./routes/reconciliation-status";
import { rulesEditorRouter } from "./routes/rules-editor";
import { playgroundRouter } from "./routes/playground";
import { cliWizardRouter } from "./routes/cli-wizard";
import { exportEnhancedRouter } from "./routes/export-enhanced";
import { aiAssistantRouter } from "./routes/ai-assistant";
import { auditTrailRouter } from "./routes/audit-trail";
import { tenantDataRouter } from "./routes/tenant-data";
import { webhookManagementRouter } from "./routes/webhook-management";
import { notificationsRouter } from "./routes/notifications";
import { usageRouter } from "./routes/usage";
import { platformControlPlaneRouter } from "./routes/platform-control-plane";
import { batchRouter } from "./routes/batch";
import { exportsRouter } from "./routes/exports";
import { testModeMiddleware, validateTestMode } from "./middleware/test-mode";
import { featureFlagsMiddleware } from "./middleware/feature-flags";
import { usageTrackingMiddleware } from "./middleware/usage-tracking";
import { rateLimitMiddleware } from "./utils/rate-limiter";
import { initDatabase } from "./db";
import { config } from "./config";
import { logInfo, logError, logWarn } from "./utils/logger";
import { v4 as uuidv4 } from "uuid";
import { startDataRetentionJob } from "./jobs/data-retention";
import { startMaterializedViewRefreshJob } from "./jobs/materialized-view-refresh";
import { processPendingWebhooks } from "./utils/webhook-queue";
import { versionMiddleware } from "./middleware/versioning";
import { v1Router } from "./routes/v1";
import { v2Router } from "./routes/v2";
import { reconciliationSummaryRouter } from "./routes/reconciliation-summary";
import { SecretsManager, REQUIRED_SECRETS } from "./infrastructure/security/SecretsManager";
import { initializeTracing } from "./infrastructure/observability/tracing";
import { compressionMiddleware, brotliCompressionMiddleware } from "./middleware/compression";
import { observabilityMiddleware } from "./middleware/observability";
import { eventTrackingMiddleware } from "./middleware/event-tracking";
import { setupSignalHandlers, registerShutdownHandler } from "./utils/graceful-shutdown";
import { requestTimeoutMiddleware, getRequestTimeout } from "./middleware/request-timeout";
import {
  initializeSentry,
  sentryRequestHandler,
  sentryTracingHandler,
  sentryErrorHandler,
} from "./middleware/sentry";
import { profilingMiddleware } from "./infrastructure/observability/profiling";
import { setCsrfToken, csrfProtection, getCsrfToken } from "./middleware/csrf";
import { sanitizeInput, sanitizeUrlParams } from "./middleware/input-sanitization";
import { validateStartup } from "./utils/startup-validation";
import cookieParser from "cookie-parser";
import { initializeWebSocket } from "./infrastructure/websocket";
import { createServer } from "http";
import { scanJsonDepth } from "./utils/json-depth";
import { emitOperatorRuntimeEvent } from "./services/ops-intelligence/runtime-events";

const app: Express = express();
const PORT = config.port;

// Initialize Sentry before other middleware
initializeSentry();

// Sentry request and tracing handlers (must be first)
app.use(sentryRequestHandler());
app.use(sentryTracingHandler());

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  })
);

app.use(
  cors({
    origin: config.allowedOrigins,
    credentials: true,
  })
);

// Compression middleware (Gzip and Brotli)
app.use(compressionMiddleware);
app.use(brotliCompressionMiddleware);

// Cookie parser (needed for CSRF protection)
app.use(cookieParser());

// Observability middleware (tracing, metrics, logging)
app.use(observabilityMiddleware);

// Performance profiling middleware
app.use(profilingMiddleware);

// CSRF token setup (for web UI)
app.use(setCsrfToken);

// CSRF protection (for web UI state-changing operations)
app.use(csrfProtection);

// Event tracking middleware (for analytics)
app.use("/api", eventTrackingMiddleware);

// Feature flags middleware (loads feature flags for each request)
app.use("/api", featureFlagsMiddleware());

// Usage tracking middleware (tracks API usage for billing)
app.use("/api", usageTrackingMiddleware());

// Request timeout middleware (must be before routes)
if (config.features.enableRequestTimeout) {
  app.use((req: Request, res: Response, next: NextFunction) => {
    const timeout = getRequestTimeout(req.path, req.method);
    return requestTimeoutMiddleware(timeout)(req, res, next);
  });
}

// Trace ID middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthRequest;
  const traceId = (req.headers["x-trace-id"] as string) || uuidv4();
  const executionId = (req.headers["x-execution-id"] as string) || uuidv4();
  authReq.traceId = traceId;
  authReq.executionId = executionId;
  authReq.tenantId = authReq.tenantId || (req.headers["x-tenant-id"] as string | undefined);
  res.setHeader("X-Trace-Id", traceId);
  res.setHeader("X-Execution-Id", executionId);
  if (authReq.tenantId) {
    res.setHeader("X-Tenant-Id", authReq.tenantId);
  }
  next();
});

// Runtime operator event stream (best-effort, non-blocking)
app.use((req: Request, res: Response, next: NextFunction) => {
  const startedAt = Date.now();
  res.on("finish", () => {
    const tenantId =
      (req as AuthRequest).tenantId || (req.headers["x-tenant-id"] as string | undefined);
    if (!tenantId || !req.path.startsWith("/api/")) return;

    void emitOperatorRuntimeEvent({
      eventType: "api_request",
      tenantId,
      recordsProcessed: 1,
      durationMs: Date.now() - startedAt,
      errorId: res.statusCode >= 500 ? (req as AuthRequest).traceId || null : null,
      metadata: {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
      },
    });

    if (res.statusCode >= 500) {
      void emitOperatorRuntimeEvent({
        eventType: "error_thrown",
        tenantId,
        errorId: (req as AuthRequest).traceId || null,
        metadata: { method: req.method, path: req.path, statusCode: res.statusCode },
      });
    }
  });
  next();
});

// Global IP-based rate limiting (backup)
const ipLimiter = rateLimit({
  windowMs: config.rateLimiting.windowMs,
  max: 1000, // Higher limit for legitimate users
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/", ipLimiter);

// Body parsing with size and depth limits
app.use(
  express.json({
    limit: "1mb", // Reduced from 10mb
    verify: (_req, _res, buf) => {
      try {
        const depth = scanJsonDepth(buf, { maxDepth: 20 });
        if (depth > 20) {
          throw new Error("JSON depth exceeds maximum of 20 levels");
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.message.includes("depth")) {
          throw error;
        }
        // Ignore JSON parse errors, let express handle them
      }
    },
  })
);

app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Initialize tracing
initializeTracing();

// Input sanitization middleware (defense-in-depth)
app.use(sanitizeInput);
app.use(sanitizeUrlParams);

// Validate secrets at startup (production and preview)
if (config.nodeEnv === "production" || config.nodeEnv === "preview") {
  try {
    SecretsManager.validateSecrets(REQUIRED_SECRETS);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logError("Secret validation failed", error, { message });
    process.exit(1);
  }
}

// Health check (no auth required)
app.use("/health", healthRouter);

// Metrics endpoint (no auth required, but should be protected in production)
app.use("/metrics", metricsRouter);

// API Documentation (no auth required)
app.use("/api/v1", openApiRouter);

// API versioning middleware
app.use("/api", versionMiddleware);

const v1ProtectedRouter = express.Router();
const v2ProtectedRouter = express.Router();

// Auth required routes (apply auth middleware once per request)
v1ProtectedRouter.use(authMiddleware);
v2ProtectedRouter.use(authMiddleware);

// Idempotency middleware for state-changing operations (requires auth)
v1ProtectedRouter.use(idempotencyMiddleware());
v2ProtectedRouter.use(idempotencyMiddleware());

// Rate limiting per API key
v1ProtectedRouter.use(rateLimitMiddleware());
v2ProtectedRouter.use(rateLimitMiddleware());

// Test mode middleware (after auth, before routes)
v1ProtectedRouter.use(testModeMiddleware);
v2ProtectedRouter.use(testModeMiddleware);
v1ProtectedRouter.use(validateTestMode);
v2ProtectedRouter.use(validateTestMode);

// Auth routes (no auth required for login/refresh)
app.use("/api/v1/auth", authRouter);
app.use("/api/v2/auth", authRouter);

// API Keys routes (requires auth)
v1ProtectedRouter.use(apiKeysRouter);
v2ProtectedRouter.use(apiKeysRouter);

// Exceptions routes (requires auth)
v1ProtectedRouter.use(exceptionsRouter);
v2ProtectedRouter.use(exceptionsRouter);

// Test mode routes (requires auth)
v1ProtectedRouter.use(testModeRouter);
v2ProtectedRouter.use(testModeRouter);

// Dashboard routes (requires auth)
v1ProtectedRouter.use(dashboardsRouter);
v2ProtectedRouter.use(dashboardsRouter);

// Feedback routes (requires auth)
v1ProtectedRouter.use(feedbackRouter);
v2ProtectedRouter.use(feedbackRouter);

// Alert routes (requires auth)
v1ProtectedRouter.use(alertsRouter);
v2ProtectedRouter.use(alertsRouter);

// Adapter test routes (requires auth)
v1ProtectedRouter.use(adapterTestRouter);
v2ProtectedRouter.use(adapterTestRouter);

// Enhanced reports routes (requires auth)
v1ProtectedRouter.use(reportsEnhancedRouter);
v2ProtectedRouter.use(reportsEnhancedRouter);

// Confidence score routes (requires auth)
v1ProtectedRouter.use(confidenceRouter);
v2ProtectedRouter.use(confidenceRouter);

// Reconciliation status routes (requires auth)
v1ProtectedRouter.use(reconciliationStatusRouter);
v2ProtectedRouter.use(reconciliationStatusRouter);

// Rules editor routes (requires auth)
v1ProtectedRouter.use(rulesEditorRouter);
v2ProtectedRouter.use(rulesEditorRouter);

// Playground routes (no auth, rate-limited)
app.use("/api/v1/playground", playgroundRouter);
app.use("/api/v2/playground", playgroundRouter);

// CSRF token endpoint (for web UI)
app.get("/api/csrf-token", getCsrfToken);

// CLI wizard routes (requires auth)
v1ProtectedRouter.use(cliWizardRouter);
v2ProtectedRouter.use(cliWizardRouter);

// Enhanced export routes (requires auth)
v1ProtectedRouter.use(exportEnhancedRouter);
v2ProtectedRouter.use(exportEnhancedRouter);

// AI assistant routes (requires auth)
v1ProtectedRouter.use(aiAssistantRouter);
v2ProtectedRouter.use(aiAssistantRouter);

// Audit trail routes (requires auth)
v1ProtectedRouter.use(auditTrailRouter);
v2ProtectedRouter.use(auditTrailRouter);

// Tenant data management routes (requires auth + tenant context)
v1ProtectedRouter.use("/tenant", tenantMiddleware, tenantDataRouter);
v2ProtectedRouter.use("/tenant", tenantMiddleware, tenantDataRouter);

// Webhook management routes (requires auth)
v1ProtectedRouter.use("/webhooks", webhookManagementRouter);
v2ProtectedRouter.use("/webhooks", webhookManagementRouter);

// Notification routes (requires auth)
v1ProtectedRouter.use("/notifications", notificationsRouter);
v2ProtectedRouter.use("/notifications", notificationsRouter);

// Usage tracking routes (requires auth)
v1ProtectedRouter.use("/usage", usageRouter);
v2ProtectedRouter.use("/usage", usageRouter);

// Batch processing routes (requires auth)
v1ProtectedRouter.use("/batch", batchRouter);
v2ProtectedRouter.use("/batch", batchRouter);

// Export routes (requires auth)
v1ProtectedRouter.use("/exports", exportsRouter);
v2ProtectedRouter.use("/exports", exportsRouter);

// Platform control plane routes (requires auth + tenant context)
v1ProtectedRouter.use("/tenant", tenantMiddleware, platformControlPlaneRouter);
v2ProtectedRouter.use("/tenant", tenantMiddleware, platformControlPlaneRouter);

// Versioned API routes
v1ProtectedRouter.use(v1Router);
v2ProtectedRouter.use(v2Router);

// Optimized reconciliation summary endpoint
v1ProtectedRouter.use("/reconciliations", reconciliationSummaryRouter);

app.use("/api/v1", v1ProtectedRouter);
app.use("/api/v2", v2ProtectedRouter);

// Sentry error handler (before custom error handler)
app.use(sentryErrorHandler());

// Error handling
app.use(errorHandler);

// 404 handler - always returns JSON with trace_id
app.use((req: Request, res: Response) => {
  const authReq = req as AuthRequest;
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
    const validation = await validateStartup();
    if (!validation.passed) {
      logError("Startup validation failed", undefined, { validation });
      if (config.nodeEnv === "production") {
        process.exit(1);
      } else {
        logWarn("Continuing despite validation failures (non-production mode)");
      }
    }

    await initDatabase();
    logInfo("Database initialized");

    // Start background jobs
    startDataRetentionJob();
    startMaterializedViewRefreshJob();

    // Process pending webhooks every minute
    const webhookInterval = setInterval(() => {
      processPendingWebhooks().catch((error) => {
        logError("Failed to process pending webhooks", error);
      });
    }, 60000);

    // Register webhook interval cleanup
    registerShutdownHandler(async () => {
      clearInterval(webhookInterval);
      logInfo("Webhook processing stopped");
    });

    const httpServer = createServer(app);

    // Initialize WebSocket server
    initializeWebSocket(httpServer);

    const server = httpServer.listen(PORT, () => {
      logInfo(`Settler API server running on port ${PORT}`, { port: PORT });
    });

    // Setup graceful shutdown handlers
    setupSignalHandlers(server, {
      timeout: 30000, // 30 seconds
      onShutdown: async () => {
        logInfo("Custom shutdown tasks completed");
      },
    });

    return server;
  } catch (error) {
    logError("Failed to start server", error);
    process.exit(1);
  }
}

// Start server
if (require.main === module) {
  startServer();
}

export default app;
