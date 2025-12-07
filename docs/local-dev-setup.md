# Local Development Setup

## Run Settler Locally for Development and Testing

This guide will help you set up Settler locally for development, testing, and sandbox mode.

---

## Prerequisites

- **Docker** and **Docker Compose** installed
- **Node.js** 18+ and **npm** 10+
- **Git** (to clone the repository)

---

## Quick Start (5 Minutes)

### 1. Clone the Repository

```bash
git clone https://github.com/settler/settler.git
cd settler
```

### 2. Start Services with Docker Compose

```bash
cd packages/api
docker-compose up -d
```

This starts:

- **PostgreSQL** (port 5432)
- **Redis** (port 6379)
- **Settler API** (port 3000)

### 3. Run Database Migrations

```bash
cd packages/api
npm install
npm run migrate
```

### 4. Verify Installation

```bash
curl http://localhost:3000/health
```

You should see:

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2026-01-15T10:00:00Z"
}
```

---

## Configuration

### Environment Variables

Create `.env` file in `packages/api/`:

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/settler
# or
DB_HOST=localhost
DB_PORT=5432
DB_NAME=settler
DB_USER=postgres
DB_PASSWORD=postgres

# Redis
REDIS_URL=redis://localhost:6379
# or
REDIS_HOST=localhost
REDIS_PORT=6379

# Security
JWT_SECRET=dev-secret-change-in-production-min-32-chars
ENCRYPTION_KEY=dev-encryption-key-exactly-32-bytes!!

# API
PORT=3000
NODE_ENV=development
LOG_LEVEL=debug

# Optional: Observability
SENTRY_DSN=your_sentry_dsn
OTLP_ENDPOINT=http://localhost:4318
```

### Generate Secrets

```bash
# Generate JWT secret (32+ characters)
openssl rand -base64 32

# Generate encryption key (exactly 32 characters)
openssl rand -hex 16
```

---

## Running the API

### Development Mode (with hot reload)

```bash
cd packages/api
npm run dev
```

The API will be available at `http://localhost:3000`

### Production Mode

```bash
cd packages/api
npm run build
npm start
```

---

## Using the Local API

### Set Base URL

**CLI:**

```bash
export SETTLER_API_KEY='sk_test_local'
settler --base-url http://localhost:3000 jobs list
```

**SDK:**

```typescript
import { SettlerClient } from "@settler/sdk";

const client = new SettlerClient({
  apiKey: "sk_test_local",
  baseUrl: "http://localhost:3000",
});
```

**cURL:**

```bash
curl http://localhost:3000/api/v1/jobs \
  -H "X-API-Key: sk_test_local"
```

---

## Sandbox Mode

Settler includes a sandbox mode for testing without real API credentials:

### Enable Sandbox Mode

Set environment variable:

```bash
export SETTLER_SANDBOX_MODE=true
```

Or in `.env`:

```
SANDBOX_MODE=true
```

### Sandbox Features

- **Mock Adapters:** Use `stripe-sandbox`, `shopify-sandbox`, etc.
- **Sample Data:** Pre-populated test transactions
- **No External Calls:** All adapters return mock data
- **Fast Execution:** No network latency

### Example: Sandbox Job

```typescript
const job = await client.jobs.create({
  name: "Sandbox Test",
  source: {
    adapter: "stripe-sandbox", // Sandbox adapter
    config: {
      apiKey: "sk_test_sandbox", // Any value works
    },
  },
  target: {
    adapter: "shopify-sandbox",
    config: {
      apiKey: "sandbox_key",
      shopDomain: "test.myshopify.com",
    },
  },
  rules: {
    matching: [{ field: "order_id", type: "exact" }],
  },
});
```

---

## Testing

### Run Tests

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage
npm run test:coverage
```

### Test Database

Tests use a separate test database. Set in `.env.test`:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/settler_test
```

---

## Development Workflow

### 1. Make Code Changes

Edit files in `packages/api/src/`

### 2. Hot Reload

If running `npm run dev`, changes are automatically reloaded.

### 3. Run Migrations (if schema changed)

```bash
npm run migrate
```

### 4. Test Changes

```bash
npm run test
```

### 5. Check Linting

```bash
npm run lint
```

---

## Database Management

### Access PostgreSQL

```bash
docker exec -it settler-postgres psql -U postgres -d settler
```

Or use a GUI tool:

- **pgAdmin:** http://localhost:5050 (if included in docker-compose)
- **DBeaver:** Connect to `localhost:5432`
- **TablePlus:** Connect to `localhost:5432`

### Reset Database

```bash
# Drop and recreate
docker-compose down -v
docker-compose up -d
npm run migrate
```

### View Migrations

```bash
psql -U postgres -d settler -c "SELECT * FROM schema_migrations ORDER BY version DESC;"
```

---

## Redis Management

### Access Redis CLI

```bash
docker exec -it settler-redis redis-cli
```

### Monitor Redis

```bash
docker exec -it settler-redis redis-cli MONITOR
```

### Clear Redis Cache

```bash
docker exec -it settler-redis redis-cli FLUSHALL
```

---

## Observability

### View Logs

**API Logs:**

```bash
docker-compose logs -f api
```

**All Logs:**

```bash
docker-compose logs -f
```

### Metrics Endpoint

```bash
curl http://localhost:3000/metrics
```

### Health Check

```bash
curl http://localhost:3000/health
```

### Tracing

If OTLP endpoint is configured, traces are automatically sent. View in:

- **Jaeger:** http://localhost:16686
- **Zipkin:** http://localhost:9411

---

## Common Issues

### Port Already in Use

```bash
# Find process using port 3000
lsof -ti:3000

# Kill process
kill -9 $(lsof -ti:3000)
```

### Database Connection Failed

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check logs
docker-compose logs postgres

# Restart services
docker-compose restart postgres
```

### Migration Errors

```bash
# Check migration status
npm run migrate:status

# Rollback last migration
npm run migrate:rollback

# Reset database (⚠️ destroys data)
docker-compose down -v
docker-compose up -d
npm run migrate
```

### Redis Connection Failed

```bash
# Check if Redis is running
docker ps | grep redis

# Restart Redis
docker-compose restart redis
```

---

## Advanced Setup

### Multiple Environments

Create separate `.env` files:

- `.env.development` - Local development
- `.env.test` - Testing
- `.env.staging` - Staging environment

Load with:

```bash
NODE_ENV=development npm run dev
```

### Custom Adapters

Add custom adapters in `packages/adapters/src/`:

```typescript
// packages/adapters/src/custom.ts
import { BaseAdapter } from "./base";

export class CustomAdapter extends BaseAdapter {
  name = "custom";

  async fetch(options: FetchOptions) {
    // Your implementation
  }

  normalize(data: RawData) {
    // Your normalization logic
  }
}
```

### Local SDK Development

Link SDK locally:

```bash
cd packages/sdk
npm link

cd your-project
npm link @settler/sdk
```

---

## Docker Compose Services

### Available Services

- **api** - Settler API server
- **postgres** - PostgreSQL database
- **redis** - Redis cache
- **pgadmin** (optional) - PostgreSQL admin UI
- **jaeger** (optional) - Distributed tracing

### Start Specific Services

```bash
docker-compose up postgres redis
```

### Stop Services

```bash
docker-compose stop
```

### Remove Services (with volumes)

```bash
docker-compose down -v
```

---

## Next Steps

- [Quickstart Guide](./QUICKSTART.md) - Get your first reconciliation running
- [API Reference](./api.md) - Complete API documentation
- [Integration Recipes](./integration-recipes.md) - Common integration patterns
- [Contributing](../docs/CONTRIBUTING.md) - Contribute to Settler

---

## Support

- 📖 [Documentation](https://docs.settler.io)
- 💬 [Discord Community](https://discord.gg/settler)
- 🐛 [GitHub Issues](https://github.com/settler/settler/issues)
