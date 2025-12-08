/**
 * Middleware Setup Module
 * Extracts middleware configuration from index.ts for better organization
 */

import { Express } from 'express';
import { authMiddleware } from '../middleware/auth';
import { rateLimitMiddleware } from '../utils/rate-limiter';
import { testModeMiddleware, validateTestMode } from '../middleware/test-mode';
import { idempotencyMiddleware } from '../middleware/idempotency';
import { versionMiddleware } from '../middleware/versioning';
import { setCsrfToken, csrfProtection, getCsrfToken } from '../middleware/csrf';
import { profilingMiddleware } from '../infrastructure/observability/profiling';
import cookieParser from 'cookie-parser';
import { jobsRouter } from './jobs';
import { reportsRouter } from './reports';
import { webhooksRouter } from './webhooks';
import { adaptersRouter } from './adapters';
import { healthRouter } from './health';
import { metricsRouter } from './metrics';
import { openApiRouter } from './openapi';
import { usersRouter } from './users';
import { authRouter } from './auth';
import { apiKeysRouter } from './api-keys';
import { exceptionsRouter } from './exceptions';
import { testModeRouter } from './test-mode';
import { dashboardsRouter } from './dashboards';
import { feedbackRouter } from './feedback';
import { alertsRouter } from './alerts';
import { adapterTestRouter } from './adapter-test';
import { reportsEnhancedRouter } from './reports-enhanced';
import { observabilityRouter } from './observability';
import { confidenceRouter } from './confidence';
import { reconciliationStatusRouter } from './reconciliation-status';
import { rulesEditorRouter } from './rules-editor';
import { playgroundRouter } from './playground';
import { cliWizardRouter } from './cli-wizard';
import { exportEnhancedRouter } from './export-enhanced';
import { aiAssistantRouter } from './ai-assistant';
import { auditTrailRouter } from './audit-trail';
import { v1Router } from './v1';
import { v2Router } from './v2';
import { reconciliationSummaryRouter } from './reconciliation-summary';
import { mountVersionedRoutes } from './route-helpers';

/**
 * Setup all middleware and routes
 * 
 * @param app - Express application instance
 */
export function setupMiddlewareAndRoutes(app: Express): void {
  // Cookie parser (needed for CSRF protection)
  app.use(cookieParser());

  // Performance profiling middleware
  app.use(profilingMiddleware);

  // CSRF token setup (for web UI)
  app.use(setCsrfToken);

  // CSRF protection (for web UI state-changing operations)
  app.use(csrfProtection);

  // API versioning middleware
  app.use('/api', versionMiddleware);

  // Idempotency middleware for state-changing operations
  app.use('/api/v1', idempotencyMiddleware());
  app.use('/api/v2', idempotencyMiddleware());

  // Rate limiting per API key
  app.use('/api/v1', authMiddleware, rateLimitMiddleware());
  app.use('/api/v2', authMiddleware, rateLimitMiddleware());

  // Test mode middleware (after auth, before routes)
  app.use('/api/v1', authMiddleware, testModeMiddleware);
  app.use('/api/v2', authMiddleware, testModeMiddleware);
  app.use('/api/v1', authMiddleware, validateTestMode);
  app.use('/api/v2', authMiddleware, validateTestMode);

  // Health check (no auth required)
  app.use('/health', healthRouter);

  // Metrics endpoint (no auth required, but should be protected in production)
  app.use('/metrics', metricsRouter);

  // API Documentation (no auth required)
  app.use('/api/v1', openApiRouter);

  // CSRF token endpoint (for web UI)
  app.get('/api/csrf-token', getCsrfToken);

  // Auth routes (no auth required for login/refresh)
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v2/auth', authRouter);

  // Mount versioned routes with auth middleware
  mountVersionedRoutes(app, '/jobs', jobsRouter, authMiddleware);
  mountVersionedRoutes(app, '/reports', reportsRouter, authMiddleware);
  mountVersionedRoutes(app, '/webhooks', webhooksRouter, authMiddleware);
  mountVersionedRoutes(app, '/adapters', adaptersRouter, authMiddleware);
  mountVersionedRoutes(app, '/users', usersRouter, authMiddleware);
  mountVersionedRoutes(app, '/api-keys', apiKeysRouter, authMiddleware);
  mountVersionedRoutes(app, '/exceptions', exceptionsRouter, authMiddleware);
  mountVersionedRoutes(app, '/test-mode', testModeRouter, authMiddleware);
  mountVersionedRoutes(app, '/observability', observabilityRouter, authMiddleware);
  mountVersionedRoutes(app, '/dashboards', dashboardsRouter, authMiddleware);
  mountVersionedRoutes(app, '/feedback', feedbackRouter, authMiddleware);
  mountVersionedRoutes(app, '/alerts', alertsRouter, authMiddleware);
  mountVersionedRoutes(app, '/adapter-test', adapterTestRouter, authMiddleware);
  mountVersionedRoutes(app, '/reports-enhanced', reportsEnhancedRouter, authMiddleware);
  mountVersionedRoutes(app, '/confidence', confidenceRouter, authMiddleware);
  mountVersionedRoutes(app, '/reconciliation-status', reconciliationStatusRouter, authMiddleware);
  mountVersionedRoutes(app, '/rules-editor', rulesEditorRouter, authMiddleware);
  mountVersionedRoutes(app, '/cli-wizard', cliWizardRouter, authMiddleware);
  mountVersionedRoutes(app, '/export-enhanced', exportEnhancedRouter, authMiddleware);
  mountVersionedRoutes(app, '/ai-assistant', aiAssistantRouter, authMiddleware);
  mountVersionedRoutes(app, '/audit-trail', auditTrailRouter, authMiddleware);

  // Playground routes (no auth, rate-limited)
  app.use('/api/v1/playground', playgroundRouter);
  app.use('/api/v2/playground', playgroundRouter);

  // Versioned API routes
  app.use('/api/v1', authMiddleware, v1Router);
  app.use('/api/v2', authMiddleware, v2Router);

  // Optimized reconciliation summary endpoint
  app.use('/api/v1/reconciliations', authMiddleware, reconciliationSummaryRouter);
}
