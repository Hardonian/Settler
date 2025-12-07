# Demo, Onboarding, and Walkthrough QA

**Complete first-time user journey QA with friction analysis, demo scripts, and fastest workflow guide**

---

## Table of Contents

1. [Fresh Environment Setup](#fresh-environment-setup)
2. [First-Time User Journey](#first-time-user-journey)
3. [Friction Analysis & Blockers](#friction-analysis--blockers)
4. [30-Second Demo Script](#30-second-demo-script)
5. [Fastest Workflow to First Value](#fastest-workflow-to-first-value)
6. [QA Checklist](#qa-checklist)

---

## Fresh Environment Setup

### Prerequisites Checklist

| Requirement             | Status         | Notes                       |
| ----------------------- | -------------- | --------------------------- |
| PostgreSQL 14+          | ⚠️ Required    | Can use Docker Compose      |
| Redis 7+                | ⚠️ Required    | Can use Docker Compose      |
| Node.js 18+             | ⚠️ Required    | Check with `node --version` |
| npm or yarn             | ⚠️ Required    | Check with `npm --version`  |
| Docker & Docker Compose | ✅ Recommended | For local dev environment   |

### Step 1: Clone and Install

```bash
# Clone repository
git clone https://github.com/settler/settler.git
cd settler

# Install dependencies
npm install

# Expected output:
# ✓ Installed 1,234 packages in 45s
```

**Friction Points:**

- ⚠️ **If npm install fails:** Check Node.js version (requires 18+)
- ⚠️ **If workspace dependencies fail:** Run `npm install` in each package directory

### Step 2: Environment Configuration

```bash
# Copy example env file (if exists)
cp .env.example .env

# Or create .env manually with these variables:
```

**Required Environment Variables:**

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

# Security
JWT_SECRET=your-secret-min-32-chars-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
ENCRYPTION_KEY=your-32-or-64-byte-hex-key

# Application
NODE_ENV=development
PORT=3000
LOG_LEVEL=info

# Observability (optional)
OTLP_ENDPOINT=http://localhost:4318
JAEGER_ENDPOINT=http://localhost:14268/api/traces
```

**Friction Points:**

- ⚠️ **Missing .env.example:** Create one with all required variables
- ⚠️ **Weak secrets:** Use strong random strings (32+ chars) in production

### Step 3: Start Infrastructure

```bash
# Option 1: Using Docker Compose (Recommended)
cd packages/api
docker-compose up -d

# Expected output:
# ✓ Creating network "settler-network"
# ✓ Creating volume "postgres-data"
# ✓ Starting postgres ... done
# ✓ Starting redis ... done
# ✓ Starting api ... done

# Verify services are running
docker-compose ps

# Expected output:
# NAME       STATUS          PORTS
# postgres   Up (healthy)    0.0.0.0:5432->5432/tcp
# redis      Up (healthy)    0.0.0.0:6379->6379/tcp
# api        Up              0.0.0.0:3000->3000/tcp
```

**Friction Points:**

- ⚠️ **Port conflicts:** If 3000, 5432, or 6379 are in use, change ports in docker-compose.yml
- ⚠️ **Docker not running:** Start Docker Desktop or Docker daemon
- ⚠️ **Health checks fail:** Wait 30 seconds for services to initialize

### Step 4: Run Database Migrations

```bash
# Navigate to API package
cd packages/api

# Run migrations
npm run migrate
# OR if no migrate script, run directly:
psql -U postgres -d settler -f src/db/migrations/001-initial-schema.sql

# Expected output:
# CREATE EXTENSION
# CREATE TABLE
# CREATE INDEX
# CREATE FUNCTION
# ... (all migrations successful)
```

**Verification:**

```sql
-- Connect to database
psql -U postgres -d settler

-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Expected: tenants, users, api_keys, jobs, executions, matches, webhooks, etc.
```

**Friction Points:**

- ⚠️ **Migration fails:** Check PostgreSQL logs, ensure user has CREATE privileges
- ⚠️ **Tables already exist:** Migration should be idempotent (uses IF NOT EXISTS)

### Step 5: Start API Server

```bash
# From packages/api directory
npm run dev

# Expected output:
# ✓ Database connected
# ✓ Redis connected
# ✓ Migrations verified
# ✓ Server listening on http://localhost:3000
# ✓ Health check: http://localhost:3000/health
```

**Verify API is running:**

```bash
curl http://localhost:3000/health

# Expected response:
# {
#   "status": "healthy",
#   "database": "connected",
#   "redis": "connected",
#   "timestamp": "2026-01-15T10:00:00Z"
# }
```

**Friction Points:**

- ⚠️ **Port 3000 in use:** Change PORT in .env or kill process using port 3000
- ⚠️ **Database connection fails:** Verify PostgreSQL is running and credentials are correct
- ⚠️ **Redis connection fails:** Verify Redis is running

---

## First-Time User Journey

### Step 1: Create Account/Project

**Via API (for testing):**

```bash
# Create tenant (if not exists)
curl -X POST http://localhost:3000/api/v1/admin/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Company",
    "slug": "test-company",
    "tier": "free"
  }'

# Expected response:
# {
#   "data": {
#     "id": "tenant_abc123",
#     "name": "Test Company",
#     "slug": "test-company",
#     "tier": "free",
#     "createdAt": "2026-01-15T10:00:00Z"
#   }
# }

# Create user
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123!",
    "tenantId": "tenant_abc123"
  }'

# Expected response:
# {
#   "data": {
#     "id": "user_xyz789",
#     "email": "test@example.com",
#     "tenantId": "tenant_abc123",
#     "createdAt": "2026-01-15T10:00:00Z"
#   }
# }

# Login to get API key
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123!"
  }'

# Expected response:
# {
#   "data": {
#     "accessToken": "eyJhbGciOiJIUzI1NiIs...",
#     "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
#     "apiKey": "sk_test_abc123xyz789",
#     "expiresIn": 3600
#   }
# }
```

**Friction Points:**

- ⚠️ **No admin endpoint:** Need to create tenant manually via SQL or add admin UI
- ⚠️ **Password requirements unclear:** Document minimum password requirements
- ⚠️ **API key not returned:** Check auth flow, ensure API key generation works

**Screenshots/Code Blocks Needed:**

1. Registration form (if web UI exists)
2. API response showing API key
3. Dashboard showing account creation

### Step 2: Connect Test Integration

**Create a reconciliation job:**

```bash
export API_KEY="sk_test_abc123xyz789"

curl -X POST http://localhost:3000/api/v1/jobs \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "name": "Shopify-Stripe Test Reconciliation",
    "source": {
      "adapter": "shopify",
      "config": {
        "apiKey": "test_shopify_key",
        "shopDomain": "test-shop.myshopify.com"
      }
    },
    "target": {
      "adapter": "stripe",
      "config": {
        "apiKey": "sk_test_stripe_key"
      }
    },
    "rules": {
      "matching": [
        {
          "field": "order_id",
          "type": "exact"
        },
        {
          "field": "amount",
          "type": "exact",
          "tolerance": 0.01
        }
      ]
    }
  }'

# Expected response:
# {
#   "data": {
#     "id": "job_1234567890",
#     "name": "Shopify-Stripe Test Reconciliation",
#     "status": "active",
#     "source": { ... },
#     "target": { ... },
#     "rules": { ... },
#     "createdAt": "2026-01-15T10:00:00Z"
#   },
#   "message": "Reconciliation job created successfully"
# }
```

**Friction Points:**

- ⚠️ **Adapter not found:** Verify adapter exists in packages/adapters/src/
- ⚠️ **Config validation fails:** Check error message, ensure required fields are present
- ⚠️ **API key invalid:** Verify API key format and authentication middleware

**Screenshots/Code Blocks Needed:**

1. Job creation form/API call
2. Success response with job ID
3. Dashboard showing new job

### Step 3: Perform Reconciliation

**Run the job:**

```bash
curl -X POST http://localhost:3000/api/v1/jobs/job_1234567890/run \
  -H "X-API-Key: $API_KEY"

# Expected response:
# {
#   "data": {
#     "id": "exec_9876543210",
#     "jobId": "job_1234567890",
#     "status": "running",
#     "startedAt": "2026-01-15T10:00:00Z"
#   },
#   "message": "Job execution started"
# }

# Check execution status
curl http://localhost:3000/api/v1/jobs/job_1234567890/executions \
  -H "X-API-Key: $API_KEY"

# Expected response:
# {
#   "data": [
#     {
#       "id": "exec_9876543210",
#       "jobId": "job_1234567890",
#       "status": "completed",
#       "startedAt": "2026-01-15T10:00:00Z",
#       "completedAt": "2026-01-15T10:00:05Z",
#       "summary": {
#         "matched": 125,
#         "unmatched_source": 5,
#         "unmatched_target": 3,
#         "errors": 0
#       }
#     }
#   ]
# }
```

**Friction Points:**

- ⚠️ **Job never completes:** Check logs, verify adapters can connect to test data
- ⚠️ **Status stuck on "running":** Check background job processor, verify Redis queue
- ⚠️ **No test data:** Need sample data or mock adapters for testing

**Screenshots/Code Blocks Needed:**

1. Job execution request
2. Execution status polling
3. Completed execution with summary

### Step 4: Deliver and Receive Webhook

**Create webhook:**

```bash
curl -X POST http://localhost:3000/api/v1/webhooks \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "url": "https://webhook.site/unique-id",
    "events": [
      "reconciliation.completed",
      "reconciliation.failed"
    ]
  }'

# Expected response:
# {
#   "data": {
#     "id": "wh_1234567890",
#     "url": "https://webhook.site/unique-id",
#     "events": ["reconciliation.completed", "reconciliation.failed"],
#     "status": "active",
#     "createdAt": "2026-01-15T10:00:00Z"
#   }
# }
```

**Trigger webhook (by running job again or waiting for scheduled run):**

```bash
# Run job again
curl -X POST http://localhost:3000/api/v1/jobs/job_1234567890/run \
  -H "X-API-Key: $API_KEY"

# Check webhook deliveries
curl http://localhost:3000/api/v1/webhooks/wh_1234567890/deliveries \
  -H "X-API-Key: $API_KEY"

# Expected response:
# {
#   "data": [
#     {
#       "id": "del_123",
#       "webhookId": "wh_1234567890",
#       "status": "delivered",
#       "attempts": 1,
#       "deliveredAt": "2026-01-15T10:00:06Z",
#       "responseCode": 200
#     }
#   ]
# }
```

**Friction Points:**

- ⚠️ **Webhook URL invalid:** Validate URL format, check SSRF protection
- ⚠️ **Webhook never delivered:** Check webhook queue processor, verify Redis
- ⚠️ **Webhook fails:** Check delivery logs, verify endpoint is accessible

**Screenshots/Code Blocks Needed:**

1. Webhook creation
2. Webhook delivery log
3. Received webhook payload (from webhook.site)

### Step 5: Check Logs/Results

**Get reconciliation report:**

```bash
curl "http://localhost:3000/api/v1/reports/job_1234567890?format=json" \
  -H "X-API-Key: $API_KEY"

# Expected response:
# {
#   "data": {
#     "jobId": "job_1234567890",
#     "summary": {
#       "matched": 125,
#       "unmatched_source": 5,
#       "unmatched_target": 3,
#       "errors": 0,
#       "accuracy": 94.0
#     },
#     "matches": [
#       {
#         "id": "match_1",
#         "sourceId": "order_123",
#         "targetId": "payment_456",
#         "amount": 99.99,
#         "confidence": 1.0
#       }
#     ],
#     "unmatched": [
#       {
#         "id": "unmatch_1",
#         "sourceId": "order_789",
#         "reason": "No matching payment found"
#       }
#     ]
#   }
# }
```

**Check API logs:**

```bash
# If using Docker Compose
docker-compose logs api --tail=100

# Or check log files
tail -f packages/api/logs/app.log
```

**Friction Points:**

- ⚠️ **No report data:** Verify execution completed successfully
- ⚠️ **Logs not accessible:** Check log configuration, verify file permissions
- ⚠️ **Report format unclear:** Document report structure and fields

**Screenshots/Code Blocks Needed:**

1. Report summary dashboard
2. Matched records table
3. Unmatched records with reasons
4. Log entries showing reconciliation process

---

## Friction Analysis & Blockers

### Critical Blockers

| Blocker                         | Impact | Fix Required                        | Priority |
| ------------------------------- | ------ | ----------------------------------- | -------- |
| No admin UI for tenant creation | High   | Add admin UI or document SQL setup  | P0       |
| Missing sample/test data        | High   | Create mock adapters or sample data | P0       |
| Webhook delivery not working    | Medium | Fix webhook queue processor         | P1       |
| Password requirements unclear   | Low    | Document in API/UI                  | P2       |

### Friction Points by Step

| Step                | Friction                          | Severity | Suggested Fix                           |
| ------------------- | --------------------------------- | -------- | --------------------------------------- |
| Setup               | Missing .env.example              | Medium   | Create comprehensive .env.example       |
| Setup               | Port conflicts                    | Low      | Document how to change ports            |
| Account Creation    | No admin UI                       | High     | Add admin UI or SQL scripts             |
| Account Creation    | API key not obvious               | Medium   | Show API key prominently after creation |
| Connect Integration | Adapter config unclear            | Medium   | Add adapter documentation with examples |
| Run Reconciliation  | No test data                      | High     | Create sample data or mock adapters     |
| Webhooks            | Webhook URL validation too strict | Low      | Relax SSRF checks for development       |
| View Results        | Report format complex             | Low      | Add simplified summary view             |

### Missing Explanations

1. **What is a reconciliation job?** → Add tooltip or documentation link
2. **What are matching rules?** → Add examples and explanation
3. **How do adapters work?** → Link to adapter documentation
4. **What happens when a job runs?** → Add status explanation
5. **How to interpret reports?** → Add report interpretation guide

### Unclear Outputs

1. **Job status values:** What does "running" vs "pending" mean?
2. **Confidence scores:** What does 0.95 confidence mean?
3. **Unmatched reasons:** Need more detailed explanations
4. **Error messages:** Some errors are too technical for end users

---

## 30-Second Demo Script

### For Founders/Sales

**Hook (5 seconds):**

> "Every finance team wastes 10+ hours per week manually matching orders to payments. Settler automates this in 5 minutes."

**Problem (5 seconds):**

> "You have orders in Shopify, payments in Stripe, invoices in QuickBooks—all disconnected. Manual reconciliation is slow, error-prone, and doesn't scale."

**Solution (10 seconds):**

> "Settler connects your systems with a simple API. Create a job, set matching rules, and get automated reconciliation with 99%+ accuracy. See unmatched records, get webhook notifications, and export reports."

**Proof (5 seconds):**

> "Watch: I'll create a job, run reconciliation, and show you matched records in under 30 seconds."

**Demo Flow:**

1. Show dashboard (2 seconds)
2. Click "Create Job" (2 seconds)
3. Select Shopify → Stripe (3 seconds)
4. Set matching rules (3 seconds)
5. Click "Run" (2 seconds)
6. Show results: "125 matched, 3 unmatched" (5 seconds)
7. Show webhook notification (3 seconds)
8. Show report export (5 seconds)

**Close (5 seconds):**

> "That's it. From setup to first reconciliation in under 5 minutes. Want to try it with your data?"

### For Technical Audiences

**Hook:**

> "Reconciliation-as-a-Service API. Like Resend for payments, but for matching records across systems."

**Demo Flow:**

1. Show API call to create job (5 seconds)
2. Show job running (3 seconds)
3. Show webhook payload (5 seconds)
4. Show report API response (5 seconds)
5. Show SDK usage (7 seconds)

**Close:**

> "5-minute integration. 99%+ accuracy. Usage-based pricing. Ready to try?"

---

## Fastest Workflow to First Value

### 5-Minute Quick Start

| Step               | Time   | Command/Action                       |
| ------------------ | ------ | ------------------------------------ |
| 1. Clone & Install | 2 min  | `git clone ... && npm install`       |
| 2. Start Services  | 1 min  | `docker-compose up -d`               |
| 3. Create Account  | 30 sec | `curl -X POST /api/v1/auth/register` |
| 4. Get API Key     | 30 sec | `curl -X POST /api/v1/auth/login`    |
| 5. Create Job      | 30 sec | `curl -X POST /api/v1/jobs`          |
| 6. Run Job         | 30 sec | `curl -X POST /api/v1/jobs/{id}/run` |
| 7. View Results    | 30 sec | `curl /api/v1/reports/{jobId}`       |

**Total: ~5 minutes**

### Using SDK (Even Faster)

```typescript
import Settler from "@settler/sdk";

const client = new Settler({ apiKey: "sk_your_key" });

// 1. Create job (30 seconds)
const job = await client.jobs.create({
  name: "Quick Test",
  source: { adapter: "stripe", config: { apiKey: "sk_test_..." } },
  target: { adapter: "shopify", config: { apiKey: "...", shopDomain: "..." } },
  rules: { matching: [{ field: "amount", type: "exact" }] },
});

// 2. Run job (30 seconds)
await client.jobs.run(job.data.id);

// 3. Get results (30 seconds)
const report = await client.reports.get(job.data.id);
console.log(report.data.summary);
```

**Total: ~90 seconds**

### Checklist for First Value

- [ ] API server running
- [ ] Database migrated
- [ ] Account created
- [ ] API key obtained
- [ ] Job created
- [ ] Job executed successfully
- [ ] Results viewed
- [ ] Webhook received (optional)

---

## QA Checklist

### Pre-Launch QA

- [ ] Fresh environment setup works end-to-end
- [ ] All API endpoints return expected responses
- [ ] Error messages are clear and actionable
- [ ] Webhooks deliver successfully
- [ ] Reports are accurate and complete
- [ ] Logs are accessible and useful
- [ ] Documentation matches actual behavior
- [ ] Sample data or mocks available for testing

### User Journey QA

- [ ] Account creation is intuitive
- [ ] API key is easy to find and copy
- [ ] Job creation form/API is clear
- [ ] Matching rules are well-documented
- [ ] Job execution status is visible
- [ ] Results are easy to understand
- [ ] Webhooks are reliable
- [ ] Support/help is accessible

### Technical QA

- [ ] Database migrations are idempotent
- [ ] API responses are consistent
- [ ] Error handling is robust
- [ ] Rate limiting works
- [ ] Authentication is secure
- [ ] Logging captures necessary information
- [ ] Performance is acceptable (<200ms p95)

---

## Next Steps & TO DOs

### Immediate Actions (This Week)

| Task                             | Owner | Time Estimate | Priority |
| -------------------------------- | ----- | ------------- | -------- |
| Create .env.example              | Dev   | 30 min        | P0       |
| Add admin UI for tenant creation | Dev   | 4 hours       | P0       |
| Create sample/test data          | Dev   | 2 hours       | P0       |
| Document password requirements   | Docs  | 15 min        | P1       |
| Add adapter examples             | Docs  | 1 hour        | P1       |

### Short-Term (This Month)

| Task                            | Owner     | Time Estimate | Priority |
| ------------------------------- | --------- | ------------- | -------- |
| Build web UI for job creation   | Dev       | 1 week        | P1       |
| Add report interpretation guide | Docs      | 2 hours       | P1       |
| Create video walkthrough        | Marketing | 4 hours       | P2       |
| Add tooltips and help text      | UX        | 1 day         | P2       |

### Long-Term (This Quarter)

| Task                       | Owner | Time Estimate | Priority |
| -------------------------- | ----- | ------------- | -------- |
| Build full admin dashboard | Dev   | 2 weeks       | P2       |
| Add interactive tutorial   | UX    | 1 week        | P2       |
| Create API playground      | Dev   | 1 week        | P2       |

---

**Document Version:** 1.0  
**Last Updated:** January 2026  
**Status:** ✅ Ready for QA Testing
