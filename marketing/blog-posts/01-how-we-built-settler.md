# How We Built Settler: Reconciliation-as-a-Service

**Published:** 2026-01-15  
**Author:** Scott Hardie  
**Category:** Engineering, Product

---

## Introduction

Settler is reconciliation-as-a-service—a single API that normalizes, validates, and reconciles data across all platforms in real-time. In this post, I'll share how we built it, the technical decisions we made, and the lessons we learned.

---

## The Problem

Modern businesses operate across 10+ platforms: Stripe for payments, Shopify for orders, QuickBooks for accounting, NetSuite for ERP. Each platform has its own data format, timing, and quirks. Finance teams spend 2-3 hours daily manually reconciling transactions.

**The Challenge:** How do you build a reconciliation system that:
- Works with any platform (not just Stripe or Shopify)
- Handles millions of transactions
- Provides 99%+ accuracy
- Integrates in 5 minutes (not 5 days)

---

## Architecture Decisions

### 1. Adapter Pattern

**Decision:** Use adapter pattern for platform integrations

**Why:**
- Each platform (Stripe, Shopify, PayPal) has different APIs
- Adapters normalize data to a canonical format
- Easy to add new platforms (just add an adapter)
- Composable (mix and match adapters)

**Implementation:**
```typescript
interface Adapter {
  fetchTransactions(config: AdapterConfig): Promise<Transaction[]>;
  normalize(transaction: unknown): CanonicalTransaction;
}

class StripeAdapter implements Adapter {
  async fetchTransactions(config: StripeConfig) {
    // Fetch from Stripe API
    // Normalize to canonical format
  }
}
```

### 2. Event-Driven Architecture

**Decision:** Use event sourcing for reconciliation state

**Why:**
- Complete audit trail
- Can replay events for debugging
- Supports real-time reconciliation
- Scales horizontally

**Implementation:**
- Events: `TransactionIngested`, `MatchFound`, `ExceptionCreated`
- Event store: PostgreSQL with JSONB
- Projections: Materialized views for fast queries

### 3. Matching Engine

**Decision:** Configurable matching rules with confidence scoring

**Why:**
- Different businesses need different matching logic
- Confidence scores help prioritize exceptions
- Rules can be updated without code changes

**Implementation:**
```typescript
interface MatchingRule {
  field: string;
  type: "exact" | "fuzzy" | "range";
  tolerance?: number;
}

function match(rule: MatchingRule, source: Transaction, target: Transaction): number {
  // Returns confidence score 0-1
}
```

### 4. Serverless-First

**Decision:** Build for serverless (Vercel, AWS Lambda)

**Why:**
- Automatic scaling
- Pay only for what you use
- No infrastructure management
- Global edge deployment

**Implementation:**
- Express.js API (runs on Vercel Functions)
- Stateless design
- External database (Supabase/PostgreSQL)
- Redis for caching

---

## Technical Stack

### Backend
- **Runtime:** Node.js 20+ (TypeScript)
- **Framework:** Express.js
- **Database:** PostgreSQL (Supabase)
- **Cache:** Redis (Upstash)
- **Queue:** BullMQ (Redis-backed)
- **Observability:** OpenTelemetry, Sentry

### Frontend
- **Framework:** Next.js 14
- **Language:** TypeScript
- **Styling:** Tailwind CSS

### Infrastructure
- **Hosting:** Vercel (API + Web UI)
- **Database:** Supabase (PostgreSQL)
- **Cache:** Upstash Redis
- **Monitoring:** Sentry, Grafana

---

## Key Challenges & Solutions

### Challenge 1: Multi-Currency Reconciliation

**Problem:** Transactions in different currencies (EUR vs USD)

**Solution:** FX conversion service with configurable rate sources
- Fetch rates from ECB/OANDA
- Convert to base currency
- Track conversion rates for audit

### Challenge 2: Real-Time Matching

**Problem:** Match transactions as they arrive (not batch)

**Solution:** Event-driven matching engine
- Ingest transactions via webhooks
- Match immediately using graph algorithm
- Update state atomically

### Challenge 3: Exception Handling

**Problem:** Some transactions don't match (need human review)

**Solution:** Exception queue with resolution workflow
- Track unmatched transactions
- Provide context (why didn't match)
- Support bulk resolution
- Audit trail for compliance

### Challenge 4: Scale

**Problem:** Handle millions of transactions

**Solution:** Horizontal scaling + optimization
- Partition tables by month
- Materialized views for reports
- Indexed queries
- Connection pooling

---

## Lessons Learned

### 1. Start with Adapters

Building adapters first forced us to think about the canonical data model early. This made everything else easier.

### 2. Event Sourcing is Worth It

The audit trail is invaluable. Customers trust us because they can see exactly what happened.

### 3. Developer Experience Matters

Clear error messages, good docs, and code examples make all the difference. We spent 30% of our time on DX.

### 4. Test Mode is Essential

Developers need to test without affecting production. Test mode was one of our most requested features.

---

## What's Next

- **Multi-currency support** (FX conversion)
- **More adapters** (Xero, NetSuite, etc.)
- **AI-powered matching** (learn from resolutions)
- **Real-time dashboards** (visualize reconciliation)

---

## Try It Yourself

```bash
npm install @settler/sdk
```

```typescript
import Settler from "@settler/sdk";

const settler = new Settler({ apiKey: "sk_test_..." });

const job = await settler.jobs.create({
  name: "Shopify-Stripe Reconciliation",
  source: { adapter: "shopify", config: { /* ... */ } },
  target: { adapter: "stripe", config: { /* ... */ } },
  rules: { matching: [{ field: "order_id", type: "exact" }] },
});
```

---

**Questions?** Reach out on [Twitter](https://twitter.com/settler_io) or [Discord](https://discord.gg/settler).
