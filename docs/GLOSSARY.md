# Glossary

**Last Updated:** January 2026

This glossary defines key terms used throughout Settler documentation and codebase.

---

## A

### Adapter

A connector that integrates Settler with external systems (e.g., Stripe, Shopify, QuickBooks). Adapters handle authentication, data fetching, and transformation.

### API Key

A secret token used to authenticate API requests. Format: `rk_<base64>`. API keys can be scoped with permissions and restricted by IP allowlist (Enterprise).

### Audit Trail

An immutable log of all operations performed in the system. Used for compliance, debugging, and audit purposes.

---

## C

### CQRS (Command Query Responsibility Segregation)

An architectural pattern separating read operations (queries) from write operations (commands). Enables independent optimization of read and write paths.

### Console

The Developer Console (`/console`) is a web-based dashboard for managing API keys, monitoring usage, viewing receipts, and managing feature flags.

---

## D

### Deterministic Math

Mathematical operations that produce the same result every time, avoiding floating-point errors. Critical for financial calculations.

### Domain Event

An event representing a business occurrence (e.g., "JobCreated", "ReconciliationCompleted"). Events are stored in an event store and can trigger webhooks or other actions.

---

## E

### Event Sourcing

An architectural pattern where state changes are stored as a sequence of events. The current state can be rebuilt by replaying events.

### Execution

A single run of a reconciliation job. Executions contain the results of matching operations and any errors encountered.

---

## F

### Feature Flag

A configuration that enables or disables features at runtime. Feature flags are evaluated at the edge (<10ms latency) and support phased rollouts.

---

## H

### Hexagonal Architecture

Also known as Ports & Adapters. An architectural pattern that separates business logic (domain) from infrastructure concerns. Business logic defines ports (interfaces), and infrastructure provides adapters (implementations).

---

## J

### Job

A reconciliation job defines:
- Source adapter (where to fetch data from)
- Target adapter (where to match against)
- Matching rules (how to match transactions)
- Schedule (when to run)

---

## M

### Matching Rule

A rule defining how transactions should be matched. Examples:
- Exact match on order ID
- Fuzzy match on amount with tolerance
- Date window matching

### Multi-Tenant Isolation

Ensuring that data from one customer cannot be accessed by another customer. Achieved through Row-Level Security (RLS) policies.

---

## O

### Ops Intelligence

A closed-loop operational intelligence system that automatically detects insights, generates recommendations, and tracks actions. Provides weekly founder briefings.

---

## R

### Reconciliation

The process of matching transactions across multiple systems to identify matches, mismatches, and missing transactions.

### Receipt Parse

The process of extracting structured data (vendor, date, total, line items, tax) from a receipt image or PDF using AI-powered OCR.

### Row-Level Security (RLS)

Database-level security policies that restrict access to rows based on user context. Ensures multi-tenant isolation.

---

## S

### SDK (Software Development Kit)

A library that provides a convenient interface to Settler APIs. Available for TypeScript/JavaScript, with Python, Go, and Ruby planned.

### Service Role Key

A Supabase key with admin privileges. Used for server-side operations that require bypassing Row-Level Security. **Never expose to client-side code.**

---

## T

### Tenant

A customer organization in Settler. Each tenant has isolated data, API keys, and configuration.

### Trace ID

A unique identifier attached to each request for correlation across services. Used for debugging and observability.

---

## U

### Usage

API usage metrics tracked per tenant:
- Reconciliation operations
- Receipt parses
- Feature flag evaluations

Usage is used for billing and rate limiting.

---

## W

### Webhook

An HTTP callback sent to your server when events occur (e.g., job completion, receipt parsing). Webhooks include signatures for verification.

---

## Additional Resources

- **Architecture:** See [ARCHITECTURE_OVERVIEW.md](./ARCHITECTURE_OVERVIEW.md)
- **Product:** See [PRODUCT_OVERVIEW.md](./PRODUCT_OVERVIEW.md)
- **API Reference:** See [docs/api-reference.md](./api-reference.md)

---

**This glossary is maintained as part of documentation. Terms are added as needed.**
