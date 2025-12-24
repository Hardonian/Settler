# Multi-Tenancy Platform Documentation

## Overview

Settler's multi-tenancy platform provides complete data isolation, resource quotas, observability, and feature flags for enterprise-grade SaaS operations.

## Architecture

### Data Isolation

**Row Level Security (RLS)**
- PostgreSQL RLS policies automatically filter all queries by tenant ID
- Complete data isolation at the database level
- No application-level filtering required

**Schema-Per-Tenant (Optional)**
- Each tenant can have their own database schema
- Stronger isolation for enterprise customers
- Easier data migration and backup

**Connection Pooling**
- Tenant-aware connection pool sets context automatically
- RLS policies enforce isolation per connection

### Resource Quotas

**Quota Types**:
- **Rate Limits**: Requests per minute (adaptive token bucket)
- **Storage**: Total storage in bytes
- **Concurrent Jobs**: Maximum concurrent reconciliation jobs
- **Monthly Reconciliations**: Monthly reconciliation quota
- **Custom Domains**: Number of custom domains allowed

**Enforcement**:
- Quotas checked before resource allocation
- `429 Too Many Requests` when exceeded
- Enterprise tenants bypass quotas automatically

### Observability

**OpenTelemetry Tracing**:
- HTTP requests (automatic instrumentation)
- Database queries (with tenant context)
- Cache operations
- Queue operations
- Business logic spans

**Prometheus Metrics**:
- RED method (Rate, Errors, Duration)
- Multi-tenant usage metrics
- Quota usage and limits
- Noisy neighbor detection

**Grafana Dashboards**:
- Pre-configured dashboards for monitoring
- RED method visualization
- Tenant usage analytics
- Alert integration

### Feature Flags

**Capabilities**:
- Per-tenant flags
- Per-user flags
- A/B testing with percentage rollouts
- Kill switch for instant disable
- Audit log of all changes

**Hierarchy**:
1. User-specific flags (highest priority)
2. Tenant-specific flags
3. Global flags (lowest priority)

### Queue System

**Prioritization**:
- Enterprise: Bypass queue, execute immediately
- Scale: High priority (10x multiplier)
- Growth: Medium priority (5x multiplier)
- Starter: Normal priority (2x multiplier)
- Free: Low priority (1x multiplier)

## Key Components

### Domain Entities

- **Tenant**: Core tenant entity with quotas, config, hierarchy
- **User**: User entity with tenant association
- **Job**: Reconciliation job with tenant context

### Services

- **TenantService**: Tenant creation, onboarding, tier management
- **QuotaService**: Quota checking and enforcement
- **FeatureFlagService**: Feature flag management
- **NoisyNeighborDetection**: Resource usage monitoring

### Infrastructure

- **TenantContext**: Database context management for RLS
- **TenantConnectionPool**: Tenant-aware connection pooling
- **TokenBucket**: Adaptive rate limiting
- **PrioritizedQueue**: Priority-based job queue

### Middleware

- **tenantMiddleware**: Extracts tenant from request
- **quotaMiddleware**: Enforces quotas before processing

## Database Schema

### Core Tables

- `tenants`: Tenant information, quotas, config
- `users`: Users with tenant_id foreign key
- `jobs`: Jobs with tenant_id (denormalized for RLS)
- `executions`: Job executions with tenant_id
- `tenant_usage`: Usage tracking per tenant
- `tenant_quota_usage`: Real-time quota usage
- `feature_flags`: Feature flags with tenant/user scoping

### RLS Policies

All tenant-scoped tables have RLS enabled:
- `users`
- `jobs`
- `executions`
- `matches`
- `unmatched`
- `reports`
- `webhooks`
- `api_keys`
- `audit_logs`

## Usage Examples

### Create Tenant

```typescript
const { tenant, owner } = await tenantService.createTenant({
  name: 'Acme Corp',
  slug: 'acme-corp',
  ownerEmail: 'admin@acme.com',
  ownerPasswordHash: await hashPassword('password'),
  tier: TenantTier.STARTER,
});
```

### Check Quota

```typescript
const { allowed, currentUsage, limit } = await quotaService.checkQuota(
  tenantId,
  QuotaType.STORAGE,
  1024 * 1024 // 1 MB
);

if (!allowed) {
  throw new QuotaExceededError(QuotaType.STORAGE, currentUsage, limit);
}
```

### Use Feature Flag

```typescript
const enabled = await featureFlagService.isEnabled(
  'new-feature',
  tenantId,
  userId
);

if (enabled) {
  // Use new feature
}
```

### Add to Queue

```typescript
await queue.add(
  {
    tenantId,
    tenantTier: TenantTier.GROWTH,
    jobId,
  },
  QueuePriority.HIGH
);
```

## Testing

### Tenant Isolation Tests

Tests verify:
- RLS policies prevent cross-tenant access
- Tenant context properly filters data
- Schema-per-tenant isolation (if enabled)

### Quota Enforcement Tests

Tests verify:
- Quotas are enforced correctly
- Enterprise tenants bypass quotas
- Usage tracking is accurate

### Load Tests

Tests verify:
- System handles concurrent requests
- Rate limiting works under load
- Connection pooling scales

### Chaos Tests

Tests verify:
- System handles failures gracefully
- Concurrent modifications are safe
- Invalid input is handled

## Monitoring

### Key Metrics

- `http_requests_total`: Request rate by tenant
- `http_request_duration_seconds`: Request latency
- `tenant_quota_usage`: Current quota usage
- `tenant_rate_limit_hits_total`: Rate limit hits
- `tenant_resource_usage_seconds`: Resource usage (noisy neighbor)

### Alerts

- High error rate (> 10/sec)
- High latency (p95 > 2s)
- Quota exhaustion (> 90%)
- Noisy neighbor detection (3x average)

## Documentation

- **SRE Runbook**: `/docs/SRE_RUNBOOK.md`
- **Onboarding FAQ**: `/docs/ONBOARDING_FAQ.md`
- **Grafana Dashboards**: `/monitoring/grafana-dashboards.json`

## Configuration

### Environment Variables

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=settler
DB_USER=postgres
DB_PASSWORD=postgres

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Observability
OTLP_ENDPOINT=http://localhost:4318
SERVICE_NAME=settler-api

# Multi-Tenancy
ENABLE_SCHEMA_PER_TENANT=false
```

## Security Considerations

1. **Data Isolation**: RLS ensures tenants cannot access other tenants' data
2. **Quota Enforcement**: Prevents resource exhaustion
3. **Rate Limiting**: Prevents abuse and DoS
4. **Audit Logging**: All tenant operations are logged
5. **Feature Flags**: Kill switch for instant feature disable

## Performance

### Optimizations

- Connection pooling with tenant context
- Redis caching for tenant config and quotas
- Indexed queries on tenant_id
- Prioritized queues for enterprise tenants

### Scaling

- Horizontal scaling: Stateless API servers
- Database: Read replicas for read-heavy workloads
- Queue: Multiple workers with concurrency control
- Cache: Redis cluster for high availability

## Future Enhancements

- [ ] Cross-region replication
- [ ] Tenant-level data retention policies
- [ ] Advanced quota analytics
- [ ] Automated tier recommendations
- [ ] Tenant-level alerting rules
