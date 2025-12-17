# Settler.dev — Product Overview

**Version:** 1.0  
**Date:** January 2026  
**Audience:** Product, Engineering, Sales

---

## What is Settler?

Settler is a **reconciliation-as-a-service API** that automates financial data matching across payment processors, e-commerce platforms, and accounting systems.

### Core Value Proposition

**Eliminate manual reconciliation work.** Reduce hours of manual matching to minutes of automated processing.

---

## Product Components

### 1. Reconciliation Engine

**What it does:** Matches transactions across multiple platforms automatically.

**How it works:**
1. Configure source adapter (Stripe, Shopify, Database, etc.)
2. Configure target adapter (QuickBooks, Xero, Database, etc.)
3. Define matching rules (amount tolerance, date windows, custom logic)
4. Settler processes reconciliation jobs automatically
5. Results available via API, webhooks, or dashboard

**Key Features:**
- Event-sourced matching engine
- Deterministic math (no floating-point errors)
- Custom matching rules
- Audit trail for all matches

**Current Status:** ✅ Implemented (core engine)

### 2. Receipts API

**What it does:** Parses receipts from PDFs/images into structured JSON.

**How it works:**
1. Upload receipt (PDF or image)
2. Settler extracts: vendor, date, total, line items, tax
3. Returns structured JSON

**Key Features:**
- AI-powered OCR
- Multi-format support (PDF, PNG, JPG)
- Structured output (JSON)

**Current Status:** ⚠️ In progress (basic implementation exists)

### 3. Currency Conversion

**What it does:** Converts currencies with deterministic math (no floating-point errors).

**How it works:**
1. Specify amount, source currency, target currency
2. Settler uses deterministic math libraries
3. Returns converted amount

**Key Features:**
- Deterministic math (no rounding errors)
- Real-time FX rates
- Multi-currency support

**Current Status:** ✅ Implemented (basic conversion)

### 4. Feature Flags

**What it does:** Edge-evaluated feature flags for phased rollouts.

**How it works:**
1. Define feature flags in dashboard
2. Evaluate flags via API or SDK
3. Flags evaluated at edge (<10ms latency)

**Key Features:**
- Edge evaluation (low latency)
- Typed payloads
- Instant rollouts

**Current Status:** ✅ Implemented (basic flags)

---

## Platform Adapters

### Currently Available

1. **Stripe** — Payment processor adapter
2. **Shopify** — E-commerce platform adapter
3. **Database** — Generic database adapter (PostgreSQL, MySQL, etc.)

### Planned (Q1-Q3 2026)

4. **QuickBooks** — Accounting system adapter
5. **Xero** — Accounting system adapter
6. **PayPal** — Payment processor adapter
7. **Square** — Payment processor adapter
8. **NetSuite** — ERP adapter
9. **WooCommerce** — E-commerce platform adapter
10. **MCP (Model Context Protocol)** — AI/LLM adapter

**Note:** Adapter development is ongoing. Current count: 2-3 adapters (Stripe, Shopify, basic database).

---

## Developer Experience

### SDKs

- **TypeScript/JavaScript** (`@settler/sdk`) — ✅ In progress
- **Python** (`settler-python`) — ⚠️ Planned
- **Go** (`settler-go`) — ⚠️ Planned
- **Ruby** (`settler-ruby`) — ⚠️ Planned

### Documentation

- **API Reference** — ⚠️ In progress
- **Quick Start Guide** — ✅ Available
- **Integration Examples** — ✅ Available (basic)
- **SDK Documentation** — ⚠️ In progress

### Developer Console

- **Dashboard** — ✅ Implemented
- **API Keys Management** — ✅ Implemented
- **Usage Tracking** — ✅ Implemented
- **Billing Management** — ✅ Implemented
- **Playground** — ✅ Implemented (basic)

---

## Pricing & Plans

### Free Tier

- **Price:** $0/month
- **Limits:**
  - 1,000 reconciliations/month
  - 100 receipt parses/month
  - 100k feature flag evaluations/month
  - 2 platform adapters
  - 7-day log retention
- **Support:** Community support
- **License:** MIT (OSS components)

### Commercial Plan

- **Price:** $99/month (or $990/year, ~17% discount)
- **Limits:**
  - 100,000 reconciliations/month
  - 10,000 receipt parses/month
  - 1M feature flag evaluations/month
  - Unlimited adapters
  - 30-day log retention
- **Support:** Email support
- **Features:**
  - Platform integrations (Shopify, Stripe, MCP)
  - Virtualization
  - Telemetry & analytics
  - Priority updates
  - Commercial License

### Enterprise Plan

- **Price:** Custom (contact sales)
- **Limits:**
  - Unlimited reconciliations/month
  - Unlimited receipt parses/month
  - Unlimited feature flag evaluations/month
  - Unlimited adapters
  - Unlimited log retention
- **Support:** Dedicated support (SLA)
- **Features:**
  - SSO & SAML
  - Role-based access control (RBAC)
  - White-label options
  - Custom integrations
  - On-premise deployment
  - Dedicated account manager
  - Custom SLA

---

## Technical Architecture

### Stack

- **Backend:** Node.js/TypeScript, Express
- **Database:** PostgreSQL (via Supabase)
- **Cache:** Redis (via Upstash)
- **Frontend:** Next.js (App Router), React, Tailwind CSS
- **Deployment:** Vercel (serverless)
- **Billing:** Stripe (subscriptions, webhooks, customer portal)

### Architecture Patterns

- **Hexagonal Architecture** (Ports & Adapters)
- **CQRS** (Command Query Responsibility Segregation)
- **Event-Driven** (event sourcing, event streams)
- **Domain-Driven Design** (DDD)

### Infrastructure

- **Hosting:** Vercel (serverless functions)
- **Database:** Supabase (PostgreSQL)
- **Cache:** Upstash (Redis)
- **CDN:** Vercel Edge Network
- **Monitoring:** [To be implemented]

---

## Security & Compliance

### Current Status

- ✅ **Encryption:** AES-256 encryption at rest
- ✅ **Authentication:** JWT-based auth (Supabase Auth)
- ✅ **Authorization:** Row-level security (RLS) for multi-tenant isolation
- ✅ **Input Validation:** Zod schemas for all inputs
- ✅ **Rate Limiting:** Implemented (100 requests/minute default)
- ⚠️ **SOC 2:** Planned Q3 2026 (not yet certified)
- ⚠️ **ISO 27001:** Planned (not yet certified)
- ⚠️ **GDPR:** Basic compliance (not yet audited)

### Security Features

- **Data Encryption:** AES-256 at rest
- **Transport Encryption:** TLS 1.3 in transit
- **Audit Logs:** Immutable audit trails
- **Access Control:** Row-level security (RLS)
- **API Security:** Rate limiting, input validation

---

## Roadmap

### Q1 2026

- ✅ Core reconciliation engine
- ✅ Stripe billing integration
- ✅ Public website
- ✅ Developer console
- ⚠️ Public beta launch
- ⚠️ Product Hunt launch
- ⚠️ 100 beta users

### Q2 2026

- ⚠️ Free tier launch
- ⚠️ Blog content (10+ posts)
- ⚠️ 1,000 users → 100 paying customers
- ⚠️ API documentation (complete)

### Q3 2026

- ⚠️ SOC 2 Type II certification (target)
- ⚠️ 10+ adapters (QuickBooks, PayPal, Square, Xero)
- ⚠️ Enterprise features (SSO, white-label reports)
- ⚠️ 500 paying customers

### Q4 2026

- ⚠️ 1,000 paying customers
- ⚠️ Self-service onboarding
- ⚠️ Open-source adapter SDK

---

## Limitations & Known Issues

### Current Limitations

1. **Limited Adapters:** Only 2-3 adapters (need 10+)
2. **No SOC 2:** Compliance certification not yet achieved
3. **Limited Documentation:** API docs in progress
4. **No Production Usage:** Pre-revenue, no production customers
5. **Solo Operator:** Limited bandwidth, key person risk

### Known Issues

- [To be documented as issues arise]

---

## Support

### Support Channels

- **Community:** GitHub Discussions, Discord (planned)
- **Email:** support@settler.io
- **Documentation:** [settler.dev/docs](https://settler.dev/docs)

### Support SLAs

- **Free Tier:** Community support (no SLA)
- **Commercial:** Email support (24-48 hour response)
- **Enterprise:** Dedicated support (custom SLA)

---

**Last Updated:** January 2026  
**Next Review:** Monthly or upon significant changes
