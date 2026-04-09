# Repository Boundaries

Documentation of OSS vs SaaS boundaries in the Settler codebase.

## Overview

Settler follows an "Open Core" model where core functionality is open-source, while SaaS-specific features are private. This document defines the boundaries.

## OSS Surface (Public)

These packages and directories are part of the public API and can be used by external developers without reading internal code.

### Public Packages

#### `@settler/sdk`

**Location:** `packages/sdk/`

TypeScript/JavaScript SDK for the Settler API. Fully public, tree-shakable, typed.

**Public API:**

- `SettlerClient` - Main client class
- `JobsClient` - Job management
- `ReportsClient` - Report access
- `WebhooksClient` - Webhook management
- Error classes (`SettlerError`, `NetworkError`, etc.)
- Utility functions (retry, pagination, webhook signature verification)

**Usage:**

```typescript
import { SettlerClient } from "@settler/sdk";

const client = new SettlerClient({
  apiKey: "rk_your_api_key",
});
```

#### `@settler/adapters`

**Location:** `packages/adapters/`

Connector interface and base adapters. Public contract for building third-party connectors.

**Public API:**

- `Connector` interface - Contract for connectors
- `NormalizedData` type - Data model
- `validateConnector()` - Validation utility
- Base adapter implementations (reference)

**Usage:**

```typescript
import { Connector, validateConnector } from "@settler/adapters";

class MyConnector implements Connector {
  // Implementation
}
```

#### `@settler/protocol`

**Location:** `packages/protocol/`

Shared protocol definitions, types, and utilities. Public for SDK and adapters.

**Public API:**

- Error types
- Validation utilities
- Security utilities
- Telemetry types

### Public Routes

#### `/api/v1/*`

**Location:** `packages/api/src/routes/v1/`

All routes under `/api/v1/` are part of the public API:

- `/api/v1/jobs` - Job management
- `/api/v1/reports` - Reports
- `/api/v1/webhooks` - Webhook management
- `/api/v1/webhooks/events` - Event registry
- `/api/v1/api-keys` - API key management
- `/api/v1/ingestion` - Data ingestion
- `/api/v1/reconciliation` - Reconciliation

**Documentation:** See `/docs/API.md`

### Public Documentation

All files in `/docs/` are public:

- `API.md` - API reference
- `WEBHOOKS.md` - Webhook guide
- `EXTENSIONS.md` - Connector development guide
- `REPO_BOUNDARIES.md` - This file

### Public Schemas

**Location:** `packages/types/`

TypeScript type definitions exported for SDK and adapters.

## Private SaaS Code (Internal)

These packages and directories are internal and should not be relied upon by external developers.

### Private Packages

#### `packages/api/`

**Status:** Mixed (public routes are public, internal services are private)

**Public:**

- Routes under `/api/v1/` and `/api/v2/`
- Public middleware (auth, rate limiting)

**Private:**

- Internal services (`services/`)
- Database migrations (`db/migrations/`)
- Infrastructure code (`infrastructure/`)
- Domain logic (`domain/`)
- Application services (`application/`)

#### `packages/web/`

**Status:** Private

Next.js web application for the SaaS console. Not part of the public API.

**Private:**

- All React components
- Internal API routes (`app/api/`)
- UI-specific code

#### `packages/cli/`

**Status:** Public (OSS)

CLI tool for managing Settler from the command line.

### Private Routes

#### `/api/v1/console/*`

**Status:** Private

Console-specific routes for the web UI.

#### `/api/v1/admin/*`

**Status:** Private

Admin-only routes for internal operations.

### Private Services

**Location:** `packages/api/src/services/`

All service implementations are private:

- `ingestion/` - Ingestion service implementation
- `reconciliation/` - Reconciliation engine
- `billing/` - Billing logic
- `webhooks/` - Webhook delivery (use public routes instead)

**Note:** Use public API routes instead of calling services directly.

### Private Infrastructure

**Location:** `packages/api/src/infrastructure/`

- Database clients
- Redis clients
- Monitoring/observability
- Security implementations

## Breaking Changes Policy

### Public API Changes

Breaking changes to public APIs require:

1. **Version bump** - Increment major version (v1 → v2)
2. **Deprecation period** - Minimum 6 months notice
3. **Migration guide** - Document how to migrate
4. **Deprecation headers** - Add `Deprecation` and `Sunset` headers

### Private Code Changes

Private code can change at any time without notice. External developers should not depend on:

- Internal service implementations
- Database schemas (use API)
- Private routes
- Internal types/interfaces

## Extension Points

### For External Developers

1. **SDK** - Use `@settler/sdk` for API access
2. **Connectors** - Implement `Connector` interface
3. **Webhooks** - Subscribe to public events
4. **API Routes** - Use `/api/v1/*` endpoints

### For Internal Team

1. **Services** - Can modify internal services freely
2. **Database** - Can change schemas (with migrations)
3. **Infrastructure** - Can refactor as needed
4. **Private Routes** - Can add/modify console routes

## Versioning Strategy

### API Versioning

- **v1** - Current stable version
- **v2** - Future version (breaking changes)
- **v3+** - Future versions

### Package Versioning

Public packages use semantic versioning:

- **Major** - Breaking changes
- **Minor** - New features (backward compatible)
- **Patch** - Bug fixes

## Enforcement

### Build-Time Checks

- TypeScript ensures public types are exported correctly
- ESLint rules prevent internal code from being imported in public packages
- Build scripts verify OSS boundaries

### Runtime Checks

- API routes validate API keys and scopes
- Rate limiting prevents abuse
- Error messages don't leak internal details

## Migration Guide

### Moving Code from Private to Public

1. Create public interface/type
2. Document in `/docs/`
3. Export from public package
4. Add tests
5. Update changelog

### Moving Code from Public to Private

1. Deprecate in current version
2. Document migration path
3. Remove in next major version
4. Provide alternative (if applicable)

## Examples

### ✅ Correct: Using Public API

```typescript
// External developer
import { SettlerClient } from "@settler/sdk";

const client = new SettlerClient({ apiKey: "rk_..." });
const jobs = await client.jobs.list();
```

### ❌ Incorrect: Using Private Code

```typescript
// External developer (DON'T DO THIS)
import { IngestionService } from "@settler/api/services/ingestion"; // Private!

const service = new IngestionService(); // Will break!
```

### ✅ Correct: Building Connector

```typescript
// External developer
import { Connector, validateConnector } from "@settler/adapters";

class MyConnector implements Connector {
  // Implementation
}
```

### ❌ Incorrect: Extending Internal Classes

```typescript
// External developer (DON'T DO THIS)
import { BaseAdapter } from "@settler/api/adapters/base"; // Private!

class MyAdapter extends BaseAdapter {
  // Will break!
}
```

## Support

- **Questions:** support@settler.io
- **Issues:** [GitHub Issues](https://github.com/settler/settler/issues)
- **Documentation:** [docs.settler.io](https://docs.settler.io)
