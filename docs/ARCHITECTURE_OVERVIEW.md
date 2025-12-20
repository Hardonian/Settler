# Architecture Overview

**Last Updated:** January 2026  
**Audience:** Engineers, Architects, Technical Evaluators

---

## System Architecture

Settler follows a **Hexagonal Architecture** (Ports & Adapters) pattern with **CQRS** and **Event-Driven** principles. This ensures separation of concerns, testability, and maintainability.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
│  (HTTP API Routes, Next.js Web App, Developer Console)     │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                   Application Layer                          │
│  (Use Cases, Commands, Queries, Orchestration)              │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                     Domain Layer                              │
│  (Business Logic, Entities, Value Objects, Domain Events)    │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                Infrastructure Layer                           │
│  (Database, Cache, External Services, Observability)          │
└─────────────────────────────────────────────────────────────┘
```

---

## Architecture Layers

### 1. Domain Layer

**Location:** `packages/api/src/domain/`

**Purpose:** Core business logic, independent of infrastructure.

**Components:**
- **Entities:** Core business objects (User, Job, Execution, ApiKey, Tenant)
- **Value Objects:** Immutable objects representing domain concepts
- **Domain Events:** Events representing business occurrences
- **Repository Interfaces:** Contracts for data persistence (ports)

**Principles:**
- No dependencies on external frameworks
- Pure business logic
- Rich domain models with behavior
- Framework-agnostic

### 2. Application Layer

**Location:** `packages/api/src/application/`

**Purpose:** Orchestrates domain objects to fulfill use cases.

**Components:**
- **Services:** Application services orchestrating domain logic
- **Commands:** CQRS command handlers (write operations)
- **Queries:** Read operations
- **Sagas:** Long-running business processes
- **Projections:** Read models for CQRS
- **DTOs:** Data Transfer Objects for API boundaries

**Principles:**
- Thin layer that delegates to domain
- Transaction boundaries
- Use case orchestration

### 3. Infrastructure Layer

**Location:** `packages/api/src/infrastructure/`

**Purpose:** Implements technical concerns and adapters.

**Components:**
- **Repositories:** Database implementations of repository interfaces
- **Database:** PostgreSQL connection and queries
- **Events:** Event bus implementation
- **Security:** Encryption, authentication, authorization
- **Observability:** Metrics, tracing, logging
- **Resilience:** Retry, circuit breakers, dead letter queues

**Principles:**
- Implements interfaces defined in domain/application
- Can be swapped without changing business logic
- Handles technical concerns

### 4. Presentation Layer

**Location:** `packages/api/src/routes/`, `packages/web/`

**Purpose:** HTTP adapters exposing the application to the outside world.

**Components:**
- **Routes:** Express route handlers
- **Middleware:** Auth, validation, error handling
- **Controllers:** Thin controllers calling application services
- **Validation:** Input validation with Zod
- **Web App:** Next.js application with Developer Console

**Principles:**
- Thin adapters translating HTTP to application calls
- Input validation and output formatting
- Error handling and status codes

---

## Key Patterns

### Hexagonal Architecture (Ports & Adapters)

- **Ports:** Interfaces defined in domain layer
- **Adapters:** Implementations in infrastructure layer
- **Benefits:** Easy to swap implementations, testable, maintainable

### CQRS (Command Query Responsibility Segregation)

- **Commands:** Mutate state (CreateJob, UpdateJob, DeleteJob)
- **Queries:** Read data (GetJob, ListJobs)
- **Separate Models:** Different models for read/write operations
- **Benefits:** Enables optimization of read and write paths independently

### Event-Driven Architecture

- Domain events published when state changes
- Event handlers react to events asynchronously
- Enables audit trails, webhooks, and async processing
- Events stored in event store
- Aggregates can be rebuilt from events

### Repository Pattern

- Abstracts data access behind interfaces
- Domain layer doesn't know about database implementation
- Easy to swap implementations (PostgreSQL, MongoDB, etc.)

---

## Data Flow

### Reconciliation Job Flow

```
1. API Request → Presentation Layer (Route Handler)
2. Route Handler → Application Layer (Command Handler)
3. Command Handler → Domain Layer (Entity/Service)
4. Domain Layer → Infrastructure Layer (Repository)
5. Repository → Database (PostgreSQL)
6. Domain Events → Event Bus
7. Event Handlers → Webhooks, Audit Logs, Notifications
```

### Query Flow

```
1. API Request → Presentation Layer (Route Handler)
2. Route Handler → Application Layer (Query Handler)
3. Query Handler → Infrastructure Layer (Read Model/Projection)
4. Read Model → Database (PostgreSQL)
5. Results → Presentation Layer → JSON Response
```

---

## Technology Stack

### Backend

- **Runtime:** Node.js 20.19.6
- **Language:** TypeScript 5.3
- **Framework:** Express.js
- **Database:** PostgreSQL 15+ (via Supabase)
- **Cache:** Redis (via Upstash)
- **ORM:** Prisma

### Frontend

- **Framework:** Next.js 14 (App Router)
- **UI Library:** React 18
- **Styling:** Tailwind CSS
- **Type Safety:** TypeScript

### Infrastructure

- **Hosting:** Vercel (serverless functions)
- **Database:** Supabase (PostgreSQL)
- **Cache:** Upstash (Redis)
- **CDN:** Vercel Edge Network
- **Billing:** Stripe

---

## Security Architecture

### Authentication

- **Session Auth:** NextAuth.js for web app
- **API Key Auth:** Custom middleware for API requests
- **JWT:** Token-based authentication

### Authorization

- **Row-Level Security (RLS):** Database-level multi-tenant isolation
- **Scoped Permissions:** API keys with permission scopes
- **Role-Based Access Control (RBAC):** User roles (Owner, Admin, Developer, Viewer)

### Data Protection

- **Encryption at Rest:** AES-256 encryption for sensitive data
- **Encryption in Transit:** TLS 1.3 for all connections
- **Input Validation:** Zod schemas for all API inputs
- **Rate Limiting:** Per-API-key and per-IP rate limits

---

## Deployment Architecture

### Production Deployment

```
┌─────────────────────────────────────────────────────────────┐
│                      Vercel Edge                             │
│  (Next.js Web App, API Routes, Edge Functions)              │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    Supabase                                  │
│  (PostgreSQL Database, Auth, RLS Policies)                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    Upstash                                    │
│  (Redis Cache, Rate Limiting)                                │
└─────────────────────────────────────────────────────────────┘
```

### Key Characteristics

- **Serverless:** Auto-scaling serverless functions
- **Edge Computing:** Edge functions for low-latency operations
- **Multi-Region:** Vercel Edge Network for global distribution
- **Database:** Managed PostgreSQL with automatic backups
- **Cache:** Managed Redis with persistence

---

## Observability

### Logging

- **Structured Logging:** JSON logs with correlation IDs
- **Log Levels:** Error, Warn, Info, Debug
- **Log Retention:** Tier-based (7-365 days)

### Metrics

- **API Metrics:** Request counts, latency, error rates
- **Business Metrics:** Reconciliation jobs, receipt parses, feature flag evaluations
- **Infrastructure Metrics:** Database connections, cache hit rates

### Tracing

- **Correlation IDs:** Trace requests across services
- **Distributed Tracing:** (Planned) OpenTelemetry integration

---

## Scalability

### Horizontal Scaling

- **Serverless Functions:** Auto-scaling based on demand
- **Database:** Read replicas for query scaling
- **Cache:** Distributed Redis cluster

### Performance Optimizations

- **Edge Caching:** Vercel Edge Network caching
- **Database Indexing:** Optimized indexes for common queries
- **Query Optimization:** Efficient queries with proper joins
- **Connection Pooling:** Database connection pooling

---

## Disaster Recovery

### Backup Strategy

- **Database:** Daily automated backups (Supabase)
- **Backup Retention:** 7-30 days (tier-based)
- **Point-in-Time Recovery:** Available (Supabase)

### High Availability

- **Multi-Region:** Vercel Edge Network
- **Database Replication:** Supabase managed replication
- **Failover:** Automatic failover for database

---

## Development Workflow

### Local Development

1. Clone repository
2. Install dependencies (`npm install`)
3. Set up environment variables (`.env`)
4. Start local services (PostgreSQL, Redis) or use cloud services
5. Run migrations (`npm run db:migrate:auto`)
6. Start dev server (`npm run dev`)

### CI/CD Pipeline

1. **Lint & Typecheck:** Code quality checks
2. **Tests:** Unit and integration tests
3. **Build:** Application build verification
4. **Security Scan:** Dependency and secret scanning
5. **Deploy:** Automatic deployment to Vercel

---

## For More Information

- **Detailed Architecture:** See [docs/architecture.md](./architecture.md)
- **Deployment Guide:** See [docs/DEPLOYMENT.md](./DEPLOYMENT.md)
- **Configuration:** See [docs/CONFIGURATION.md](./CONFIGURATION.md)
- **Operations:** See [docs/OPERATIONS_RUNBOOK.md](./OPERATIONS_RUNBOOK.md)

---

**This architecture overview provides a high-level understanding. For implementation details, see the codebase and detailed documentation.**
