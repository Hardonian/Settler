# Settler Architecture Documentation

## Overview

Settler is a **Reconciliation-as-a-Service API** built with TypeScript, Express, and PostgreSQL. The architecture follows **Hexagonal Architecture** (Ports & Adapters) with **CQRS** (Command Query Responsibility Segregation) and **Event-Driven** patterns. This ensures separation of concerns, testability, and maintainability.

## Architecture Layers

### 1. Domain Layer (`packages/api/src/domain/`)

The core business logic, independent of infrastructure.

- **Entities**: Core business objects (User, Job, Execution, ApiKey, Tenant)
- **Value Objects**: Immutable objects representing domain concepts
- **Domain Events**: Events that represent business occurrences
- **Repository Interfaces**: Contracts for data persistence (ports)

**Key Principles:**
- No dependencies on external frameworks
- Pure business logic
- Rich domain models with behavior
- Framework-agnostic

### 2. Application Layer (`packages/api/src/application/`)

Orchestrates domain objects to fulfill use cases.

- **Services**: Application services orchestrating domain logic
- **Commands**: CQRS command handlers (write operations)
- **Queries**: Read operations
- **Sagas**: Long-running business processes
- **Projections**: Read models for CQRS
- **DTOs**: Data Transfer Objects for API boundaries

**Key Principles:**
- Thin layer that delegates to domain
- Transaction boundaries
- Use case orchestration

### 3. Infrastructure Layer (`packages/api/src/infrastructure/`)

Implements technical concerns and adapters.

- **Repositories**: Database implementations of repository interfaces
- **Database**: PostgreSQL connection and queries
- **Events**: Event bus implementation
- **Security**: Encryption, authentication, authorization, password hashing, JWT handling
- **Observability**: Metrics, tracing, logging
- **Resilience**: Retry, circuit breakers, dead letter queues
- **DI Container**: Dependency injection

**Key Principles:**
- Implements interfaces defined in domain/application
- Can be swapped without changing business logic
- Handles technical concerns

### 4. Presentation Layer (`packages/api/src/routes/`, `packages/api/src/middleware/`)

HTTP adapters that expose the application to the outside world.

- **Routes**: Express route handlers
- **Middleware**: Auth, validation, error handling, request/response processing
- **Controllers**: Thin controllers that call application services
- **Validation**: Input validation with Zod

**Key Principles:**
- Thin adapters that translate HTTP to application calls
- Input validation and output formatting
- Error handling and status codes

## Key Patterns

### Hexagonal Architecture (Ports & Adapters)

- **Ports**: Interfaces defined in domain layer (repository interfaces)
- **Adapters**: Implementations in infrastructure layer (PostgreSQL repositories)
- **Benefits**: Easy to swap implementations, testable, maintainable

### CQRS (Command Query Responsibility Segregation)

- **Commands**: Mutate state (CreateJob, UpdateJob, DeleteJob)
- **Queries**: Read data (GetJob, ListJobs)
- **Separate models**: Different models for read/write operations
- **Benefits**: Enables optimization of read and write paths independently

### Event-Driven Architecture

- Domain events are published when state changes
- Event handlers can react to events asynchronously
- Enables audit trails, webhooks, and async processing
- Events stored in event store
- Aggregates can be rebuilt from events
- Snapshots used for performance

### Repository Pattern

- Abstracts data access behind interfaces
- Domain layer doesn't know about database implementation
- Easy to swap implementations (PostgreSQL, MongoDB, etc.)
- Repository interfaces in `domain/repositories/`
- Implementations in `infrastructure/repositories/`

### Dependency Injection

- Services are injected via constructor
- Enables easy testing with mocks
- Centralized in DI container (`infrastructure/di/Container.ts`)

### Saga Pattern

- Long-running transactions
- Compensating actions for rollback
- Event-driven coordination

### Multi-Tenancy

- Row-level security (RLS) at database level
- Tenant isolation enforced in all queries
- Tenant context included in all requests
- Schema-per-tenant option (feature flag)

## Data Flow

1. **Request** → Middleware (auth, validation, tenant, rate limiting)
2. **Route Handler** → Application Service
3. **Application Service** → Domain Logic
4. **Domain Logic** → Repository Interface
5. **Repository Implementation** → Database
6. **Events** → Event Bus → Subscribers (webhooks, audit logs, etc.)

## Security Architecture

### Authentication

1. **API Key Authentication**
   - Hashed storage (bcrypt)
   - Prefix-based lookup for performance (`rk_` prefix)
   - Scope-based permissions
   - Rate limiting per key
   - Stored in `api_keys` table

2. **JWT Authentication**
   - Short-lived access tokens (15min default)
   - Refresh tokens (7 days default)
   - RS256 signing (production)
   - Token rotation support (see Token Rotation section)

### Authorization

- **RBAC**: Role-based access control (Owner, Admin, Developer, Viewer)
- **Resource Ownership**: Users can only access their own resources
- **Scope-based**: API keys have scoped permissions
- **Middleware**: `requirePermission()` and `requireResourceOwnership()`

### Data Protection

- **Encryption at Rest**: AES-256-GCM for sensitive fields
- **Field-level Encryption**: API keys, adapter configs encrypted
- **Input Validation**: Zod schemas for all inputs
- **Output Sanitization**: XSS prevention, data redaction
- **SSRF Protection**: Webhook URL validation
- **CSRF Protection**: CSRF tokens for web UI (see CSRF Protection section)

## Observability

### Structured Logging

- Winston with JSON output
- Automatic PII redaction
- Trace IDs for request correlation
- Log levels: ERROR, WARN, INFO, DEBUG
- Contextual logging with metadata

### Distributed Tracing

- OpenTelemetry instrumentation
- Trace every API request end-to-end
- Spans for DB queries, external APIs, queue operations
- OTLP endpoint support
- Jaeger endpoint support

### Metrics

- Prometheus-compatible metrics endpoint (`/metrics`)
- HTTP metrics (latency, error rate, request count)
- Business metrics (reconciliations, webhook deliveries)
- System metrics (connections, queue depth, cache hit/miss)

### Health Checks

- `/health`: Overall health with dependency checks
- `/health/live`: Liveness probe (always OK if process alive)
- `/health/ready`: Readiness probe (OK only if dependencies healthy)
- Checks: Database, Redis, Sentry, Connection Pool

## Resilience Patterns

### Retry Logic

- Exponential backoff with jitter
- Configurable retries (default: 3-5)
- Retryable error detection
- Prevents thundering herd
- Used for webhook delivery, external API calls

### Circuit Breaker

- Opens after error threshold (default: 50%)
- Half-open state for testing
- Prevents cascading failures
- Per-service circuit breakers
- Implementation: `infrastructure/resilience/circuit-breaker.ts`

### Idempotency

- `Idempotency-Key` header for write operations
- 24-hour TTL
- Returns cached response for duplicate keys
- Prevents duplicate operations
- Stored in Redis

### Dead Letter Queue

- Failed messages moved to DLQ after max retries
- Manual inspection and retry
- Prevents message loss
- Implementation: `infrastructure/resilience/DeadLetterQueue.ts`

## Database Design

### Connection Pooling

- Max 20 connections (configurable)
- Min 5 connections (configurable)
- 30s idle timeout
- Prevents connection exhaustion
- Connection pool health checks

### Indexes

- Foreign keys indexed automatically
- Composite indexes for common queries
- Partial indexes for active records
- Optimized for read performance
- Migration files: `packages/api/src/db/migrations/performance-indexes.sql`

### Transactions

- ACID compliance for critical operations
- Optimistic locking for concurrency control (version field)
- Rollback on errors
- Transaction boundaries in application services

### Materialized Views

- Pre-computed reconciliation summaries
- Refreshed periodically via background job
- Improves query performance
- Migration: `packages/api/src/db/migrations/materialized-views.sql`

## Performance Optimizations

### Caching

- **Redis**: Primary cache for API responses, rate limiting, idempotency
- **Memory Cache**: Fallback if Redis unavailable
- **Cache Invalidation**: Tag-based invalidation (`cache-invalidation.ts`)
- **TTL**: Configurable TTL per cache key
- **Advanced Strategies**: See Advanced Caching section

### Cursor Pagination

- Efficient large dataset pagination
- Base64-encoded cursors
- Better performance than offset pagination
- Implementation: `utils/pagination.ts`

### Query Optimization

- Indexes on foreign keys and common queries
- Query plan analysis
- Connection pool monitoring
- Slow query logging

## Error Handling

### Typed Errors

- Strongly-typed error classes
- Error codes for machine-readable errors
- Error middleware: Centralized error handling
- Standardized error response format
- Trace IDs included in errors

### Error Response Format

```typescript
{
  error: "ERROR_CODE",      // Machine-readable code
  message: "Human message",  // Human-readable message
  details?: {...},          // Additional context
  traceId?: "..."          // Trace ID for debugging
}
```

## Testing Strategy

### Unit Tests

- Domain entities and value objects
- Business logic in isolation
- 70% coverage minimum (enforced in CI)
- Jest with ts-jest
- Location: `**/__tests__/**/*.test.ts`

### Integration Tests

- Full API flows
- Database interactions
- External service mocks
- Supertest for HTTP testing
- Location: `packages/api/src/__tests__/integration/`

### E2E Tests

- Full workflows
- Playwright for browser testing
- Real database and Redis
- Location: `tests/` (Playwright)

### Security Tests

- SQL injection attempts
- XSS payloads
- Rate limit enforcement
- Authorization boundaries
- Location: `packages/api/src/__tests__/security/`

### Load Tests

- Artillery/k6 scripts
- 100+ concurrent users
- Measure p95 latency
- Identify bottlenecks
- Location: `tests/load/`

## Deployment

### Serverless-Ready

- Vercel Functions compatible
- AWS Lambda compatible
- Cloudflare Workers compatible
- Google Cloud Functions compatible
- Stateless design

### Docker

- Multi-stage builds
- Production-optimized images
- Non-root user
- Health checks
- Dockerfile: `packages/api/Dockerfile`

### CI/CD

- GitHub Actions workflows
- Automated tests on PR
- Build and push Docker images
- Deploy to staging automatically
- Manual approval for production
- Coverage threshold enforcement

### Vercel

- Serverless deployment
- Edge functions for low latency
- Automatic scaling
- Environment variable management
- Zero-downtime deployments

## Environment Variables

See `config/env.schema.ts` for complete documentation.

**Required for production:**
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (or `DATABASE_URL`)
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (or `REDIS_URL`)
- `JWT_SECRET` (min 32 chars)
- `ENCRYPTION_KEY` (exactly 32 chars)

**Optional:**
- `SENTRY_DSN` (error tracking)
- `LOG_LEVEL` (default: `info`)
- `OTLP_ENDPOINT` (distributed tracing)

## Development Workflow

### Local Development

```bash
# Start services
docker-compose up -d  # PostgreSQL, Redis

# Run migrations
cd packages/api && npm run migrate

# Start API server
npm run dev
```

### Testing

```bash
npm run test              # Unit tests
npm run test:integration  # Integration tests
npm run test:e2e          # E2E tests
npm run test:coverage     # Coverage report
```

### Building

```bash
npm run build     # TypeScript compilation
npm run lint      # ESLint
npm run typecheck # Type checking
```

## Advanced Features

### Token Rotation

Refresh tokens are rotated on each use to prevent token reuse attacks. See `infrastructure/security/token-rotation.ts`.

### CSRF Protection

Web UI endpoints are protected with CSRF tokens. See `middleware/csrf.ts`.

### Advanced Caching

- Tag-based cache invalidation
- Cache warming strategies
- Cache coherency checks
- See `infrastructure/cache/` for implementations

### Performance Profiling

- Request duration tracking
- Database query profiling
- Memory usage monitoring
- See `infrastructure/observability/profiling.ts`

### OpenAPI Documentation

Auto-generated from route handlers. Available at `/api/v1/docs` (Swagger UI).

## Future Enhancements

- GraphQL API layer
- WebSocket support for real-time updates
- Multi-region deployment
- Event sourcing for audit logs
- Advanced ML-based matching

## Related Documentation

- [CONTRIBUTING.md](./docs/CONTRIBUTING.md) - Contribution guidelines
- [README.md](./README.md) - Quick start and overview
- [SECURITY.md](./SECURITY.md) - Security practices
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Deployment instructions
