# Settler.dev Architecture Overview

**Last Updated:** January 2026

This document provides a high-level overview of Settler.dev's architecture, components, and data flow.

---

## System Architecture

### High-Level Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Applications                      │
│  (Web Dashboard, CLI, SDK, Third-party Integrations)        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTPS / REST API
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    API Gateway Layer                        │
│  (Authentication, Authorization, Rate Limiting, Quotas)     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                   Application Layer                         │
│  (Job Management, Reconciliation Engine, Matching Rules)   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                  Adapter Layer                              │
│  (Stripe, Shopify, PayPal, Square, QuickBooks, Xero, etc.)  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ External APIs
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              External Platform APIs                         │
│  (Stripe API, Shopify API, QuickBooks API, etc.)            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                               │
│  (PostgreSQL/Supabase, Redis, File Storage)                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. API Gateway Layer

**Responsibilities:**

- Authentication (API key validation)
- Authorization (permission checks)
- Rate limiting
- Quota enforcement
- Request validation
- Error handling

**Key Files:**

- `packages/api/src/middleware/auth.ts` - Authentication
- `packages/api/src/middleware/authorization.ts` - Authorization
- `packages/api/src/middleware/quota.ts` - Quota enforcement
- `packages/api/src/middleware/rate-limiting.ts` - Rate limiting

---

### 2. Application Layer

**Responsibilities:**

- Job creation and management
- Reconciliation execution
- Matching rule processing
- Exception handling
- Report generation

**Key Files:**

- `packages/api/src/routes/jobs.ts` - Job management
- `packages/api/src/application/services/JobRouteService.ts` - Job service
- `packages/api/src/services/reconciliation-graph/` - Reconciliation engine

---

### 3. Adapter Layer

**Responsibilities:**

- Platform-specific data fetching
- Data normalization
- Error handling for platform APIs
- Rate limit management

**Key Files:**

- `packages/adapters/src/stripe.ts` - Stripe adapter
- `packages/adapters/src/shopify.ts` - Shopify adapter
- `packages/adapters/src/base.ts` - Base adapter interface

**Available Adapters:**

- Stripe (payment processor)
- PayPal (payment processor)
- Square (payment processor)
- Shopify (e-commerce)
- QuickBooks (accounting)
- Xero (accounting)
- Enhanced variants of above

---

### 4. Data Layer

**Database:** PostgreSQL (via Supabase)

**Key Tables:**

- `jobs` - Reconciliation job definitions
- `executions` - Job execution records
- `reconciliation_graph_nodes` - Transaction nodes
- `reconciliation_graph_edges` - Matching relationships
- `exceptions` - Unmatched transactions
- `webhooks` - Webhook configurations
- `users` - User accounts
- `tenants` - Organization/tenant data

**Caching:** Redis (for rate limiting, session data)

**File Storage:** For exports and reports (CSV, JSON, PDF)

---

## Data Flow

### Reconciliation Job Execution Flow

```
1. User creates job via API
   └─> Job stored in database

2. Job execution triggered (scheduled or manual)
   └─> Job status: "running"

3. Fetch data from source adapter
   └─> Normalize to common format

4. Fetch data from target adapter
   └─> Normalize to common format

5. Apply matching rules
   └─> Create graph nodes and edges

6. Generate reconciliation report
   └─> Calculate matches, unmatched, accuracy

7. Store results
   └─> Update job status: "completed"

8. Send webhooks (if configured)
   └─> Notify user of completion
```

---

## Matching Engine

### Matching Process

1. **Data Normalization**
   - Convert platform-specific formats to common schema
   - Standardize field names, dates, amounts

2. **Rule Application**
   - Apply exact matching rules
   - Apply fuzzy matching rules
   - Apply range matching rules
   - Apply custom functions (if configured)

3. **Confidence Scoring**
   - Calculate match confidence (0.0 to 1.0)
   - Higher confidence = more reliable match

4. **Conflict Resolution**
   - Handle multiple potential matches
   - Apply conflict resolution strategy (first-wins, last-wins, manual-review)

5. **Exception Creation**
   - Create exceptions for unmatched transactions
   - Log reasons for non-matching

---

## Security Architecture

### Authentication

- **API Keys:** Primary authentication method
- **Format:** `sk_live_...` or `sk_test_...`
- **Storage:** Encrypted in database (AES-256)
- **Validation:** Middleware checks on every request

### Authorization

- **Role-Based Access Control (RBAC):** Permissions system
- **Resource Ownership:** Users can only access their own resources
- **Plan-Based Features:** Feature gating based on subscription tier

### Data Security

- **Encryption at Rest:** AES-256
- **Encryption in Transit:** TLS 1.3
- **API Key Security:** Never logged, encrypted storage
- **PII Handling:** Minimal data collection, GDPR-compliant deletion

---

## Scalability Considerations

### Current Architecture

- **Stateless API:** Can scale horizontally
- **Database:** PostgreSQL with connection pooling
- **Caching:** Redis for rate limiting and session data
- **Job Execution:** Mutex-based to prevent concurrent execution

### Scaling Strategies

1. **Horizontal Scaling**
   - Add more API instances behind load balancer
   - Stateless design allows easy scaling

2. **Database Scaling**
   - Connection pooling
   - Read replicas for reporting
   - Partitioning for large datasets

3. **Job Processing**
   - Queue-based job processing (future)
   - Background workers for reconciliation
   - Distributed job execution

4. **Caching**
   - Redis for frequently accessed data
   - Cache adapter responses
   - Cache matching results

---

## Error Handling & Resilience

### Error Handling Strategy

1. **Retry Logic**
   - Exponential backoff for transient errors
   - Configurable retry attempts
   - Dead letter queue for persistent failures

2. **Circuit Breaker Pattern**
   - Prevent cascading failures
   - Automatic recovery
   - Fallback mechanisms

3. **Graceful Degradation**
   - Continue processing when possible
   - Partial results if full processing fails
   - Clear error messages

### Monitoring & Observability

- **Logging:** Structured logging with correlation IDs
- **Metrics:** Performance metrics, error rates, usage stats
- **Tracing:** Distributed tracing for request flow
- **Alerts:** Automated alerts for errors and performance issues

---

## API Design Principles

### RESTful Design

- **Resources:** Jobs, executions, reports, exceptions
- **HTTP Methods:** GET, POST, PUT, DELETE
- **Status Codes:** Standard HTTP status codes
- **Error Format:** Consistent error response structure

### Versioning

- **Current Version:** v1
- **Versioning Strategy:** URL-based (`/api/v1/...`)
- **Backward Compatibility:** Maintained for at least 6 months

### Rate Limiting

- **Free Tier:** 100 requests / 15 minutes
- **Commercial Tier:** 2,000 requests / 15 minutes
- **Enterprise Tier:** Custom limits
- **Headers:** Rate limit info in response headers

---

## Integration Patterns

### Webhook Integration

1. **Register Webhook**
   - User creates webhook endpoint
   - Settler sends events to endpoint
   - HMAC signature verification

2. **Event Types**
   - `reconciliation.completed`
   - `reconciliation.mismatch`
   - `reconciliation.error`
   - `exception.created`

3. **Retry Logic**
   - Automatic retries (up to 5 attempts)
   - Exponential backoff
   - Dead letter queue for failures

### SDK Integration

- **TypeScript/JavaScript SDK:** Full type safety
- **Python SDK:** Coming Q2 2026
- **Ruby SDK:** Coming Q2 2026
- **Go SDK:** Coming Q3 2026

---

## Deployment Architecture

### Current Deployment

- **Hosting:** Vercel (web), Custom (API)
- **Database:** Supabase (PostgreSQL)
- **Cache:** Redis (Upstash or similar)
- **Storage:** File storage for exports

### Future Considerations

- **Containerization:** Docker for consistent deployments
- **Orchestration:** Kubernetes for scaling
- **CDN:** For static assets and API caching
- **Multi-Region:** For global performance

---

## Development Workflow

### Code Structure

```
packages/
  ├── api/          # Backend API
  ├── web/          # Frontend (Next.js)
  ├── adapters/     # Platform adapters
  ├── sdk/          # TypeScript SDK
  └── cli/          # Command-line interface
```

### Testing Strategy

- **Unit Tests:** Component-level testing
- **Integration Tests:** API endpoint testing
- **E2E Tests:** Full workflow testing
- **Adapter Tests:** Platform integration testing

---

## Limitations & Constraints

See [Limitations Documentation](./limitations.md) for detailed constraints.

**Key Limitations:**

- 7 platform adapters (growing)
- PDF export in development
- Multi-currency needs FX rate provider
- Rate limits based on plan tier

---

## Future Architecture Improvements

### Planned Enhancements

1. **Queue-Based Processing**
   - Background job queue
   - Distributed processing
   - Better scalability

2. **Real-Time Updates**
   - WebSocket support
   - Server-Sent Events (SSE)
   - Live reconciliation status

3. **Advanced Analytics**
   - Reconciliation insights
   - Trend analysis
   - Anomaly detection

4. **Multi-Tenancy Enhancements**
   - Better tenant isolation
   - Custom configurations per tenant
   - Tenant-specific rate limits

---

## Additional Resources

- [API Quick Start Guide](./api-quick-start.md)
- [Error Handling Guide](./error-handling.md)
- [Matching Rules Documentation](./matching-rules.md)
- [Webhook Setup Guide](./webhook-setup.md)
- [Limitations & Known Issues](./limitations.md)

---

**Last Updated:** January 2026  
**Maintained By:** Engineering Team
