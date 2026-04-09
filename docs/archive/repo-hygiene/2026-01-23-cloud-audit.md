# SETTLER CLOUD - COMPLETE INVENTORY REPORT

**Generated:** 2026-01-23
**Purpose:** Comprehensive audit for OSS extraction
**Repository:** Hardonian/Settler (Cloud/Enterprise version)

---

## EXECUTIVE SUMMARY

Settler Cloud is a production-ready, multi-tenant Reconciliation-as-a-Service platform with:

- **14 packages** in a pnpm monorepo
- **Next.js 14 App Router** frontend with 42+ API route directories
- **Express.js** backend with 16+ integration adapters
- **Supabase PostgreSQL** with 40+ Prisma models and RLS policies
- **Stripe billing** with tiered subscriptions and usage metering
- **8 packages** already marked for OSS publication

---

## 1. FRAMEWORK & RUNTIME VERSIONS

| Component              | Technology        | Version         | Notes                  |
| ---------------------- | ----------------- | --------------- | ---------------------- |
| **Node.js**            | Runtime           | >=24.0.0        | Required minimum       |
| **Package Manager**    | pnpm              | 10.13.1         | Monorepo workspace     |
| **Monorepo Tool**      | Turbo             | 2.6.2           | Build orchestration    |
| **Frontend Framework** | Next.js           | 14.2.35         | App Router (NOT Pages) |
| **Backend Framework**  | Express.js        | 4.22.1          | API server             |
| **Language**           | TypeScript        | 5.3.3           | Strict mode            |
| **Database ORM**       | Prisma            | 7.1.0           | PostgreSQL client      |
| **Database**           | Supabase          | -               | PostgreSQL + Auth      |
| **Queue System**       | BullMQ            | 5.3.0           | Redis-backed           |
| **Redis Client**       | ioredis / Upstash | 5.3.2 / 1.25.0  | Queue + KV             |
| **Test Runner**        | Playwright + Jest | 1.40.0 / 29.7.0 | E2E + Unit             |
| **Deployment**         | Vercel            | -               | Edge Network           |

### Package Manager Scripts (Critical)

```json
{
  "build": "turbo run build",
  "dev": "turbo run dev",
  "test": "turbo run test",
  "lint": "turbo run lint",
  "typecheck": "turbo run typecheck",
  "prisma:generate": "PRISMA_CLIENT_ENGINE_TYPE=binary prisma generate",
  "db:migrate:all": "tsx scripts/apply-migrations-direct.ts",
  "mirror:dryrun": "tsx scripts/mirror-dryrun.ts",
  "mirror:verify": "tsx scripts/mirror-verify.ts",
  "mirror:publish": "tsx scripts/mirror-publish.ts",
  "setup:open-core": "bash scripts/setup-open-core.sh"
}
```

---

## 2. APP STRUCTURE (Next.js App Router)

### Web Package: `packages/web/`

**Rendering Mode:** App Router (`/src/app/`)
**License:** PROPRIETARY

### Route Structure (165+ routes)

#### **Public/Marketing Routes**

```
/                          # Homepage
/pricing                   # Pricing page
/docs/**                   # Public documentation (OSS-ready)
/integrations              # Integration catalog
/how-it-works              # Product explainer
/use-cases/**              # Industry use cases
/legal/**                  # Terms, Privacy, DPA, AUP
/status                    # System status
/roadmap                   # Product roadmap
/changelog/**              # Release notes
/community/**              # Community pages
/comparison                # Competitor comparison
```

#### **API Routes (42+ directories)**

```
/api/
├── admin/**               # Admin operations (Cloud-only)
├── ai/**                  # AI features (Cloud-only)
├── billing/**             # Payment recovery, disputes (Cloud-only)
├── stripe/**              # Webhook, checkout, portal (Cloud-only)
├── console/**             # Developer console API (Cloud-only)
├── connectors/**          # Adapter management (Cloud-only)
├── integrations/**        # OAuth callbacks (Cloud-only)
├── runs/**                # Job execution
├── projects/**            # Project CRUD
├── rbac/**                # Role-based access (Enterprise)
├── onboarding/**          # User onboarding
├── ops/**                 # Operational dashboards (Cloud-only)
├── oss/**                 # OSS-related endpoints
├── enterprise/**          # Enterprise features (Cloud-only)
├── pricing/               # Pricing info (could be OSS)
├── health/                # Health checks (OSS-ready)
├── public/**              # Public API (OSS-ready)
├── v1/**                  # Versioned API
└── [30+ other endpoints]
```

#### **Console (Developer Dashboard) - Cloud-only**

```
/console/
├── [47+ sub-routes]
├── analytics/             # Usage analytics
├── api-logs/              # API call logging
├── billing/               # Billing management
├── feature-flags/         # Feature flag UI
├── runs/                  # Reconciliation runs
├── settings/              # Workspace settings
├── usage/                 # Usage monitoring
├── webhooks/              # Webhook config
└── ...
```

#### **Admin Dashboard - Cloud-only**

```
/admin/
├── [16+ sub-routes]
├── analytics/             # Cross-tenant analytics
├── audit/                 # Audit logs
├── experiments/           # A/B testing
├── flags/                 # Feature flags
├── monitoring/            # System health
├── ops/                   # Operations tooling
└── ...
```

#### **User Dashboard**

```
/dashboard/
├── addons/                # Add-on management
├── billing/               # Billing info
├── integrations/          # Connected integrations
├── jobs/                  # Job history
├── usage/                 # Usage stats
└── user/                  # User settings
```

### Middleware Stack

**Location:** `packages/web/src/middleware/` (App Router global middleware)

| Middleware                  | Purpose                      | OSS Status                         |
| --------------------------- | ---------------------------- | ---------------------------------- |
| `api-logger.ts`             | Request/response logging     | ⚠️ Modify (remove cloud telemetry) |
| `api-wrapper.ts`            | Standardized API responses   | ✅ OSS-ready                       |
| `billing-gate-universal.ts` | **Subscription enforcement** | ❌ Cloud-only (remove)             |
| `console-auth.ts`           | Console authentication       | ❌ Cloud-only                      |
| `request-size-limit.ts`     | Payload validation           | ✅ OSS-ready                       |
| `security-headers.ts`       | HSTS, CSP, XSS headers       | ✅ OSS-ready                       |
| `usage-enforcement.ts`      | Quota limits                 | ❌ Cloud-only (optional tier)      |
| `usage-limits.ts`           | Plan-based limits            | ❌ Cloud-only                      |
| `usage-tracking.ts`         | Billable event tracking      | ❌ Cloud-only                      |

### Next.js Configuration Highlights

```javascript
// next.config.js
{
  output: 'standalone',
  experimental: {
    instrumentationHook: true,
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-*']
  },
  webpack: {
    // Prevent Prisma client in browser bundles
    externals: ['@prisma/client', 'prisma']
  },
  headers: [
    'Strict-Transport-Security',
    'X-Frame-Options: DENY',
    'X-Content-Type-Options: nosniff',
    'Content-Security-Policy'
  ]
}
```

---

## 3. DATABASE LAYER

### Infrastructure

- **Database:** Supabase PostgreSQL (managed)
- **ORM:** Prisma 7.1.0
- **Connection:** Pooled via Supabase connection string
- **Auth:** Supabase Auth + Custom JWT

### Prisma Schema: 40+ Models (1,253 lines)

**File:** `prisma/schema.prisma`

#### **Core Billing Models (Cloud-only)**

```prisma
model BillingAccount {
  id                String       @id @default(uuid())
  user_id           String       @unique
  stripe_customer_id String?     @unique
  email             String
  tenant_id         String?
  subscriptions     Subscription[]
  usage_events      UsageEvent[]
}

model Subscription {
  id                   String   @id @default(uuid())
  billing_account_id   String
  stripe_subscription_id String @unique
  status               String   // active, canceled, past_due
  plan_id              String
  current_period_start DateTime
  current_period_end   DateTime
  cancel_at            DateTime?
}

model StripeEvent {
  id            String   @id @default(uuid())
  stripe_id     String   @unique
  type          String   // checkout.session.completed, etc.
  status        String   // received, processing, processed
  payload       Json
  processed_at  DateTime?
}

model UsageEvent {
  id                 String   @id @default(uuid())
  billing_account_id String
  event_type         String   // ingestion, export, etc.
  quantity           Int
  unit               String
  metadata           Json?
  created_at         DateTime @default(now())
}

model UsageAggregateDaily {
  date               DateTime
  billing_account_id String
  event_type         String
  total_quantity     Int
  @@id([date, billing_account_id, event_type])
}

model AddOn {
  id    String @id @default(uuid())
  name  String
  price Int
}

model AddOnPurchase {
  id                 String   @id @default(uuid())
  billing_account_id String
  add_on_id          String
  purchased_at       DateTime @default(now())
}
```

#### **Reconciliation Models (OSS-ready core logic)**

```prisma
model ReconJob {
  id          String   @id @default(uuid())
  tenant_id   String
  status      String   // pending, running, completed, failed
  config      Json
  created_at  DateTime @default(now())
  completed_at DateTime?
}

model ReconResult {
  id           String @id @default(uuid())
  recon_job_id String
  matched      Json[]
  unmatched    Json[]
  anomalies    Json[]
}

model ReconTemplate {
  id        String @id @default(uuid())
  tenant_id String
  name      String
  config    Json
}

model ReconAudit {
  id        String   @id @default(uuid())
  job_id    String
  user_id   String
  action    String
  timestamp DateTime @default(now())
}
```

#### **Feature Flag Models (Cloud-only)**

```prisma
model FeatureFlag {
  id           String  @id @default(uuid())
  key          String  @unique
  description  String?
  enabled      Boolean @default(false)
  environments FeatureFlagEnvironment[]
  overrides    FeatureFlagOverride[]
}

model FeatureFlagEnvironment {
  flag_id     String
  environment String  // development, staging, production
  enabled     Boolean
  rollout_pct Int     @default(0) // 0-100
  @@id([flag_id, environment])
}

model FeatureFlagOverride {
  flag_id   String
  tenant_id String
  enabled   Boolean
  @@id([flag_id, tenant_id])
}
```

#### **Multi-tenant Models (Cloud-only)**

```prisma
model Tenant {
  id           String   @id @default(uuid())
  name         String
  slug         String   @unique
  owner_id     String
  tier         String   // free, starter, growth, scale, enterprise
  created_at   DateTime @default(now())
  memberships  Membership[]
  branding     TenantBranding?
}

model Membership {
  tenant_id String
  user_id   String
  role      String   // owner, admin, member
  status    String   // active, pending, suspended
  @@id([tenant_id, user_id])
}

model TenantBranding {
  tenant_id     String @id
  logo_url      String?
  primary_color String?
  custom_domain String?
}

model OnboardingProgress {
  user_id          String @id
  current_step     Int    @default(0)
  completed_steps  String[] // JSON array
  metadata         Json?
}
```

#### **Other Models**

- `Webhook`, `WebhookDelivery` - Webhook outbound system
- `AuditLog` - Comprehensive audit trail (Cloud-only)
- `Experiment`, `ExperimentVariant` - A/B testing (Cloud-only)
- `Receipt`, `ReceiptItem` - OCR-processed receipts (could be OSS with model)
- `MappingTemplate`, `ValidationRule`, `TransformRecipe` - Data transformation (OSS-ready)

### Row-Level Security (RLS) Policies

**Migration:** `supabase/migrations/20250312000000_billing_rls_guards.sql`

**Protected Tables:**

- `subscriptions` - Users can only see their own
- `stripe_events` - Write restricted to service_role
- `usage_events` - Tenant-isolated

**Policy Example:**

```sql
CREATE POLICY "Users can view own subscriptions"
ON subscriptions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM billing_accounts ba
    WHERE ba.id = subscriptions.billing_account_id
      AND (
        ba.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM memberships m
          WHERE m.tenant_id = ba.tenant_id
            AND m.user_id = auth.uid()
            AND m.status = 'active'
        )
      )
  )
);
```

### Migrations

**Location:** `supabase/migrations/`

**15+ migration files:**

1. Initial schema
2. RLS policies (critical security)
3. API call logs
4. Log retention policies
5. Partner mode setup
6. Billing guards
7. Database verification helpers
8. Onboarding tables
9. Feature flag tables
10. Webhook tables
11. Audit log tables
12. Multi-tenant isolation
13. Performance indexes
14. Materialized views
15. Cleanup functions

---

## 4. BILLING & STRIPE INTEGRATION (100% CLOUD-ONLY)

### Pricing Tiers

**File:** `config/plans.ts`

#### Main Reconciliation Plans

| Plan           | Reconciliations/mo | Price        | Log Retention | Adapters  | Support            |
| -------------- | ------------------ | ------------ | ------------- | --------- | ------------------ |
| **Free**       | 1,000              | $0           | 7 days        | 2         | Community          |
| **Trial**      | 100,000            | $0 (30 days) | 30 days       | Unlimited | Email              |
| **Commercial** | 100,000            | $99/mo       | 90 days       | Unlimited | Email + Consulting |
| **Enterprise** | Unlimited          | Custom       | Unlimited     | Unlimited | Dedicated + SSO    |

**Additional Features:**

- Free: 3 playground runs/day, 2 workflows, 5 email reports/mo
- Trial/Commercial: Unlimited playground, unlimited workflows, unlimited reports
- Enterprise: White-label, RBAC, audit logging, SLA guarantees

#### Edge AI Pricing Tiers

| Tier                | Price  | Edge Nodes | Optimizations | Reconciliations/mo | SLA    |
| ------------------- | ------ | ---------- | ------------- | ------------------ | ------ |
| **SaaS Only**       | $99    | 0          | 0             | 10,000             | -      |
| **Edge Starter**    | $299   | 1          | 1             | 50,000             | 99.5%  |
| **Edge Pro**        | $999   | 5          | Unlimited     | 500,000            | 99.9%  |
| **Enterprise Edge** | $4,999 | Unlimited  | Unlimited     | Unlimited          | 99.99% |

**Financial Projections:**

- CAC: $50 (SaaS) → $5,000 (Enterprise)
- LTV: $1,188 (SaaS) → $59,988 (Enterprise)
- Churn: 5% (Free) → 1% (Enterprise) monthly
- Gross Margin: 75%

### Stripe Integration Architecture

#### Webhook Handler: `/api/stripe/webhook`

**Runtime:** `nodejs` (NOT edge - requires database writes via Prisma)

**Critical Implementation:**

```typescript
export const config = { runtime: "nodejs" };

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const rawBody = await request.text();

  // 1. Verify signature
  const event = stripe.webhooks.constructEvent(
    rawBody,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );

  // 2. Idempotency check (critical for webhooks)
  const existing = await prisma.stripeEvent.findUnique({
    where: { stripe_id: event.id },
  });

  if (existing) {
    if (existing.status === "processed") {
      return new Response("Already processed", { status: 200 });
    }
    // Handle duplicate delivery during processing
  }

  // 3. Store event
  await prisma.stripeEvent.create({
    data: {
      stripe_id: event.id,
      type: event.type,
      status: "processing",
      payload: event.data,
    },
  });

  // 4. Handle event types
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutComplete(event.data.object);
      break;
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await reconcileBillingAccount(event.data.object.customer);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionCanceled(event.data.object);
      break;
    case "invoice.paid":
      await handleInvoicePaid(event.data.object);
      break;
    case "invoice.payment_failed":
      await handlePaymentFailed(event.data.object);
      break;
  }

  // 5. Mark processed
  await prisma.stripeEvent.update({
    where: { stripe_id: event.id },
    data: { status: "processed", processed_at: new Date() },
  });

  return new Response("OK", { status: 200 });
}
```

#### Other Stripe Routes (all Cloud-only)

- `POST /api/stripe/checkout` - Create checkout session
- `GET /api/stripe/portal` - Redirect to customer portal
- `POST /api/billing/payment-recovery` - Retry failed payments
- `POST /api/billing/dispute` - Handle payment disputes
- `POST /api/billing/retry-payment` - Manual payment retry

### Usage Metering

**Billable Event Types:**

```typescript
type UsageEventType =
  | "ingestion" // Data ingestion transaction
  | "export" // Export operation
  | "reconciliation_run" // Reconciliation execution
  | "api_call" // API request
  | "webhook_delivery" // Webhook sent
  | "receipt_ocr" // Receipt OCR processing
  | "ai_analysis" // AI-powered analysis
  | "edge_node_minute"; // Edge node compute time
```

**Storage:**

```typescript
// Real-time event
await prisma.usageEvent.create({
  data: {
    billing_account_id: account.id,
    event_type: "reconciliation_run",
    quantity: 1,
    unit: "run",
    metadata: { job_id, duration_ms },
  },
});

// Daily aggregation (cron job)
await prisma.usageAggregateDaily.upsert({
  where: {
    date_billingAccountId_eventType: {
      date: today,
      billing_account_id: account.id,
      event_type: "reconciliation_run",
    },
  },
  update: { total_quantity: { increment: 1 } },
  create: {
    date: today,
    billing_account_id: account.id,
    event_type: "reconciliation_run",
    total_quantity: 1,
  },
});
```

### Billing Enforcement Middleware

**Universal Gate (opt-out):**

```typescript
// Default: subscription required
export const POST = withUniversalBillingGate(handler);

// Opt-out for free tier features
export const POST = withUniversalBillingGate(handler, { allowFree: true });

// Public endpoints
export const POST = publicRoute(handler);
```

---

## 5. ADAPTERS & INTEGRATIONS (CLOUD-ONLY WITH CREDENTIALS)

### Location: `packages/adapters/`

### Base Architecture (OSS-ready interfaces)

**Core Classes:**

```typescript
// OSS-ready interface
abstract class Adapter {
  abstract fetch(config: FetchConfig): Promise<Transaction[]>;
  abstract normalize(data: any): Transaction;
  abstract validate(transaction: Transaction): ValidationResult;
  abstract healthCheck(): Promise<HealthStatus>;
  capabilities: AdapterCapabilities;
}

// Enhanced with Cloud features
class EnhancedBase extends Adapter {
  protected credentialManager: CredentialEncryption; // Cloud-only
  protected tokenRefresh: TokenRefreshService; // Cloud-only
  protected rateLimiter: RateLimitHandler; // Could be OSS
  protected webhookVerifier: WebhookVerification; // Could be OSS
  protected retryQueue: RetryQueue; // Could be OSS
}
```

### Infrastructure Components

| Component                  | OSS Status    | Reason                   |
| -------------------------- | ------------- | ------------------------ |
| `credential-encryption.ts` | ❌ Cloud-only | Requires encryption keys |
| `token-refresh.ts`         | ❌ Cloud-only | Stores tokens in DB      |
| `rate-limiting.ts`         | ✅ OSS-ready  | Generic rate limiter     |
| `webhook-verification.ts`  | ✅ OSS-ready  | Signature validation     |
| `retry-queue.ts`           | ✅ OSS-ready  | Exponential backoff      |

### Supported Integrations (16+)

All adapters are **Cloud-only in their implemented form** due to credential management, but **interfaces are OSS-ready**.

#### **Payment & Financial**

1. **Stripe** (enhanced) - `adapters/stripe/`
   - Charges, invoices, subscriptions, customers
   - Dispute handling, refunds, balance transactions
   - OAuth: Yes | Webhook: Yes

2. **PayPal** (enhanced + payouts) - `adapters/paypal/`
   - Transactions, payouts, invoicing
   - OAuth: Yes | Webhook: Yes

3. **Square** (enhanced) - `adapters/square/`
   - Transactions, inventory, customers
   - OAuth: Yes | Webhook: Yes

4. **Google Pay** - `adapters/google-pay/`
   - Payment method integration

#### **E-commerce & Retail**

5. **Shopify** - `adapters/shopify/`
   - Orders, products, customers, inventory
   - OAuth: Yes | Webhook: Yes | Scopes: read_orders, read_products

6. **WooCommerce** - `adapters/woocommerce/`
   - WordPress integration via REST API

7. **Wix Stores** - `adapters/wix/`
8. **Meta Commerce** - `adapters/meta/` (Facebook/Instagram)
9. **TikTok Shop** - `adapters/tiktok/`

#### **Accounting & ERP**

10. **QuickBooks** (enhanced) - `adapters/quickbooks/`
    - Invoices, expenses, customers, vendors
    - OAuth: Yes | Webhook: Yes

11. **Xero** - `adapters/xero/`
    - Cloud accounting integration

12. **NetSuite** - `adapters/netsuite/`
    - Enterprise ERP

#### **Analytics & Marketing**

13. **GA4 Deep Sync** - `adapters/ga4/`
    - Google Analytics 4 integration

14. **Whatsapp/Telegram** - `adapters/messaging/`

#### **Other**

15. **API Client** - `adapters/api-client/`
    - Generic HTTP adapter (OSS-ready base)
16. **CSV Upload** - `adapters/csv/`
    - File-based adapter (OSS-ready)

### Adapter Interface (OSS-ready)

```typescript
export interface AdapterCapabilities {
  supportedOperations: ("fetch" | "push" | "realtime")[];
  supportsWebhooks: boolean;
  requiresOAuth: boolean;
  supportsIncremental: boolean;
  maxPageSize: number;
  rateLimit: { requests: number; period: "second" | "minute" | "hour" };
}

export interface FetchConfig {
  credentials?: Record<string, string>; // Encrypted in Cloud
  dateRange?: { start: Date; end: Date };
  filters?: Record<string, any>;
  pagination?: { page: number; limit: number };
}

export interface Transaction {
  id: string;
  externalId: string;
  source: string;
  amount: number;
  currency: string;
  date: Date;
  description?: string;
  metadata?: Record<string, any>;
}
```

---

## 6. FEATURE FLAGS (CLOUD-ONLY)

### Infrastructure

**Database Models:** `FeatureFlag`, `FeatureFlagEnvironment`, `FeatureFlagOverride`

**UI:** `/console/feature-flags` - Management interface

**API:**

- `GET /api/console/feature-flags` - List flags
- `POST /api/console/feature-flags` - Create flag
- `PATCH /api/console/feature-flags/:id` - Update flag

### Use Cases

- **Business Logic Gates** - Control access to paid features
- **A/B Testing** - Experiment variants
- **Gradual Rollouts** - Percentage-based deployment (0-100%)
- **Tenant-Level Control** - Per-customer feature access
- **Environment Isolation** - Dev/staging/prod differences

### Example Flags

```typescript
{
  key: 'advanced_reconciliation',
  enabled: true,
  environments: [
    { environment: 'production', enabled: true, rollout_pct: 100 },
    { environment: 'staging', enabled: true, rollout_pct: 100 }
  ],
  overrides: [
    { tenant_id: 'enterprise_tenant_1', enabled: true }
  ]
}
```

---

## 7. BACKGROUND JOBS & QUEUING (CLOUD-ONLY PRIORITY, OSS-READY BASE)

### Queue System

**Technology:** BullMQ (Redis-backed)
**Redis Provider:** Upstash (Vercel KV) or self-hosted ioredis
**Configuration:** Prefer `REDIS_URL`, fallback to host/port

### PrioritizedQueue System

**File:** `packages/api/src/infrastructure/queue/PrioritizedQueue.ts`

**Priority Levels:**

```typescript
enum Priority {
  LOW = 1,
  NORMAL = 5,
  HIGH = 10,
  CRITICAL = 20,
}
```

**Tier-Based Multipliers (Cloud-only):**

```typescript
const TIER_MULTIPLIERS = {
  FREE: 1,
  STARTER: 2,
  GROWTH: 5,
  SCALE: 10,
  ENTERPRISE: 100, // + immediate execution, no queue
};
```

**Enterprise Bypass:**

```typescript
if (tier === "ENTERPRISE") {
  // Execute immediately, skip queue
  return await executeJob(job);
}
```

**Queue Configuration:**

```typescript
{
  retention: {
    completed: 3600,  // 1 hour
    failed: 86400     // 24 hours
  },
  rateLimit: {
    max: 100,         // jobs/second
    duration: 1000
  },
  metrics: {
    queueDepth: true,
    jobCounts: true,
    timing: true
  }
}
```

### Background Jobs (12 types)

**Location:** `packages/api/src/jobs/`

| Job                            | Schedule        | OSS Status    | Purpose                              |
| ------------------------------ | --------------- | ------------- | ------------------------------------ |
| `fx-rate-sync.ts`              | Daily 00:00 UTC | ✅ OSS-ready  | Update exchange rates                |
| `data-retention.ts`            | Daily 02:00 UTC | ⚠️ Modify     | Cleanup old data (remove tier logic) |
| `email-scheduler.ts`           | Every 5 min     | ❌ Cloud-only | Transactional email sending          |
| `usage-aggregation.ts`         | Daily 01:00 UTC | ❌ Cloud-only | Aggregate billing usage              |
| `sla-monitoring-job.ts`        | Every 1 min     | ❌ Cloud-only | SLA compliance tracking              |
| `materialized-view-refresh.ts` | Every 15 min    | ❌ Cloud-only | Dashboard analytics                  |
| `operator-mode-daily.ts`       | Daily 08:00 UTC | ❌ Cloud-only | Daily operator report                |
| `webhook-queue.ts`             | Real-time       | ✅ OSS-ready  | Webhook delivery                     |

**Node-Cron Integration:**

```typescript
import cron from "node-cron";

cron.schedule("0 0 * * *", async () => {
  await runFxRateSync();
});
```

---

## 8. EXISTING OSS INFRASTRUCTURE

### Open-Core Strategy (ALREADY PLANNED)

**Philosophy:** Tiered monetization with clear boundaries

| Tier             | Price  | Includes                                                        |
| ---------------- | ------ | --------------------------------------------------------------- |
| **OSS (Free)**   | $0     | SDKs, Protocol types, React components, CLI, Examples           |
| **Cloud (SaaS)** | $99/mo | + Platform integrations, Performance optimizations, Hosting     |
| **Enterprise**   | Custom | + SSO/RBAC, White-label, Custom integrations, Dedicated support |

### Mirror Publishing System (READY TO USE)

**Scripts:**

1. **`scripts/mirror-dryrun.ts`**
   - Exports `OSS_PUBLIC` files to `./.mirror-out/`
   - Generates `mirror-manifest.json` with file hashes
   - Validates no proprietary content

2. **`scripts/mirror-verify.ts`**
   - Checks mirror contains ONLY `OSS_PUBLIC` files
   - Validates against denylist (internal, api, web)
   - SHA256 hash verification

3. **`scripts/mirror-publish.ts`**
   - Pushes to `settler-oss` GitHub repo
   - Requires `ENABLE_MIRROR_PUBLISHING=true`
   - Creates GitHub releases

4. **`scripts/setup-open-core.sh`**
   - Creates backup tags/branches
   - Sets up GitHub Actions workflows
   - Configures repository variables

5. **`scripts/classify-oss.sh`**
   - Finds all `OSS_PUBLIC` marker files

### OSS_PUBLIC Markers (8 packages)

**Files containing `OSS_PUBLIC` marker:**

1. `packages/sdk/OSS_PUBLIC` - Node.js/TypeScript SDK
2. `packages/sdk-python/OSS_PUBLIC` - Python SDK
3. `packages/sdk-go/OSS_PUBLIC` - Go SDK
4. `packages/sdk-ruby/OSS_PUBLIC` - Ruby SDK
5. `packages/protocol/OSS_PUBLIC` - Protocol types
6. `packages/react-settler/OSS_PUBLIC` - React components
7. `packages/cli/OSS_PUBLIC` - CLI tool
8. `examples/OSS_PUBLIC` - Example code
9. `docs/public/OSS_PUBLIC` - Public documentation

### Planned OSS Repository

**Name:** `settler-oss`
**URL:** (to be determined)
**License:** MIT
**Target Structure:**

```
settler-oss/
├── packages/
│   ├── sdk/
│   ├── sdk-python/
│   ├── sdk-go/
│   ├── sdk-ruby/
│   ├── protocol/
│   ├── react-settler/
│   └── cli/
├── examples/
├── docs/
├── README.md
├── LICENSE
├── CONTRIBUTING.md
└── SECURITY.md
```

---

## 9. CLOUD-ONLY VS OSS-READY BREAKDOWN

### 🔴 CLOUD-ONLY (Non-negotiable proprietary)

**Billing & Monetization:**

- Stripe integration (webhooks, checkout, portal)
- Subscription management
- Usage metering and enforcement
- Billing gates (middleware)
- Invoice generation
- Payment recovery

**Console & Admin:**

- Developer console UI (`/console/**`)
- Admin dashboard (`/admin/**`)
- Workspace management
- Real-time collaboration (Socket.io)
- Multi-workspace support

**Adapters (with credentials):**

- All 16+ platform adapters _as implemented_
- Credential encryption service
- OAuth token refresh
- Integration marketplace

**Advanced Features:**

- Feature flags management
- A/B testing framework
- Experiment tracking
- Cross-customer intelligence
- Network effects
- Anomaly detection (requires training data)

**Enterprise:**

- SSO/OAuth integration
- RBAC (Role-Based Access Control)
- White-label capabilities
- Audit logging (multi-tenant)
- Compliance features (SOC 2, GDPR)
- Team management

**Operations:**

- Operator mode
- Health dashboards
- Analytics and reporting
- Error monitoring (Sentry integration)
- Metrics collection (OpenTelemetry → cloud backend)

---

### 🟢 OSS-READY (Can be published as-is)

**SDKs (4 languages):**

- ✅ `packages/sdk` - Node.js/TypeScript
- ✅ `packages/sdk-python` - Python
- ✅ `packages/sdk-go` - Go
- ✅ `packages/sdk-ruby` - Ruby

**Protocol & Types:**

- ✅ `packages/protocol` - Shared data structures
- ✅ Type definitions - Serializable models
- ✅ API contracts - REST API spec

**React Components:**

- ✅ `packages/react-settler` - UI library
- ✅ Config compiler - JSON extraction
- ✅ Validation hooks
- ✅ Mobile responsive
- ✅ Accessibility (WCAG 2.1 AA)

**CLI:**

- ✅ `packages/cli` - Command-line tool
- ✅ Configuration management

**Examples:**

- ✅ `examples/` - Integration examples
- ✅ Tutorial code

**Documentation:**

- ✅ `docs/public/` - Public docs
- ✅ API reference
- ✅ Getting started guides

---

### 🟡 HYBRID (Needs modification for OSS)

**Reconciliation Engine:**

- ✅ Core matching logic - OSS-ready
- ❌ Billing enforcement - Remove
- ❌ Tier-based priority - Remove
- ✅ Base algorithm - OSS-ready

**Job System:**

- ✅ Job runner base - OSS-ready
- ❌ Queue prioritization by tier - Remove
- ❌ Usage metering - Remove
- ✅ Basic scheduling - OSS-ready

**Adapter Base:**

- ✅ Adapter interface - OSS-ready
- ✅ Rate limiting - OSS-ready
- ✅ Retry logic - OSS-ready
- ❌ Credential encryption - Remove (provide interface)
- ❌ OAuth flow - Remove (provide docs)

**Receipt OCR:**

- ✅ OCR logic - OSS-ready (if model included)
- ❌ Cloud storage - Replace with local filesystem
- ❌ Usage metering - Remove

---

## 10. SECURITY & COMPLIANCE

### Data Protection (Cloud-only)

- **RLS Policies** - Row-level security on all tables
- **Credential Encryption** - AES-256 before storage
- **Multi-tenant Isolation** - Database-enforced boundaries
- **PII Sanitization** - Automatic redaction in logs

### Authentication (Cloud)

- **Supabase Auth** - JWT-based
- **Service Role** - Admin API access
- **Session Management** - Secure cookie-based
- **OAuth Providers** - Google, GitHub, etc.

### Rate Limiting (OSS-ready base)

- **Express Rate Limit** - IP-based throttling
- **Custom Limiters** - Per-endpoint configuration
- **Redis-backed** - Distributed rate limiting

### Security Headers (OSS-ready)

```typescript
{
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Content-Security-Policy': "default-src 'self'; ..."
}
```

### Observability (Cloud-only backends)

- **OpenTelemetry** - Distributed tracing → cloud collector
- **Sentry** - Error tracking → Sentry.io
- **Winston** - Structured logging → cloud storage
- **Prometheus** - Metrics → cloud monitoring

---

## 11. DEPLOYMENT & INFRASTRUCTURE (CLOUD-SPECIFIC)

### Vercel Deployment

- **Target:** Vercel Edge Network + Serverless Functions
- **Regions:** Global edge, us-east-1 (primary functions)
- **Build:** Custom `vercel-build-optimizer.js`
- **Memory:** 4GB Node.js heap during build
- **Caching:** Turbo remote caching via Vercel

### Environment Variables (Cloud-only secrets)

**Required at Runtime:**

```bash
DATABASE_URL                # Supabase PostgreSQL
STRIPE_API_KEY             # Stripe secret key
STRIPE_WEBHOOK_SECRET      # Webhook signature verification
SUPABASE_URL               # Supabase project URL
SUPABASE_ANON_KEY          # Supabase anon key
SUPABASE_SERVICE_ROLE_KEY  # Admin access
REDIS_URL                  # Upstash Redis (Vercel KV)
OPENAI_API_KEY             # GPT integration
RESEND_API_KEY             # Email service
SENTRY_DSN                 # Error tracking
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
```

**Build-Time:**

```bash
PRISMA_SCHEMA_PATH
VERCEL=1
```

---

## 12. MONOREPO STRUCTURE

```
settler-monorepo/
├── packages/
│   ├── web/              # Next.js 14 frontend (PROPRIETARY)
│   ├── api/              # Express backend (PROPRIETARY)
│   ├── adapters/         # 16+ integrations (PROPRIETARY)
│   ├── sdk/              # Node.js SDK (OSS_PUBLIC)
│   ├── sdk-python/       # Python SDK (OSS_PUBLIC)
│   ├── sdk-go/           # Go SDK (OSS_PUBLIC)
│   ├── sdk-ruby/         # Ruby SDK (OSS_PUBLIC)
│   ├── protocol/         # Protocol types (OSS_PUBLIC)
│   ├── react-settler/    # React components (OSS_PUBLIC)
│   ├── cli/              # CLI tool (OSS_PUBLIC)
│   ├── types/            # Shared types (INTERNAL)
│   ├── edge-ai-core/     # Edge AI (PROPRIETARY)
│   └── edge-node/        # Edge runtime (PROPRIETARY)
├── prisma/               # Database schema (PROPRIETARY)
├── supabase/             # Migrations (PROPRIETARY)
├── scripts/              # Automation
│   ├── mirror-*.ts       # OSS publishing (INTERNAL)
│   └── [30+ scripts]
├── docs/
│   ├── public/           # Public docs (OSS_PUBLIC)
│   └── internal/         # Private docs (INTERNAL)
├── examples/             # Examples (OSS_PUBLIC)
└── .github/workflows/    # CI/CD (INTERNAL)
```

---

## 13. KEY STATISTICS

| Metric                     | Value                            |
| -------------------------- | -------------------------------- |
| **Total Packages**         | 14                               |
| **OSS-Marked Packages**    | 8                                |
| **Prisma Models**          | 40+                              |
| **Database Migrations**    | 15+                              |
| **Next.js Routes (dirs)**  | 165+                             |
| **API Route Directories**  | 42                               |
| **Middleware Functions**   | 9                                |
| **Adapters**               | 16+                              |
| **Background Job Types**   | 12                               |
| **Stripe Event Types**     | 6 (handled)                      |
| **Pricing Tiers**          | 4 (Reconciliation) + 4 (Edge AI) |
| **SDK Languages**          | 4                                |
| **Lines of Prisma Schema** | 1,253                            |
| **Console Routes**         | 47+                              |
| **Admin Routes**           | 16+                              |

---

## 14. CRITICAL FILES FOR OSS EXTRACTION

### Must Read (Cloud Secrets)

- `.env.example` - All secret keys (do NOT copy values)
- `.env.example.billing` - Stripe keys
- `.env.example.integrations` - Adapter credentials
- `.gitleaks.toml` - Secret detection patterns
- `SECURITY.md` - Security disclosures

### Must Preserve (OSS)

- `LICENSE` - Current: Proprietary → Change to MIT for OSS
- `CONTRIBUTING.md` - Contribution guidelines
- `CODE_OF_CONDUCT.md` - Community standards
- `.gitignore` - Ignore patterns
- `.editorconfig` - Editor settings
- `.prettierrc` - Code formatting
- `.eslintrc.js` - Linting rules

### Must Transform

- `README.md` → `README.public.md` (create new for OSS)
- `package.json` - Remove proprietary dependencies
- Prisma schema - Extract OSS-only models
- Next.js config - Remove Vercel-specific settings

---

## 15. RECOMMENDATIONS FOR OSS EXTRACTION

### Phase 1: SDK-Only Release (Low Effort, High Impact)

**Publish immediately:**

```
settler-oss/
├── packages/sdk/
├── packages/sdk-python/
├── packages/sdk-go/
├── packages/sdk-ruby/
├── packages/protocol/
├── packages/cli/
├── examples/
├── docs/public/
└── README.md (new, SDK-focused)
```

**Effort:** Low - Already marked, just run mirror scripts
**Impact:** High - Drives API adoption

---

### Phase 2: React Components Library (Medium Effort)

**Add to OSS:**

```
+ packages/react-settler/
```

**Effort:** Medium - Ensure no Cloud dependencies
**Impact:** Medium - Enables custom UIs

---

### Phase 3: Self-Hosted Core (High Effort, High Impact)

**Create new repo: `settler-self-hosted`**

```
settler-self-hosted/
├── packages/
│   ├── core/             # Reconciliation engine (NEW)
│   │   ├── matcher.ts    # Matching algorithm
│   │   ├── scorer.ts     # Score calculation
│   │   └── reconciler.ts # Orchestrator
│   ├── adapters/         # Adapter interfaces (NEW)
│   │   ├── base.ts       # Base adapter class
│   │   ├── csv.ts        # CSV adapter (demo)
│   │   └── README.md     # Adapter dev guide
│   ├── app/              # Next.js app (NEW, simplified)
│   └── db/               # Prisma schema (NEW, minimal)
├── docker-compose.yml    # Local stack
├── .env.example          # No secrets
└── README.md             # Self-hosting guide
```

**What to EXCLUDE from self-hosted:**

- Stripe billing
- Console UI (provide basic alternative)
- Enterprise features (SSO, RBAC, white-label)
- Adapter marketplace
- Multi-tenancy (optional: single-tenant mode)

**Effort:** High - New app, new DB schema, new docs
**Impact:** High - Competitive advantage vs. cloud-only competitors

---

## 16. SECURITY AUDIT FINDINGS

### Secrets Currently in Repo (DO NOT LEAK TO OSS)

✅ **GOOD:** `.env.example` files contain placeholders only
✅ **GOOD:** `.gitleaks.toml` configured to detect secrets
✅ **GOOD:** `.gitignore` excludes `.env` files

**Verification Required:**

- Ensure no `.env` files committed
- Check for hardcoded API keys in code
- Verify no customer data in fixtures

### Credential Storage

**Current (Cloud):**

- Encrypted in database via `credential-encryption.ts`
- AES-256-GCM
- Keys stored in environment variables

**OSS Approach:**

- Provide interface only
- Document: "Implement your own credential storage"
- Example: local file (insecure, dev-only)

---

## CONCLUSION

Settler Cloud is a **production-ready, enterprise SaaS platform** with:

✅ **Solid Foundation:** Well-architected monorepo, clear package boundaries
✅ **OSS Strategy:** 8 packages already marked, mirror scripts ready
✅ **Clear Separation:** Cloud-only features well-isolated
✅ **Security-First:** RLS, encryption, rate limiting, secret management

**Recommended OSS Approach:**

1. **Immediate:** Publish SDK packages (already marked)
2. **Short-term:** Add reconciliation engine core (extract from API package)
3. **Long-term:** Self-hosted option (new repo, simplified stack)

**Key Challenges:**

- **Billing Removal:** Must remove all Stripe references and billing gates
- **Auth Fallback:** Provide local dev mode without Supabase
- **Adapter Stubs:** Replace Cloud adapters with interfaces + docs
- **Database Simplification:** Reduce 40+ models to ~10 core models

**Next Steps:**

1. Run `pnpm mirror:dryrun` to verify OSS package extraction
2. Create `settler-oss` repository
3. Build minimal Next.js app for OSS (reconciliation demo)
4. Write `OSS_SCOPE.md` defining product boundaries
5. Implement graceful degradation (no hard 500s when Cloud features missing)

---

**END OF CLOUD AUDIT REPORT**
