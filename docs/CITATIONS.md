# Citations and References

## Implementation References

### Console Enhancement (December 2024)

#### Core Implementation Files
- `packages/web/src/lib/auth/console-gate.ts` - Server-side authentication and subscription gating
- `packages/web/src/lib/auth/super-admin.ts` - Super admin role detection and enforcement
- `packages/web/src/lib/api/console-auth.ts` - API route authentication utilities
- `packages/web/src/middleware/api-logger.ts` - Automatic API call logging middleware
- `packages/web/src/lib/privacy/pii-filter.ts` - PII sanitization utilities
- `packages/web/src/domain/console/api-logs.ts` - API logging domain logic

#### Database Migrations
- `supabase/migrations/20241201000000_create_api_call_logs.sql` - API call logs table schema
- `supabase/migrations/20241201000001_optimize_api_call_logs.sql` - Performance indexes
- `supabase/migrations/20241201000002_add_log_retention_policy.sql` - Log retention policy
- `supabase/migrations/20241201000003_enhance_rls_policies.sql` - Enhanced RLS policies

#### API Routes
- `packages/web/src/app/api/console/api-logs/route.ts` - API logs endpoint
- `packages/web/src/app/api/console/tenants/route.ts` - Tenant observability endpoint
- `packages/web/src/app/api/console/health/route.ts` - Health check endpoint

#### UI Components
- `packages/web/src/app/console/api-logs/page.tsx` - API logs viewer page
- `packages/web/src/app/console/admin/tenants/page.tsx` - Tenant observability page
- `packages/web/src/components/console/ApiLogsViewer.tsx` - API logs viewer component
- `packages/web/src/components/console/TenantsObservabilityDashboard.tsx` - Tenant dashboard component

#### Security & Performance
- `packages/web/src/lib/security/rate-limiter.ts` - Rate limiting utilities
- `packages/web/src/lib/security/request-validator.ts` - Request validation utilities
- `packages/web/src/lib/cache/api-cache.ts` - Response caching utilities
- `packages/web/src/lib/monitoring/health-check.ts` - Health check utilities
- `packages/web/src/lib/monitoring/alerts.ts` - Alerting system
- `packages/web/src/lib/api/error-handler-enhanced.ts` - Enhanced error handling

### Setup & Testing Scripts

#### Database Setup
- `scripts/run-migrations-remote.ts` - Remote migration execution
- `scripts/configure-super-admin.ts` - Super admin configuration
- `scripts/test-setup.ts` - Setup verification
- `scripts/check-schema.ts` - Schema validation

#### Testing
- `scripts/test-api-routes.ts` - API route testing
- `scripts/integration-test.ts` - Integration tests
- `scripts/verify-all-routes.ts` - Route verification
- `scripts/final-verification.ts` - Final verification suite
- `scripts/run-all-tests.sh` - Test orchestration

### Documentation

#### Implementation Documentation
- `archive/completed-work/2024-12/CONSOLE_ENHANCEMENT_SUMMARY.md` - Complete enhancement summary
- `archive/completed-work/2024-12/CONSOLE_AUTH_FIX_SUMMARY.md` - Auth fix summary
- `archive/completed-work/2024-12/IMPLEMENTATION_COMPLETE.md` - Implementation details
- `archive/completed-work/2024-12/FINAL_STATUS_REPORT.md` - Final status report

#### User Documentation
- `docs/CONSOLE.md` - Console user guide
- `docs/API.md` - API documentation
- `docs/README.md` - Documentation index
- `REMOTE_SETUP_GUIDE.md` - Remote setup instructions
- `DEPLOYMENT_CHECKLIST.md` - Deployment checklist

#### Release Documentation
- `CHANGELOG.md` - Version changelog
- `RELEASE_NOTES.md` - Release notes
- `README.md` - Main README

## Architecture References

### Design Patterns
- **Hexagonal Architecture**: Domain-driven design with ports and adapters
- **CQRS**: Command Query Responsibility Segregation
- **Event-Driven**: Event sourcing for reconciliation engine
- **Middleware Pattern**: Cross-cutting concerns (logging, rate limiting, caching)

### Technology Stack
- **Next.js**: App Router, Server Components, Server Actions
- **Supabase**: PostgreSQL database, Authentication, RLS
- **TypeScript**: Type-safe development
- **PostgreSQL**: Primary database with RLS
- **Redis/Upstash**: Caching and rate limiting (optional)

## Security References

### Authentication & Authorization
- Supabase Auth: `createServerClient`, `createAdminClient`
- Role-Based Access Control: `UserRole` enum, `getUserRole`, `isSuperAdmin`
- Subscription Gating: `getSubscriptionStatus`, `requireConsoleAccess`

### Privacy & Compliance
- PII Filtering: `redactPII`, `sanitizeApiData`, `sanitizeUserData`
- GDPR Compliance: Automatic PII sanitization
- Tenant Isolation: RLS policies

### Security Features
- Rate Limiting: `withRateLimit`, `RATE_LIMIT_CONFIGS`
- Request Validation: `validateRequestBody`, `validatePagination`
- Error Sanitization: `createErrorResponse`, `withErrorHandling`

## Performance References

### Database Optimization
- Composite Indexes: `(tenant_id, status_code, created_at DESC)`
- Partial Indexes: Method + path combinations
- Query Optimization: Efficient pagination and filtering

### Caching
- Response Caching: `withCache`, `CACHE_CONFIGS`
- TTL-based Expiration: Configurable cache durations
- Cache Invalidation: Manual cache clearing

## Monitoring References

### Health Checks
- `performHealthCheck`: System health monitoring
- `checkSupabaseHealth`: Supabase connection check
- `checkDatabaseHealth`: Database connectivity check

### Alerting
- `runAllAlertChecks`: Comprehensive alert checking
- `checkHealthAlerts`: Health-based alerts
- `checkErrorRateAlerts`: Error rate monitoring
- `checkPerformanceAlerts`: Performance monitoring

## Related Documentation

- [Console Documentation](./CONSOLE.md)
- [API Documentation](./API.md)
- [Architecture Documentation](./architecture.md)
- [Security Documentation](../SECURITY.md)
