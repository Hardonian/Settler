# Settler Product Overview

**Version:** 1.0  
**Last Updated:** January 2026  
**Audience:** Customers, Investors, Partners

---

## What is Settler?

Settler is a **Open Source Reconciliation Engine** platform that automates financial data matching across payment processors, e-commerce platforms, and accounting systems. We eliminate hours of manual reconciliation work, reducing it to minutes of automated processing.

### Core Value Proposition

**Automate financial reconciliation.** Connect your payment processors, e-commerce platforms, and accounting systems. Settler handles the matching, reconciliation, and audit trail automatically.

---

## Key Capabilities

### 1. Reconciliation Engine

**What it does:** Matches transactions across multiple platforms automatically using event-sourced matching algorithms.

**Key Features:**

- Event-sourced matching engine for high-volume processing
- Deterministic math (no floating-point errors)
- Custom matching rules (amount tolerance, date windows, fuzzy matching)
- Complete audit trail for compliance
- Multi-currency support with deterministic conversion

**Use Cases:**

- Payment reconciliation (Stripe ↔ QuickBooks)
- E-commerce reconciliation (Shopify ↔ accounting systems)
- Multi-platform transaction matching
- Compliance auditing and reporting

### 2. Receipts API

**What it does:** AI-powered OCR extracts structured data from receipts and invoices.

**Key Features:**

- Multi-format support (PDF, PNG, JPG)
- Structured JSON output (vendor, date, total, line items, tax)
- High accuracy OCR with confidence scores
- Batch processing support

**Use Cases:**

- Expense management automation
- Receipt data extraction for accounting
- Invoice processing workflows

### 3. Feature Flags

**What it does:** Edge-evaluated feature flags for phased financial rollouts.

**Key Features:**

- Sub-10ms edge evaluation latency
- Typed payloads with TypeScript support
- Instant rollouts without deployments
- A/B testing and gradual rollouts

**Use Cases:**

- Phased feature rollouts
- A/B testing financial features
- Emergency feature toggles

### 4. Developer Console

**What it does:** Unified dashboard for managing API keys, monitoring usage, viewing receipts, and managing feature flags.

**Key Features:**

- API key management with scoped permissions
- Real-time usage analytics
- Receipt browser with search and filters
- Feature flag management UI
- Live activity feed
- Billing dashboard

---

## Platform Adapters

### Currently Available

- **Stripe** — Payment processor adapter
- **Shopify** — E-commerce platform adapter
- **Database** — Generic database adapter (PostgreSQL, MySQL, etc.)

### Planned (Q1-Q3 2026)

- QuickBooks, Xero (accounting systems)
- PayPal, Square (payment processors)
- NetSuite (ERP)
- WooCommerce (e-commerce)
- MCP (Model Context Protocol for AI/LLM integrations)

---

## Target Customers

### Ideal Customer Profile (ICP)

**Primary:** Mid-market SaaS companies ($1M-$50M ARR) processing $100K+ monthly transactions across multiple platforms.

**Characteristics:**

- Multiple payment processors (Stripe, PayPal, Square)
- E-commerce platforms (Shopify, WooCommerce)
- Accounting systems (QuickBooks, Xero)
- Manual reconciliation processes taking 10+ hours/month
- Need for audit trails and compliance reporting

### Customer Segments

1. **SaaS Companies** — Recurring revenue reconciliation
2. **E-commerce Businesses** — Order-to-payment reconciliation
3. **Marketplaces** — Multi-party transaction reconciliation
4. **Financial Services** — Compliance and audit trail requirements

---

## Business Model

### Pricing Tiers

**Starter:** $99/month

- 100,000 reconciliations/month
- 10,000 receipt parses/month
- 1M feature flag evaluations/month
- Email support

**Professional:** $499/month

- 1M reconciliations/month
- 100,000 receipt parses/month
- 10M feature flag evaluations/month
- Priority support

**Enterprise:** Custom pricing

- Unlimited usage
- SLA guarantees
- Dedicated support
- Custom integrations
- SSO/RBAC
- White-label options

### Revenue Model

- **Subscription Revenue:** Monthly/annual subscriptions
- **Usage-Based:** Overage charges for exceeding tier limits
- **Enterprise:** Custom contracts with annual commitments

---

## Competitive Differentiation

### Why Settler?

1. **Deterministic Math:** No floating-point errors in financial calculations
2. **Event-Sourced Architecture:** Complete audit trail and replay capability
3. **Developer-First:** API-first design with comprehensive SDKs
4. **Multi-Platform:** Unified reconciliation across all major platforms
5. **Compliance-Ready:** Built-in audit trails and deterministic reporting

### Market Position

- **vs. Manual Processes:** 10x faster, eliminates errors
- **vs. Custom Solutions:** Faster implementation, lower cost
- **vs. Generic ETL:** Purpose-built for reconciliation use cases
- **vs. Accounting Software:** Focused on multi-platform matching

---

## Technical Architecture

**Stack:**

- Backend: Node.js/TypeScript, Express
- Database: PostgreSQL (Supabase)
- Cache: Redis (Upstash)
- Frontend: Next.js, React
- Deployment: Vercel (serverless)

**Architecture Patterns:**

- Hexagonal Architecture (Ports & Adapters)
- CQRS (Command Query Responsibility Segregation)
- Event-Driven (event sourcing)
- Domain-Driven Design

---

## Security & Compliance

**Current:**

- AES-256 encryption at rest
- TLS 1.3 in transit
- Row-level security (RLS) for multi-tenant isolation
- Input validation with Zod schemas
- Rate limiting and DDoS protection

**Planned (Q3 2026):**

- SOC 2 Type II certification
- ISO 27001 certification
- GDPR compliance audit

---

## Support & Resources

**Documentation:** [settler.dev/docs](https://settler.dev/docs)  
**API Reference:** [settler.dev/docs/api](https://settler.dev/docs/api)  
**Support:** support@settler.io  
**Enterprise Sales:** enterprise@settler.io

---

**For detailed technical documentation, see [Architecture Overview](./ARCHITECTURE_OVERVIEW.md) and [Getting Started Guide](./GETTING_STARTED.md).**
