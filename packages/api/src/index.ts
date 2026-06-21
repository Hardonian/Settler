import express, { Express, Request, Response, NextFunction, Router } from "express";
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
import { exceptionDetailsRouter } from "./routes/exception-details";
import { exceptionIntelligenceRouter } from "./routes/exception-intelligence";
import { testModeRouter } from "./routes/test-mode";
import { dashboardsRouter } from "./routes/dashboards";
import { feedbackRouter } from "./routes/feedback";
import { alertsRouter } from "./routes/alerts";
import { adapterTestRouter } from "./routes/adapter-test";
import { reportsEnhancedRouter } from "./routes/reports-enhanced";
import { confidenceRouter } from "./routes/confidence";
import { reconciliationStatusRouter } from "./routes/reconciliation-status";
import { rulesEditorRouter } from "./routes/rules-editor";
import { runsRouter } from "./routes/runs";
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
import { retentionRouter } from "./routes/retention";
import { workerHealthRouter } from "./routes/worker-health";
import { npsRouter } from "./routes/nps";
// telemetryRouter removed — orphaned dead code with broken imports (SEC-AUDIT-001)
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
import { logDistributedGuardStartupSummary } from "./services/distributed-guards";
import { startDistributedGuardsMaintenanceJob } from "./jobs/distributed-guards-maintenance";
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
import {
  getLedgerService,
  isLedgerEnabled,
  isLedgerUsingFallback,
  getLedgerDisabledReason,
} from "./domain/services/LedgerService";
import {
  setReconciliationCollisionLogger,
  type UuidCollisionLogInput,
} from "@settler/reconciliation-core";

const app: Express = express();
app.set("trust proxy", 1); // Trust first proxy (load balancer) for correct client IP
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
  const requestId = (req.headers["x-request-id"] as string) || uuidv4();
  const executionId = (req.headers["x-execution-id"] as string) || uuidv4();
  authReq.traceId = traceId;
  authReq.requestId = requestId;
  authReq.executionId = executionId;
  authReq.tenantId = authReq.tenantId || (req.headers["x-tenant-id"] as string | undefined);
  res.setHeader("X-Trace-Id", traceId);
  res.setHeader("X-Request-Id", requestId);
  res.setHeader("X-Execution-Id", executionId);
  // SEC-10: Tenant ID is set on the request for internal use but NOT
  // reflected in response headers to prevent identifier enumeration.
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

// Metrics endpoint — restricted to localhost in production (SEC-05)
app.use(
  "/metrics",
  (req: Request, res: Response, next: NextFunction) => {
    if (config.nodeEnv === "production" || config.nodeEnv === "preview") {
      const ip = req.ip || req.socket.remoteAddress || "";
      const isLocal = ip === "127.0.0.1" || ip === "::1" || ip === "::ffff:127.0.0.1";
      if (!isLocal) {
        res.status(403).json({ error: "Forbidden", message: "Metrics endpoint is internal only" });
        return;
      }
    }
    next();
  },
  metricsRouter
);

// API Documentation (no auth required)
app.use("/api/v1", openApiRouter);

// API versioning middleware
app.use("/api", versionMiddleware);

interface ProtectedRouterOptions {
  versionRouter: Router;
  includeReconciliationSummary?: boolean;
}

function configureProtectedRouter(router: Router, options: ProtectedRouterOptions): void {
  // Auth required routes (apply auth middleware once per request)
  router.use(authMiddleware);

  // Idempotency middleware for state-changing operations (requires auth)
  router.use(idempotencyMiddleware());

  // Rate limiting per API key
  router.use(rateLimitMiddleware());

  // Test mode middleware (after auth, before routes)
  router.use(testModeMiddleware);
  router.use(validateTestMode);

  // Shared protected routes
  router.use(apiKeysRouter);
  router.use(exceptionsRouter);
  router.use(exceptionDetailsRouter);
  router.use(exceptionIntelligenceRouter);
  router.use(testModeRouter);
  router.use(dashboardsRouter);
  router.use(feedbackRouter);
  router.use(alertsRouter);
  router.use(adapterTestRouter);
  router.use(reportsEnhancedRouter);
  router.use(confidenceRouter);
  router.use(reconciliationStatusRouter);
  router.use(rulesEditorRouter);
  router.use("/runs", runsRouter);
  router.use(cliWizardRouter);
  router.use(exportEnhancedRouter);
  router.use(aiAssistantRouter);
  router.use(auditTrailRouter);
  router.use("/tenant", tenantMiddleware, tenantDataRouter);
  router.use("/webhooks", webhookManagementRouter);
  router.use("/notifications", notificationsRouter);
  router.use("/usage", usageRouter);
  router.use("/batch", batchRouter);
  router.use("/exports", exportsRouter);
  router.use("/retention", retentionRouter);
  router.use("/worker", workerHealthRouter);
  router.use("/tenant", tenantMiddleware, platformControlPlaneRouter);

  // Version-specific routes
  router.use(options.versionRouter);

  if (options.includeReconciliationSummary) {
    // Optimized reconciliation summary endpoint
    router.use("/reconciliations", reconciliationSummaryRouter);
  }
}

const v1ProtectedRouter = express.Router();
const v2ProtectedRouter = express.Router();

configureProtectedRouter(v1ProtectedRouter, {
  versionRouter: v1Router,
  includeReconciliationSummary: true,
});
configureProtectedRouter(v2ProtectedRouter, {
  versionRouter: v2Router,
});

// Auth routes (no auth required for login/refresh)
// SEC-04: Strict brute-force rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window per IP
  message: "Too many authentication attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || "unknown",
});
app.use("/api/v1/auth", authLimiter, authRouter);
app.use("/api/v2/auth", authLimiter, authRouter);

// Playground routes (no auth, strict rate-limited)
const playgroundLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // 30 requests per 15 minutes per IP
  message: "Too many playground requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/v1/playground", playgroundLimiter, playgroundRouter);
app.use("/api/v2/playground", playgroundLimiter, playgroundRouter);

// CSRF token endpoint (for web UI)
app.get("/api/csrf-token", getCsrfToken);

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

    setReconciliationCollisionLogger((entry: UuidCollisionLogInput) => {
      logWarn("reconciliation_uuid_collision", {
        event: "reconciliation_uuid_collision",
        tenant_id: entry.tenantId,
        duplicate_uuid: entry.duplicateUuid,
        recon_job_id: entry.reconJobId,
        reconciliation_run_id: entry.reconciliationRunId,
      });
    });

    // Initialize Ledger Service (with graceful fallback)
    // This allows the app to boot even if TigerBeetle is not available
    getLedgerService();
    if (isLedgerEnabled()) {
      logInfo("Ledger: TigerBeetle is enabled");
    } else if (isLedgerUsingFallback()) {
      logWarn(`Ledger: Using disabled fallback - ${getLedgerDisabledReason()}`);
    } else {
      logInfo("Ledger: Using disabled fallback (not configured)");
    }

    await logDistributedGuardStartupSummary();

    // Start background jobs
    startDataRetentionJob();
    startMaterializedViewRefreshJob();
    const distributedGuardsMaintenanceTimer = startDistributedGuardsMaintenanceJob();

    // Process pending webhooks every minute
    const webhookInterval = setInterval(() => {
      processPendingWebhooks().catch((error) => {
        logError("Failed to process pending webhooks", error);
      });
    }, 60000);

    // Register webhook interval cleanup
    registerShutdownHandler(async () => {
      clearInterval(webhookInterval);
      clearInterval(distributedGuardsMaintenanceTimer);
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
