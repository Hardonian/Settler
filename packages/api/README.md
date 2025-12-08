# Settler API

Production-grade TypeScript API server for Settler - Reconciliation-as-a-Service platform.

## Architecture

Built using **Hexagonal Architecture** with **CQRS** and **Event-Driven** patterns. See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed documentation.

## Features

### Security
- ✅ JWT authentication with refresh tokens (15min access, 7d refresh)
- ✅ API key authentication with hashed storage (bcrypt)
- ✅ Scope-based permissions (read, write, admin)
- ✅ Rate limiting per API key (configurable)
- ✅ Input validation with Zod schemas
- ✅ XSS and SQL injection prevention
- ✅ Encryption at rest (AES-256-GCM)
- ✅ Field-level encryption for sensitive data

### Observability
- ✅ Structured logging with Winston (JSON output)
- ✅ Distributed tracing with OpenTelemetry
- ✅ Prometheus metrics endpoint
- ✅ Comprehensive health checks (/health, /health/live, /health/ready)

### Resilience
- ✅ Retry logic with exponential backoff
- ✅ Circuit breaker pattern for external APIs
- ✅ Idempotency key support
- ✅ Graceful degradation
- ✅ Connection pooling (max 20 connections)

### Performance
- ✅ Database indexes on all foreign keys
- ✅ Redis caching layer
- ✅ Pagination for all list endpoints
- ✅ Query optimization (no N+1 queries)

### Testing
- ✅ Unit tests (Jest, 70% coverage target)
- ✅ Integration tests (Supertest)
- ✅ Security tests (SQL injection, XSS, auth)
- ✅ Load tests (Artillery/k6)

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (optional)

### Local Development

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Start dependencies with Docker Compose:**
   ```bash
   cd packages/api
   docker-compose up -d postgres redis
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Initialize database:**
   ```bash
   npm run dev
   # Database schema will be created automatically
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3000`

### Docker

```bash
docker-compose up
```

This starts:
- API server (port 3000)
- PostgreSQL (port 5432)
- Redis (port 6379)

## API Endpoints

### Authentication

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login (get JWT tokens)
- `POST /api/v1/auth/refresh` - Refresh access token

### Jobs

- `POST /api/v1/jobs` - Create reconciliation job
- `GET /api/v1/jobs` - List jobs (paginated)
- `GET /api/v1/jobs/:id` - Get job details
- `POST /api/v1/jobs/:id/run` - Trigger job execution
- `DELETE /api/v1/jobs/:id` - Delete job

### Reports

- `GET /api/v1/reports/:jobId` - Get reconciliation report
- `GET /api/v1/reports` - List reports (paginated)

### Webhooks

- `POST /api/v1/webhooks` - Create webhook endpoint
- `GET /api/v1/webhooks` - List webhooks
- `POST /api/v1/webhooks/receive/:adapter` - Receive external webhooks

### Health & Metrics

- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health with dependencies
- `GET /health/live` - Liveness probe
- `GET /health/ready` - Readiness probe
- `GET /metrics` - Prometheus metrics

## Environment Variables

See `.env.example` for all required variables. Key variables:

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=settler
DB_USER=postgres
DB_PASSWORD=postgres

# Redis
REDIS_URL=redis://localhost:6379

# JWT (REQUIRED in production)
JWT_SECRET=your-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret

# Encryption (REQUIRED in production)
ENCRYPTION_KEY=32-byte-key-for-aes-256-gcm

# Observability
OTLP_ENDPOINT=http://localhost:4318
LOG_LEVEL=info
```

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run integration tests
npm run test:integration

# Run security tests
npm run test:security
```

## Building

```bash
# Build TypeScript
npm run build

# Type check
npm run typecheck

# Lint
npm run lint
```

## Deployment

### Vercel

```bash
vercel --prod
```

### Docker

```bash
docker build -t settler-api .
docker run -p 3000:3000 settler-api
```

### Kubernetes

See `k8s/` directory for Kubernetes manifests.

## Security Best Practices

1. **Never commit secrets** - Use environment variables or secrets management
2. **Rotate API keys regularly** - Implement key rotation workflow
3. **Monitor audit logs** - Review audit logs for suspicious activity
4. **Keep dependencies updated** - Run `npm audit` regularly
5. **Use HTTPS in production** - TLS termination at load balancer
6. **Implement rate limiting** - Prevent abuse and DoS attacks
7. **Enable CORS restrictions** - Whitelist allowed origins

## Monitoring

### Metrics

Prometheus metrics available at `/metrics`:

- `http_request_duration_seconds` - Request latency
- `http_requests_total` - Total requests
- `reconciliations_total` - Reconciliation count
- `webhook_deliveries_total` - Webhook deliveries
- `active_connections` - Database connections

### Logging

Structured JSON logs with:
- Trace IDs for request correlation
- Automatic PII redaction
- Log levels: ERROR, WARN, INFO, DEBUG

### Tracing

OpenTelemetry traces include:
- HTTP requests
- Database queries
- External API calls
- Queue operations

## Contributing

See [CONTRIBUTING.md](../../docs/contributing.md) for guidelines.

## License

MIT
