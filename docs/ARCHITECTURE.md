# Settler.dev Architecture

**Version:** 2.0.0  
**Last Updated:** 2025-01-20

---

## Overview

Settler.dev is a unified, modular, AI-driven, enterprise-ready Data Operations OS with Recon-as-a-Service at its philosophical and architectural core.

## Core Philosophy

**Recon-as-a-Service** is not just a feature—it's the foundational principle that drives every subsystem:

- **Deterministic Core:** All reconciliation operations are deterministic by default
- **Self-Healing:** The system automatically detects and repairs drift
- **AI-Driven:** Intelligent routing and optimization at every layer
- **Multi-Tenant:** Strict isolation with Row-Level Security (RLS)
- **Event-Driven:** All operations emit events for observability and automation

## Architecture Layers

### 1. Data Layer

**Database:** PostgreSQL with Supabase  
**Schema:** Multi-tenant with strict RLS policies

**Core Tables:**
- `recon_jobs` - Reconciliation job definitions
- `recon_results` - Execution results
- `recon_templates` - Reusable templates
- `mapping_templates` - Field mapping templates
- `validation_rules` - Validation rule definitions
- `transform_recipes` - Transformation recipes
- `contract_versions` - Data contract versioning
- `drift_events` - Schema drift detection
- `workflow_runs` - Workflow execution tracking

### 2. Service Layer

**Recon Core Engine** (`/services/recon-core/`)
- Unified reconciliation orchestration
- Pipeline: Ingestion → Transform → Validate → Recon → Map → Audit → Report

**AI Mesh** (`/services/ai-mesh/`)
- Multi-agent fallback system
- Intelligent model routing
- Cost optimization

**Drift Detection** (`/services/drift/`)
- Schema drift detection
- Auto-repair capabilities

**Vertical Modules** (`/services/verticals/`)
- LegalTech: Contract diff, obligation mapping
- EdTech: QTI validation, LMS compatibility
- FinTech: Ledger reconciliation, accounting drift
- Compliance: Policy comparison, privacy drift

**Workflows** (`/services/workflows/`)
- Workflow orchestration engine
- Support for conditionals, loops, timers

**Contracts** (`/services/contracts/`)
- Data contract versioning
- Breaking change detection
- Migration guide generation

### 3. API Layer

**REST API** (`/routes/v1/`)
- Versioned API surface
- OpenAPI 3.1 specification
- Swagger UI

**Webhooks** (`/services/webhooks/`)
- HMAC-signed webhook delivery
- Retry logic with exponential backoff
- Event filtering

### 4. Intelligence Layer

**Usage Optimizer** (`/services/intelligence/usage-optimizer.ts`)
- Cost analysis and optimization
- Model selection recommendations

**Health Optimizer** (`/services/intelligence/health-optimizer.ts`)
- Failure pattern detection
- Template and workflow suggestions

**Product Evolution** (`/services/intelligence/product-evolution.ts`)
- Feature proposal generation
- Usage pattern analysis

### 5. Infrastructure Layer

**Event Bus** (`/services/events/event-bus.ts`)
- Internal event coordination
- Event-driven architecture

**Plugin System** (`/services/plugins/plugin-manager.ts`)
- Third-party plugin support
- Extensible architecture

**AI Config** (`/services/ai-config/ai-config-manager.ts`)
- User-configurable AI settings
- Model preferences and budgets

## Data Flow

```
Ingestion → Transform → Validate → Recon → Map → Audit → Report
    ↓           ↓           ↓         ↓       ↓       ↓       ↓
  Events    Events     Events    Events  Events  Events  Events
    ↓           ↓           ↓         ↓       ↓       ↓       ↓
            Event Bus → Webhooks → Usage Tracking → Billing
```

## Multi-Tenancy

All tables are protected by Row-Level Security (RLS) policies that enforce tenant isolation:

```sql
CREATE POLICY tenant_isolation ON table_name
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
```

## Security

- **Authentication:** API keys and JWT tokens
- **Authorization:** Role-based access control (RBAC)
- **Encryption:** Encrypted configuration storage
- **Audit:** Comprehensive audit logging
- **RLS:** Strict multi-tenant isolation

## Scalability

- **Horizontal Scaling:** Stateless API design
- **Database:** Connection pooling, read replicas
- **Caching:** Redis for rate limiting and caching
- **Queue:** Job queue for long-running operations

## Observability

- **Logging:** Structured logging with correlation IDs
- **Metrics:** Usage tracking, performance metrics
- **Tracing:** Distributed tracing support
- **Events:** Event bus for all operations

## Extensibility

- **Plugins:** Third-party plugin system
- **Templates:** Reusable templates for common patterns
- **Workflows:** Custom workflow orchestration
- **Vertical Modules:** Industry-specific modules

---

**For detailed API documentation, see [API_REFERENCE.md](./API_REFERENCE.md)**
