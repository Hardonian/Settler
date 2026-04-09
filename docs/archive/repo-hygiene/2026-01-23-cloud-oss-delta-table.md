# SETTLER CLOUD → OSS DELTA TABLE

**Generated:** 2026-01-23
**Purpose:** Comprehensive comparison of what exists in Cloud vs what should go to OSS
**Status Key:** ✅ Port As-Is | ⚠️ Rebuild Minimal | 🔄 Modify | ❌ Exclude | 🆕 Create New

---

## SUBSYSTEM COMPARISON

| Subsystem                   | In Cloud?            | In OSS? | Action             | Reason                                         | Estimated Effort |
| --------------------------- | -------------------- | ------- | ------------------ | ---------------------------------------------- | ---------------- |
| **SDKs (Node.js)**          | ✅ Yes               | ❌ No   | ✅ Port As-Is      | Already marked OSS_PUBLIC, no Cloud deps       | 1 hour (mirror)  |
| **SDKs (Python)**           | ✅ Yes               | ❌ No   | ✅ Port As-Is      | Already marked OSS_PUBLIC, standalone          | 1 hour (mirror)  |
| **SDKs (Go)**               | ✅ Yes               | ❌ No   | ✅ Port As-Is      | Already marked OSS_PUBLIC, idiomatic Go        | 1 hour (mirror)  |
| **SDKs (Ruby)**             | ✅ Yes               | ❌ No   | ✅ Port As-Is      | Already marked OSS_PUBLIC, gem-ready           | 1 hour (mirror)  |
| **Protocol Types**          | ✅ Yes               | ❌ No   | ✅ Port As-Is      | Serialization layer, no secrets                | 1 hour (mirror)  |
| **React Components**        | ✅ Yes               | ❌ No   | 🔄 Modify          | Remove Cloud-specific components (billing UI)  | 4 hours          |
| **CLI Tool**                | ✅ Yes               | ❌ No   | 🔄 Modify          | Remove Cloud API calls, add local mode         | 4 hours          |
| **Examples**                | ✅ Yes               | ❌ No   | 🔄 Modify          | Update to use OSS-only features                | 2 hours          |
| **Public Docs**             | ✅ Yes               | ❌ No   | 🔄 Modify          | Remove Cloud feature references                | 3 hours          |
| **Reconciliation Engine**   | ✅ Yes (in API pkg)  | ❌ No   | 🆕 Create New      | Extract from Cloud, remove billing gates       | 16 hours         |
| **Adapter Base Classes**    | ✅ Yes               | ❌ No   | 🆕 Create New      | Interface-only, no credential encryption       | 8 hours          |
| **Demo CSV Adapter**        | ⚠️ Basic exists      | ❌ No   | 🆕 Create New      | Simple file-based adapter for demo             | 4 hours          |
| **Minimal Database Schema** | ✅ Yes (40+ models)  | ❌ No   | 🆕 Create New      | 5-10 models only (no billing, no multi-tenant) | 8 hours          |
| **OSS Next.js App**         | ❌ No                | ❌ No   | 🆕 Create New      | Minimal reconciliation demo UI                 | 24 hours         |
| **Auth System**             | ✅ Yes (Supabase)    | ❌ No   | 🆕 Create New      | Dev mode with mock session, optional NextAuth  | 8 hours          |
| **Local Storage**           | ✅ Yes (Supabase)    | ❌ No   | 🆕 Create New      | SQLite or in-memory fallback                   | 6 hours          |
| **Billing/Stripe**          | ✅ Yes               | ❌ No   | ❌ Exclude         | Proprietary SaaS feature                       | 0 hours          |
| **Console UI**              | ✅ Yes (47 routes)   | ❌ No   | ❌ Exclude         | Proprietary, replace with basic dashboard      | 0 hours          |
| **Admin Dashboard**         | ✅ Yes (16 routes)   | ❌ No   | ❌ Exclude         | Cloud-only multi-tenant management             | 0 hours          |
| **Feature Flags**           | ✅ Yes               | ❌ No   | ❌ Exclude         | Enterprise feature, not needed for OSS         | 0 hours          |
| **A/B Testing**             | ✅ Yes               | ❌ No   | ❌ Exclude         | SaaS optimization feature                      | 0 hours          |
| **16+ Platform Adapters**   | ✅ Yes               | ❌ No   | ❌ Exclude         | Proprietary integrations (OAuth, credentials)  | 0 hours          |
| **Background Jobs/Queue**   | ✅ Yes               | ❌ No   | ⚠️ Rebuild Minimal | Simple cron without tier prioritization        | 6 hours          |
| **Webhook System**          | ✅ Yes               | ❌ No   | ⚠️ Rebuild Minimal | Basic webhook delivery (no Cloud telemetry)    | 4 hours          |
| **RLS Policies**            | ✅ Yes               | ❌ No   | ❌ Exclude         | Multi-tenant security, not needed for OSS      | 0 hours          |
| **Usage Metering**          | ✅ Yes               | ❌ No   | ❌ Exclude         | Billing feature                                | 0 hours          |
| **Operator Mode**           | ✅ Yes               | ❌ No   | ❌ Exclude         | Cloud operations tooling                       | 0 hours          |
| **Enterprise SSO**          | ✅ Yes               | ❌ No   | ❌ Exclude         | Enterprise feature                             | 0 hours          |
| **RBAC**                    | ✅ Yes               | ❌ No   | ❌ Exclude         | Enterprise feature                             | 0 hours          |
| **Audit Logging**           | ✅ Yes               | ❌ No   | ❌ Exclude         | Multi-tenant compliance feature                | 0 hours          |
| **OpenTelemetry**           | ✅ Yes               | ❌ No   | ⚠️ Rebuild Minimal | Basic console logging only (no cloud exporter) | 2 hours          |
| **Sentry Integration**      | ✅ Yes               | ❌ No   | ❌ Exclude         | Cloud monitoring                               | 0 hours          |
| **CI/CD (Vercel)**          | ✅ Yes               | ❌ No   | 🆕 Create New      | GitHub Actions for OSS (lint/test/build)       | 4 hours          |
| **Docker Compose**          | ❌ No                | ❌ No   | 🆕 Create New      | Local dev stack (Postgres, Redis optional)     | 6 hours          |
| **README**                  | ✅ Yes (Enterprise)  | ❌ No   | 🆕 Create New      | SDK-focused, no enterprise pitch               | 2 hours          |
| **OSS_SCOPE.md**            | ❌ No                | ❌ No   | 🆕 Create New      | Define OSS vs Cloud boundaries                 | 2 hours          |
| **ARCHITECTURE.md**         | ⚠️ Partial           | ❌ No   | 🆕 Create New      | OSS architecture overview                      | 3 hours          |
| **CLOUD_VS_OSS.md**         | ❌ No                | ❌ No   | 🆕 Create New      | Honest feature comparison                      | 2 hours          |
| **LICENSE**                 | ✅ Yes (Proprietary) | ❌ No   | 🆕 Create New      | MIT or Apache 2.0                              | 0.5 hours        |

**Total Estimated Effort:** ~120 hours (~3 weeks part-time, ~1.5 weeks full-time)

---

## DETAILED BREAKDOWN BY CATEGORY

### 1. AUTHENTICATION

| Component              | Cloud Implementation              | OSS Status | OSS Strategy         | Notes                                   |
| ---------------------- | --------------------------------- | ---------- | -------------------- | --------------------------------------- |
| **Supabase Auth**      | ✅ Full JWT auth, OAuth providers | ❌ Exclude | 🆕 Dev mode fallback | Provide mock user session for local dev |
| **Session Management** | ✅ Secure cookies, RLS policies   | ❌ Exclude | 🆕 Simple cookie/JWT | No RLS needed (single-user mode)        |
| **OAuth Providers**    | ✅ Google, GitHub, etc.           | ❌ Exclude | ⚠️ Optional NextAuth | Document how to add if needed           |
| **Service Role**       | ✅ Admin API access               | ❌ Exclude | N/A                  | Not needed for OSS                      |
| **Password Reset**     | ✅ Email-based flow               | ❌ Exclude | ⚠️ Optional          | Could add with Resend or local SMTP     |

**OSS Auth Strategy:**

```typescript
// Dev mode (default)
if (!process.env.SUPABASE_URL) {
  return {
    user: { id: "dev-user", email: "dev@localhost" },
    session: { mock: true },
  };
}

// Optional: NextAuth for production self-hosting
```

---

### 2. DATABASE & STORAGE

| Component                  | Cloud Schema               | OSS Schema  | Change        | Reason                                   |
| -------------------------- | -------------------------- | ----------- | ------------- | ---------------------------------------- |
| **BillingAccount**         | ✅ 8 fields + Stripe refs  | ❌ Remove   | ❌ Exclude    | Billing is Cloud-only                    |
| **Subscription**           | ✅ Full subscription state | ❌ Remove   | ❌ Exclude    | Billing is Cloud-only                    |
| **StripeEvent**            | ✅ Webhook idempotency     | ❌ Remove   | ❌ Exclude    | Stripe is Cloud-only                     |
| **UsageEvent**             | ✅ Metered billing events  | ❌ Remove   | ❌ Exclude    | Billing is Cloud-only                    |
| **UsageAggregateDaily**    | ✅ Daily rollups           | ❌ Remove   | ❌ Exclude    | Billing is Cloud-only                    |
| **AddOn**                  | ✅ Add-on products         | ❌ Remove   | ❌ Exclude    | Billing is Cloud-only                    |
| **AddOnPurchase**          | ✅ Purchase records        | ❌ Remove   | ❌ Exclude    | Billing is Cloud-only                    |
| **Tenant**                 | ✅ Multi-tenant isolation  | ❌ Remove   | ❌ Exclude    | Cloud multi-tenancy                      |
| **Membership**             | ✅ Tenant members          | ❌ Remove   | ❌ Exclude    | Cloud multi-tenancy                      |
| **TenantBranding**         | ✅ White-label config      | ❌ Remove   | ❌ Exclude    | Enterprise feature                       |
| **OnboardingProgress**     | ✅ User onboarding state   | ❌ Remove   | ❌ Exclude    | Cloud-only                               |
| **FeatureFlag**            | ✅ Flag definitions        | ❌ Remove   | ❌ Exclude    | Cloud-only                               |
| **FeatureFlagEnvironment** | ✅ Per-env config          | ❌ Remove   | ❌ Exclude    | Cloud-only                               |
| **FeatureFlagOverride**    | ✅ Per-tenant overrides    | ❌ Remove   | ❌ Exclude    | Cloud-only                               |
| **Experiment**             | ✅ A/B testing             | ❌ Remove   | ❌ Exclude    | Cloud-only                               |
| **ExperimentVariant**      | ✅ Test variants           | ❌ Remove   | ❌ Exclude    | Cloud-only                               |
| **AuditLog**               | ✅ Compliance audit trail  | ❌ Remove   | ❌ Exclude    | Cloud multi-tenant feature               |
| **ReconJob**               | ✅ Job execution           | ✅ Keep     | 🔄 Modify     | Remove tenant_id, keep core fields       |
| **ReconResult**            | ✅ Job results             | ✅ Keep     | ✅ Port As-Is | Core reconciliation output               |
| **ReconTemplate**          | ✅ Saved configs           | ✅ Keep     | 🔄 Modify     | Remove tenant_id                         |
| **ReconAudit**             | ✅ Job audit log           | ⚠️ Optional | ⚠️ Simplify   | Single-user mode doesn't need full audit |
| **Receipt**                | ✅ OCR receipts            | ⚠️ Optional | 🔄 Modify     | If OCR included, keep; else remove       |
| **ReceiptItem**            | ✅ Line items              | ⚠️ Optional | 🔄 Modify     | If OCR included, keep; else remove       |
| **MappingTemplate**        | ✅ Data mapping            | ✅ Keep     | ✅ Port As-Is | Core feature                             |
| **ValidationRule**         | ✅ Data validation         | ✅ Keep     | ✅ Port As-Is | Core feature                             |
| **TransformRecipe**        | ✅ Data transformation     | ✅ Keep     | ✅ Port As-Is | Core feature                             |
| **Webhook**                | ✅ Outbound webhooks       | ⚠️ Optional | ⚠️ Simplify   | Basic webhook delivery                   |
| **WebhookDelivery**        | ✅ Delivery tracking       | ⚠️ Optional | ⚠️ Simplify   | Basic retry logic                        |

**Minimal OSS Schema (7 models):**

```prisma
model ReconJob {
  id          String   @id @default(uuid())
  status      String
  config      Json
  created_at  DateTime @default(now())
  completed_at DateTime?
  results     ReconResult[]
}

model ReconResult {
  id           String @id @default(uuid())
  recon_job_id String
  matched      Json[]
  unmatched    Json[]
  anomalies    Json[]
  job          ReconJob @relation(fields: [recon_job_id], references: [id])
}

model ReconTemplate {
  id        String @id @default(uuid())
  name      String
  config    Json
}

model MappingTemplate {
  id     String @id @default(uuid())
  name   String
  rules  Json
}

model ValidationRule {
  id     String @id @default(uuid())
  name   String
  rule   Json
}

model TransformRecipe {
  id     String @id @default(uuid())
  name   String
  steps  Json
}

model Webhook {
  id     String @id @default(uuid())
  url    String
  events String[]
  secret String?
}
```

**Storage Strategy:**

- **Development:** SQLite (single file, no server needed)
- **Production (self-hosted):** PostgreSQL
- **Fallback:** In-memory (no persistence)

---

### 3. API ROUTES

| Cloud Route            | OSS Status  | Action        | OSS Route (if different)                |
| ---------------------- | ----------- | ------------- | --------------------------------------- |
| `/api/admin/**`        | ❌ Exclude  | Remove        | N/A                                     |
| `/api/ai/**`           | ❌ Exclude  | Remove        | N/A                                     |
| `/api/billing/**`      | ❌ Exclude  | Remove        | N/A                                     |
| `/api/stripe/**`       | ❌ Exclude  | Remove        | N/A                                     |
| `/api/console/**`      | ❌ Exclude  | Remove        | N/A                                     |
| `/api/connectors/**`   | ❌ Exclude  | Rebuild       | `/api/adapters/**` (simple CRUD)        |
| `/api/integrations/**` | ❌ Exclude  | Remove        | N/A                                     |
| `/api/rbac/**`         | ❌ Exclude  | Remove        | N/A                                     |
| `/api/ops/**`          | ❌ Exclude  | Remove        | N/A                                     |
| `/api/enterprise/**`   | ❌ Exclude  | Remove        | N/A                                     |
| `/api/onboarding/**`   | ❌ Exclude  | Remove        | N/A                                     |
| `/api/runs/**`         | ✅ Keep     | 🔄 Modify     | `/api/runs/**` (remove billing gates)   |
| `/api/projects/**`     | ⚠️ Optional | 🔄 Simplify   | `/api/jobs/**` (rename, simplify)       |
| `/api/health`          | ✅ Keep     | ✅ Port As-Is | `/api/health`                           |
| `/api/public/**`       | ✅ Keep     | ✅ Port As-Is | `/api/public/**`                        |
| `/api/v1/**`           | ✅ Keep     | 🔄 Modify     | `/api/v1/**` (remove paid features)     |
| `/api/pricing`         | ⚠️ Optional | 🔄 Modify     | `/api/oss-vs-cloud` (honest comparison) |

**New OSS-Specific Routes:**

```
/api/
├── health              # Health check
├── runs/               # Reconciliation jobs
│   ├── POST /          # Create job
│   ├── GET /:id        # Get job status
│   └── GET /:id/result # Get job result
├── templates/          # Saved configurations
│   ├── GET /           # List templates
│   ├── POST /          # Create template
│   └── GET /:id        # Get template
├── adapters/           # Adapter management (simple)
│   ├── GET /           # List available adapters
│   └── POST /test      # Test adapter connection
└── webhooks/           # Webhook config (optional)
    ├── GET /           # List webhooks
    ├── POST /          # Create webhook
    └── DELETE /:id     # Delete webhook
```

---

### 4. UI PAGES

| Cloud Page      | OSS Status  | Action        | OSS Page (if different)            |
| --------------- | ----------- | ------------- | ---------------------------------- |
| `/` (marketing) | ✅ Keep     | 🔄 Modify     | `/` (simpler, OSS-focused)         |
| `/pricing`      | ❌ Exclude  | 🔄 Replace    | `/oss-vs-cloud`                    |
| `/console/**`   | ❌ Exclude  | 🆕 Replace    | `/dashboard/**` (minimal)          |
| `/admin/**`     | ❌ Exclude  | Remove        | N/A                                |
| `/billing/**`   | ❌ Exclude  | Remove        | N/A                                |
| `/dashboard/**` | ⚠️ Partial  | 🔄 Simplify   | `/dashboard/**` (no billing/usage) |
| `/docs/**`      | ✅ Keep     | 🔄 Modify     | `/docs/**` (remove Cloud refs)     |
| `/integrations` | ❌ Exclude  | 🔄 Replace    | `/adapters` (demo adapters only)   |
| `/legal/**`     | ✅ Keep     | 🔄 Modify     | `/legal/**` (update for OSS)       |
| `/status`       | ⚠️ Optional | 🔄 Simplify   | `/status` (basic uptime)           |
| `/roadmap`      | ✅ Keep     | ✅ Port As-Is | `/roadmap`                         |
| `/changelog/**` | ✅ Keep     | ✅ Port As-Is | `/changelog/**`                    |
| `/community/**` | ✅ Keep     | ✅ Port As-Is | `/community/**`                    |

**Minimal OSS App Structure:**

```
/app/
├── page.tsx                    # Homepage (OSS intro)
├── docs/                       # Documentation
│   ├── getting-started/
│   ├── sdk/
│   └── adapters/
├── dashboard/                  # Simple dashboard (no console)
│   ├── page.tsx                # Job list
│   ├── runs/[id]/page.tsx      # Job details
│   └── templates/page.tsx      # Saved templates
├── adapters/                   # Available adapters
│   └── page.tsx                # List + docs
└── oss-vs-cloud/               # Feature comparison
    └── page.tsx
```

---

### 5. MIDDLEWARE

| Cloud Middleware            | OSS Status | Action        | Reason                                       |
| --------------------------- | ---------- | ------------- | -------------------------------------------- |
| `api-logger.ts`             | ⚠️ Modify  | 🔄 Simplify   | Remove cloud telemetry, keep console logging |
| `api-wrapper.ts`            | ✅ Keep    | ✅ Port As-Is | Standardized responses are good              |
| `billing-gate-universal.ts` | ❌ Exclude | Remove        | Billing is Cloud-only                        |
| `console-auth.ts`           | ❌ Exclude | Remove        | No console in OSS                            |
| `request-size-limit.ts`     | ✅ Keep    | ✅ Port As-Is | Good security practice                       |
| `security-headers.ts`       | ✅ Keep    | ✅ Port As-Is | Security headers needed                      |
| `usage-enforcement.ts`      | ❌ Exclude | Remove        | Usage quotas are Cloud-only                  |
| `usage-limits.ts`           | ❌ Exclude | Remove        | Plan-based limits are Cloud-only             |
| `usage-tracking.ts`         | ❌ Exclude | Remove        | Billing metering is Cloud-only               |

**OSS Middleware Stack (3 only):**

```typescript
// 1. Security headers
export const securityHeaders = () => {
  /* HSTS, CSP, etc. */
};

// 2. Request validation
export const requestSizeLimit = (maxBytes = 10_000_000) => {
  /* ... */
};

// 3. Simple logging
export const logger = () => {
  /* console.log only, no Sentry */
};
```

---

### 6. RECONCILIATION ENGINE

| Component                   | Cloud Location                                        | OSS Location                               | Change                            |
| --------------------------- | ----------------------------------------------------- | ------------------------------------------ | --------------------------------- |
| **Core Matching Logic**     | `packages/api/src/reconciliation/matcher.ts`          | 🆕 `packages/core/src/matcher.ts`          | Extract, remove billing gates     |
| **Scoring Algorithm**       | `packages/api/src/reconciliation/scorer.ts`           | 🆕 `packages/core/src/scorer.ts`           | Extract, port as-is               |
| **Reconciler Orchestrator** | `packages/api/src/reconciliation/reconciler.ts`       | 🆕 `packages/core/src/reconciler.ts`       | Extract, remove usage tracking    |
| **Transaction Normalizer**  | `packages/api/src/reconciliation/normalizer.ts`       | 🆕 `packages/core/src/normalizer.ts`       | Extract, port as-is               |
| **Anomaly Detector**        | `packages/api/src/reconciliation/anomaly-detector.ts` | ⚠️ `packages/core/src/anomaly-detector.ts` | Simplify (rule-based only, no ML) |

**Reconciliation Algorithm (OSS):**

```typescript
// packages/core/src/reconciler.ts
export class Reconciler {
  async reconcile(sourceA: Transaction[], sourceB: Transaction[]): Promise<ReconciliationResult> {
    // 1. Normalize transactions
    const normalizedA = sourceA.map((t) => this.normalizer.normalize(t));
    const normalizedB = sourceB.map((t) => this.normalizer.normalize(t));

    // 2. Exact match (id/reference)
    const exactMatches = this.matcher.exactMatch(normalizedA, normalizedB);

    // 3. Fuzzy match (amount + date window)
    const remainingA = normalizedA.filter((t) => !exactMatches.some((m) => m.a.id === t.id));
    const remainingB = normalizedB.filter((t) => !exactMatches.some((m) => m.b.id === t.id));
    const fuzzyMatches = this.matcher.fuzzyMatch(remainingA, remainingB);

    // 4. Score matches
    const scoredMatches = [...exactMatches, ...fuzzyMatches].map((m) => ({
      ...m,
      score: this.scorer.score(m.a, m.b),
    }));

    // 5. Detect anomalies
    const anomalies = this.anomalyDetector.detect(scoredMatches);

    // 6. Return results
    return {
      matched: scoredMatches.filter((m) => m.score >= 0.8),
      unmatched: {
        sourceA: remainingA,
        sourceB: remainingB,
      },
      anomalies,
    };
  }
}
```

**What to REMOVE from Cloud implementation:**

- Usage metering calls
- Billing tier checks
- Queue prioritization
- Multi-tenant isolation
- RLS policy enforcement
- Telemetry exports to cloud

**What to KEEP:**

- Core matching algorithm
- Scoring logic
- Fuzzy matching (Levenshtein distance)
- Date window matching
- Amount tolerance matching
- Basic anomaly detection (statistical outliers)

---

### 7. ADAPTERS

| Adapter                | Cloud Status | OSS Status | Strategy                    |
| ---------------------- | ------------ | ---------- | --------------------------- |
| **Stripe**             | ✅ Full impl | ❌ Exclude | Interface + docs only       |
| **PayPal**             | ✅ Full impl | ❌ Exclude | Interface + docs only       |
| **Square**             | ✅ Full impl | ❌ Exclude | Interface + docs only       |
| **Shopify**            | ✅ Full impl | ❌ Exclude | Interface + docs only       |
| **QuickBooks**         | ✅ Full impl | ❌ Exclude | Interface + docs only       |
| **Xero**               | ✅ Full impl | ❌ Exclude | Interface + docs only       |
| **NetSuite**           | ✅ Full impl | ❌ Exclude | Interface + docs only       |
| _[9 more adapters]_    | ✅ Full impl | ❌ Exclude | Interface + docs only       |
| **CSV Adapter**        | ⚠️ Basic     | 🆕 Create  | Full implementation (demo)  |
| **JSON API Adapter**   | ⚠️ Generic   | 🆕 Create  | Generic HTTP client adapter |
| **Adapter Base Class** | ✅ Exists    | 🆕 Create  | Interface-only version      |

**OSS Adapter Package Structure:**

```
packages/adapters/
├── src/
│   ├── base/
│   │   ├── Adapter.ts           # Abstract base class
│   │   ├── types.ts              # Shared types
│   │   └── utils.ts              # Helper functions
│   ├── csv/
│   │   ├── CSVAdapter.ts         # Full implementation
│   │   ├── parser.ts
│   │   └── README.md
│   ├── json-api/
│   │   ├── JSONAPIAdapter.ts     # Generic HTTP adapter
│   │   └── README.md
│   └── index.ts
├── docs/
│   ├── creating-adapters.md      # Guide for OSS users
│   └── examples/
│       ├── stripe-adapter.md     # "How to build a Stripe adapter"
│       └── custom-api.md
└── README.md
```

**Adapter Interface (OSS):**

```typescript
export abstract class Adapter {
  abstract name: string;
  abstract capabilities: AdapterCapabilities;

  // Core methods
  abstract fetch(config: FetchConfig): Promise<Transaction[]>;
  abstract normalize(data: any): Transaction;
  abstract validate(transaction: Transaction): ValidationResult;
  abstract healthCheck(): Promise<HealthStatus>;
}

// Example: CSV Adapter (full implementation)
export class CSVAdapter extends Adapter {
  name = "csv";
  capabilities = {
    supportedOperations: ["fetch"],
    supportsWebhooks: false,
    requiresOAuth: false,
    supportsIncremental: false,
  };

  async fetch(config: FetchConfig): Promise<Transaction[]> {
    const fileContent = await fs.readFile(config.filePath, "utf-8");
    const records = parse(fileContent, { columns: true });
    return records.map((r) => this.normalize(r));
  }

  normalize(record: any): Transaction {
    return {
      id: record.id || uuid(),
      externalId: record.transaction_id,
      source: "csv",
      amount: parseFloat(record.amount),
      currency: record.currency || "USD",
      date: new Date(record.date),
      description: record.description,
    };
  }

  validate(transaction: Transaction): ValidationResult {
    if (!transaction.amount) return { valid: false, errors: ["Missing amount"] };
    if (!transaction.date) return { valid: false, errors: ["Missing date"] };
    return { valid: true };
  }

  async healthCheck(): Promise<HealthStatus> {
    return { healthy: true, message: "CSV adapter ready" };
  }
}
```

**What OSS users can build:**

- Custom adapters for their own APIs
- Shopify adapter (if they have Shopify credentials)
- Stripe adapter (if they have Stripe credentials)
- Any HTTP API adapter

**What's provided:**

- Base class interface
- CSV example (full implementation)
- Generic JSON API adapter
- Documentation on building adapters
- **No credential encryption** (users manage their own secrets)

---

### 8. TELEMETRY & OBSERVABILITY

| Component         | Cloud                          | OSS                  | Change                      |
| ----------------- | ------------------------------ | -------------------- | --------------------------- |
| **OpenTelemetry** | ✅ Full (OTLP export to cloud) | ⚠️ Console logs only | Remove cloud exporter       |
| **Sentry**        | ✅ Error tracking              | ❌ Remove            | Cloud-only monitoring       |
| **Winston**       | ✅ Structured logging          | ⚠️ Console transport | Remove cloud transports     |
| **Prometheus**    | ✅ Metrics collection          | ⚠️ Optional          | Could keep for self-hosters |
| **Health Checks** | ✅ `/api/health`               | ✅ Keep              | Simple uptime check         |

**OSS Observability Strategy:**

```typescript
// Simple console logger
export const logger = {
  info: (msg: string, meta?: object) =>
    console.log(JSON.stringify({ level: "info", msg, ...meta })),
  error: (msg: string, meta?: object) =>
    console.error(JSON.stringify({ level: "error", msg, ...meta })),
  warn: (msg: string, meta?: object) =>
    console.warn(JSON.stringify({ level: "warn", msg, ...meta })),
};

// Optional: Prometheus metrics for self-hosters
if (process.env.ENABLE_METRICS === "true") {
  // Expose /metrics endpoint
}

// Health check
export async function GET() {
  return Response.json({
    status: "healthy",
    version: "1.0.0",
    database: await checkDatabase(),
    timestamp: new Date().toISOString(),
  });
}
```

---

### 9. BACKGROUND JOBS

| Job                            | Cloud          | OSS         | Strategy                            |
| ------------------------------ | -------------- | ----------- | ----------------------------------- |
| `fx-rate-sync.ts`              | ✅ Daily       | ✅ Keep     | OSS-ready (no Cloud deps)           |
| `data-retention.ts`            | ✅ Daily       | ⚠️ Simplify | Remove tier-based retention         |
| `email-scheduler.ts`           | ✅ Every 5min  | ❌ Exclude  | Transactional emails are Cloud-only |
| `usage-aggregation.ts`         | ✅ Daily       | ❌ Exclude  | Billing aggregation is Cloud-only   |
| `sla-monitoring-job.ts`        | ✅ Every 1min  | ❌ Exclude  | SLA tracking is Cloud-only          |
| `materialized-view-refresh.ts` | ✅ Every 15min | ❌ Exclude  | Cloud analytics                     |
| `operator-mode-daily.ts`       | ✅ Daily       | ❌ Exclude  | Cloud operations                    |
| `webhook-queue.ts`             | ✅ Real-time   | ✅ Keep     | Webhook delivery is useful for OSS  |

**OSS Job System (Simple Cron):**

```typescript
// packages/core/src/jobs/scheduler.ts
import cron from "node-cron";

// Daily FX rate sync (free API)
cron.schedule("0 0 * * *", async () => {
  const rates = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
  await saveRates(rates);
});

// Weekly data cleanup (no tier logic)
cron.schedule("0 2 * * 0", async () => {
  await cleanupOldJobs({ olderThan: 90 }); // 90 days for everyone
});

// Webhook delivery (simple retry)
export async function deliverWebhook(webhook: Webhook, payload: any) {
  const maxRetries = 3;
  for (let i = 0; i < maxRetries; i++) {
    try {
      await fetch(webhook.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return { success: true };
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      await sleep(2 ** i * 1000); // Exponential backoff
    }
  }
}
```

**What to REMOVE:**

- BullMQ queue (too complex for OSS)
- Tier-based prioritization
- Enterprise bypass logic
- Redis dependency (use simple cron)
- Usage metering

**What to KEEP:**

- Simple cron scheduling
- Webhook delivery with retry
- FX rate sync
- Data cleanup

---

### 10. CI/CD

| Workflow             | Cloud            | OSS           | Strategy                            |
| -------------------- | ---------------- | ------------- | ----------------------------------- |
| **Vercel Deploy**    | ✅ Auto-deploy   | ❌ Exclude    | Cloud hosting only                  |
| **Lint**             | ✅ ESLint        | ✅ Keep       | Same config                         |
| **Typecheck**        | ✅ TypeScript    | ✅ Keep       | Same config                         |
| **Build**            | ✅ Turbo build   | ✅ Keep       | Same build process                  |
| **Test (Unit)**      | ✅ Jest          | ✅ Keep       | Remove Cloud-dependent tests        |
| **Test (E2E)**       | ✅ Playwright    | ⚠️ Simplify   | Basic smoke tests only              |
| **Security Scan**    | ✅ Gitleaks      | ✅ Keep       | Prevent secret leaks                |
| **Dependency Audit** | ✅ npm audit     | ✅ Keep       | Security best practice              |
| **Publish SDKs**     | ❌ Not automated | 🆕 Create     | Auto-publish to npm/PyPI on release |
| **Mirror Sync**      | ⚠️ Manual        | ❌ Not needed | OSS is source of truth              |

**OSS GitHub Actions Workflow:**

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm lint

  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm typecheck

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm build

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm test

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: gitleaks/gitleaks-action@v2
```

---

### 11. DOCUMENTATION

| Doc                       | Cloud               | OSS       | Change                        |
| ------------------------- | ------------------- | --------- | ----------------------------- |
| `README.md`               | ✅ Enterprise pitch | 🆕 Create | SDK-focused, community-driven |
| `docs/getting-started.md` | ✅ Exists           | 🔄 Modify | Remove Cloud onboarding steps |
| `docs/api-reference.md`   | ✅ Exists           | ✅ Keep   | API docs are OSS-ready        |
| `docs/sdk/**`             | ✅ Exists           | ✅ Keep   | SDK docs are OSS-ready        |
| `docs/adapters/**`        | ⚠️ Cloud adapters   | 🆕 Create | Adapter development guide     |
| `ARCHITECTURE.md`         | ⚠️ Partial          | 🆕 Create | OSS architecture overview     |
| `CLOUD_VS_OSS.md`         | ❌ Doesn't exist    | 🆕 Create | Honest feature comparison     |
| `OSS_SCOPE.md`            | ❌ Doesn't exist    | 🆕 Create | What's OSS, what's Cloud      |
| `CONTRIBUTING.md`         | ✅ Exists           | 🔄 Modify | Update for OSS workflow       |
| `SECURITY.md`             | ✅ Exists           | 🔄 Modify | OSS security disclosure       |
| `LICENSE`                 | ✅ Proprietary      | 🆕 Create | MIT or Apache 2.0             |
| `CODE_OF_CONDUCT.md`      | ✅ Exists           | ✅ Keep   | Community standards           |

---

### 12. DEPENDENCIES

| Dependency              | Cloud       | OSS                | Reason                                      |
| ----------------------- | ----------- | ------------------ | ------------------------------------------- |
| `next`                  | ✅ 14.2.35  | ✅ Keep            | Core framework                              |
| `react`                 | ✅ 18.2.0   | ✅ Keep            | Core framework                              |
| `typescript`            | ✅ 5.3.3    | ✅ Keep            | Language                                    |
| `prisma`                | ✅ 7.1.0    | ⚠️ Keep (optional) | Could use SQLite, optional Postgres         |
| `@supabase/supabase-js` | ✅ Required | ❌ Remove          | Cloud-only (replace with optional NextAuth) |
| `stripe`                | ✅ Required | ❌ Remove          | Cloud-only billing                          |
| `@sentry/nextjs`        | ✅ Required | ❌ Remove          | Cloud-only monitoring                       |
| `@vercel/analytics`     | ✅ Required | ❌ Remove          | Cloud-only analytics                        |
| `@vercel/kv`            | ✅ Required | ❌ Remove          | Cloud-only Redis                            |
| `bullmq`                | ✅ Required | ❌ Remove          | Too complex for OSS (use node-cron)         |
| `ioredis`               | ✅ Required | ❌ Remove          | Not needed without BullMQ                   |
| `openai`                | ✅ Required | ❌ Remove          | AI features are Cloud-only                  |
| `socket.io`             | ✅ Required | ❌ Remove          | Real-time collaboration is Cloud-only       |
| `node-cron`             | ✅ Used     | ✅ Keep            | Simple job scheduling                       |
| `zod`                   | ✅ 4.1.13   | ✅ Keep            | Validation                                  |
| `csv-parse`             | ✅ 5.6.0    | ✅ Keep            | CSV adapter needs this                      |
| `framer-motion`         | ✅ Used     | ⚠️ Optional        | Animation library (nice-to-have)            |
| `lucide-react`          | ✅ Used     | ✅ Keep            | Icons                                       |
| `@radix-ui/*`           | ✅ Used     | ✅ Keep            | UI primitives                               |
| `tailwindcss`           | ✅ Used     | ✅ Keep            | Styling                                     |

**Dependency Reduction:**

- Cloud: ~100 dependencies
- OSS: ~30 dependencies (70% reduction)

---

## EFFORT ESTIMATION SUMMARY

### Phase 1: SDK-Only Release (Minimal Effort)

**Effort:** 4-8 hours
**Output:** SDK packages published to npm/PyPI/RubyGems/Go modules

| Task                     | Hours       |
| ------------------------ | ----------- |
| Run mirror dry-run       | 0.5         |
| Verify no secrets        | 1           |
| Create README.public.md  | 2           |
| Create OSS_SCOPE.md      | 2           |
| Set up GitHub Actions    | 2           |
| Test builds in isolation | 1.5         |
| **TOTAL**                | **9 hours** |

---

### Phase 2: Core Engine + Demo App (Medium Effort)

**Effort:** 40-60 hours
**Output:** Working reconciliation demo app

| Task                         | Hours        |
| ---------------------------- | ------------ |
| Extract reconciliation core  | 16           |
| Create adapter base classes  | 8            |
| Build CSV adapter (demo)     | 4            |
| Create minimal Prisma schema | 8            |
| Build OSS Next.js app        | 24           |
| Auth fallback (dev mode)     | 8            |
| Local storage (SQLite)       | 6            |
| Basic job system (cron)      | 6            |
| Webhook delivery (simple)    | 4            |
| Documentation                | 10           |
| **TOTAL**                    | **94 hours** |

---

### Phase 3: Self-Hosted Production (High Effort)

**Effort:** 80-120 hours
**Output:** Production-ready self-hosted option

| Task                       | Hours         |
| -------------------------- | ------------- |
| All of Phase 2             | 94            |
| Docker Compose setup       | 6             |
| Production auth (NextAuth) | 12            |
| Production database setup  | 6             |
| Advanced adapter examples  | 12            |
| CI/CD (full)               | 8             |
| E2E tests                  | 16            |
| Deployment guides          | 8             |
| Security hardening         | 12            |
| Performance optimization   | 16            |
| **TOTAL**                  | **190 hours** |

---

## RISK MATRIX

| Risk                        | Likelihood | Impact   | Mitigation                                              |
| --------------------------- | ---------- | -------- | ------------------------------------------------------- |
| **Secret leakage**          | Medium     | Critical | Run mirror:verify, manual review, gitleaks              |
| **Proprietary code in OSS** | Medium     | High     | Strict allowlist, code review                           |
| **OSS product incomplete**  | High       | High     | Build demo app (Phase 2)                                |
| **Poor OSS adoption**       | Medium     | Medium   | Create working examples, good docs                      |
| **Cloud cannibalization**   | Low        | Medium   | Clear value prop for Cloud (hosting, adapters, support) |
| **Community confusion**     | Medium     | Medium   | Write OSS_SCOPE.md, CLOUD_VS_OSS.md                     |
| **Maintenance burden**      | Medium     | Medium   | Automate mirror sync, clear contribution guidelines     |

---

## RECOMMENDED PATH FORWARD

### Option A: SDK-Only (Fastest, Lowest Risk)

**Timeline:** 1-2 days
**Pros:**

- Minimal effort
- Low risk of leakage
- Builds community early
- Drives API adoption

**Cons:**

- No demo app = limited value for users
- Doesn't showcase reconciliation capabilities
- OSS users still need Cloud for hosting

**Verdict:** ✅ Good first step, but incomplete OSS strategy

---

### Option B: Core + Demo App (Recommended)

**Timeline:** 2-3 weeks
**Pros:**

- Working demo shows value
- OSS users can self-host (basic)
- Clear differentiation from Cloud
- Good developer experience

**Cons:**

- More effort to extract core
- Need to build new OSS app
- Maintenance burden

**Verdict:** ✅ **RECOMMENDED** - Best balance of effort/impact

---

### Option C: Full Self-Hosted (Highest Impact, Highest Effort)

**Timeline:** 6-8 weeks
**Pros:**

- Complete OSS product
- Competitive advantage vs cloud-only
- Maximum community value
- Production-ready self-hosting

**Cons:**

- Significant engineering effort
- Ongoing maintenance burden
- Could cannibalize Cloud revenue

**Verdict:** ⚠️ Consider for future after Option B success

---

## CONCLUSION

**Current State:**

- **Cloud:** Production-ready, 14 packages, comprehensive features
- **OSS:** Does not exist, but 8 packages marked and ready

**Delta:**

- **Exclude:** 60% of Cloud code (billing, console, adapters with credentials, enterprise features)
- **Port as-is:** 20% (SDKs, protocol, some React components)
- **Rebuild:** 20% (core engine, minimal app, adapter interfaces)

**Next Steps:**

1. ✅ Run `pnpm mirror:dryrun` to verify SDK extraction
2. ✅ Create OSS repository structure
3. 🆕 Build minimal reconciliation demo app
4. 🆕 Extract core engine from Cloud
5. 📝 Write OSS-focused documentation
6. 🚀 Launch OSS repository

**Estimated Total Effort:** 94-190 hours (depending on scope)
**Recommended Start:** Option B (Core + Demo App)

---

**END OF DELTA TABLE**
