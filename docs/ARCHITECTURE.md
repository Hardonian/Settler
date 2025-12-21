# Settler Architecture

## Overview

Settler Enterprise follows a **Hexagonal Architecture** (Ports & Adapters) pattern with **CQRS** and **Event-Driven** principles, designed for scalability, maintainability, and enterprise-grade reliability.

## Architecture Layers

### Domain Layer
Core business logic, independent of infrastructure:
- Domain entities and value objects
- Business rules and invariants
- Domain events

**Location**: `packages/web/src/domain/`

### Application Layer
Orchestrates domain objects to fulfill use cases:
- Use case handlers
- Application services
- Command/Query handlers

**Location**: `packages/web/src/lib/`

### Infrastructure Layer
Database, caching, external service adapters:
- Database clients (Supabase, Prisma)
- Cache implementations (Redis/Upstash)
- External API clients

**Location**: `packages/web/src/lib/db/`, `packages/web/src/lib/cache/`

### Presentation Layer
HTTP API routes and middleware:
- Next.js API routes
- Middleware (auth, logging, rate limiting)
- UI components

**Location**: `packages/web/src/app/`, `packages/web/src/components/`

## Console Architecture

### Authentication Flow

```
User Request → Middleware → Auth Check → Subscription Check → Route Handler
```

1. **Middleware** (`packages/web/middleware.ts`): Checks authentication
2. **Console Gate** (`lib/auth/console-gate.ts`): Server-side auth + subscription check
3. **Route Handler**: Processes request

### API Logging Flow

```
Request → API Logger Middleware → Extract Tenant/User → Sanitize PII → Store Log
```

1. **API Logger** (`middleware/api-logger.ts`): Intercepts requests
2. **PII Filter** (`lib/privacy/pii-filter.ts`): Sanitizes sensitive data
3. **Domain Logic** (`domain/console/api-logs.ts`): Stores logs

### Tenant Isolation

- **RLS Policies**: Database-level tenant isolation
- **Server-Side Checks**: Additional validation in application layer
- **Super Admin Override**: Super admins can view all tenants

## Database Schema

### API Call Logs Table

```sql
CREATE TABLE api_call_logs (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  user_id UUID,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  status_code INTEGER,
  response_time INTEGER,
  headers JSONB,
  query JSONB,
  body JSONB,
  response_body JSONB,
  error TEXT,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Indexes

- Composite indexes for common query patterns
- Method + path indexes for filtering
- Time-based indexes for recent logs
- Tenant isolation indexes

## Security Architecture

### Authentication
- Supabase Auth for user authentication
- Session-based auth for web UI
- API key auth for programmatic access

### Authorization
- Role-Based Access Control (RBAC)
- Subscription-based feature gating
- Super admin role for elevated access

### Privacy
- Automatic PII sanitization
- GDPR-compliant data handling
- Tenant data isolation

### Rate Limiting
- Per-endpoint rate limits
- In-memory or Redis-backed
- Configurable limits per endpoint type

## Performance Architecture

### Caching Strategy
- Response caching with TTLs
- Cache invalidation on updates
- Configurable cache durations

### Database Optimization
- Composite indexes for queries
- Efficient pagination
- Query result limiting

### Connection Pooling
- Supabase connection pooling
- Efficient database connections
- Connection reuse

## Monitoring Architecture

### Health Checks
- System health monitoring
- Service-level health checks
- Aggregated health status

### Alerting
- Automated alert detection
- Alert aggregation
- Alert status tracking

### Logging
- Structured logging
- Error tracking
- Performance metrics

## Deployment Architecture

### Serverless-Ready
- Vercel deployment
- Edge function support
- Serverless database connections

### Database
- Supabase PostgreSQL
- Connection pooling
- RLS policies

### Caching
- Optional Redis/Upstash
- In-memory fallback
- Cache warming strategies

## Related Documentation

- [Console Documentation](./CONSOLE.md)
- [API Documentation](./API.md)
- [Security Documentation](../SECURITY.md)
- [Database Schema](./database-schema.md)
