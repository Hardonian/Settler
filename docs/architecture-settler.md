# Settler Architecture Documentation

This document describes the architecture patterns used in Settler.dev, including the new Receipts and Feature Flags services.

## API Structure

Settler uses Next.js App Router with API routes under `/api/v1/`:

- `/api/v1/receipts/**` - Receipts API (new)
- `/api/v1/feature-flags/**` - Feature Flags API (new)
- `/api/v1/recon/**` - Reconciliation API (existing)

## Authentication

All API endpoints use API key authentication via the `X-API-Key` header:

1. Extract API key from header
2. Validate against `api_keys` table (via Supabase)
3. Verify key hash using bcrypt
4. Check revocation and expiration
5. Attach auth context to request

See `src/shared/auth/apiKey.ts` for implementation.

## Usage Tracking

All API operations log usage events to the `UsageEvent` model:

- `billingAccountId` - Links usage to billing account
- `eventType` - Format: `"service:operation"` (e.g., `"settler-receipts:parse_sync"`)
- `quantity` - Number of units consumed
- `unit` - Unit type (e.g., `"request"`, `"receipt"`)
- `metadata` - Additional context

See `src/shared/usage/usageEvent.ts` for implementation.

## Domain Organization

Settler uses bounded context architecture:

```
src/
  domain/
    receipts/          # Receipts domain (new)
    featureFlags/      # Feature Flags domain (new)
  shared/
    db/               # Prisma client
    auth/             # API key authentication
    usage/             # Usage event tracking
  app/
    api/
      v1/
        receipts/     # Receipts API routes
        feature-flags/ # Feature Flags API routes
```

Each domain is self-contained and can be extracted into a separate microservice later.

## Database

Settler uses:
- **Supabase/PostgreSQL** - Primary database
- **Prisma** - ORM for type-safe database access
- Schema location: `/workspace/prisma/schema.prisma`

## Error Handling

API routes follow a consistent error response format:

```json
{
  "error": "Error type",
  "message": "Human-readable error message"
}
```

HTTP status codes:
- `400` - Bad request (validation errors)
- `401` - Unauthorized (missing/invalid API key)
- `404` - Not found
- `500` - Internal server error

## Type Safety

All code is strictly typed with TypeScript:
- No `any` types
- Strict null checks enabled
- Type-safe Prisma queries
- Validated request/response types

## Future Microservice Extraction

Both Receipts and Feature Flags are designed for easy extraction:

1. **Shared Infrastructure**: Keep in `src/shared/` or extract to shared package
2. **Domain Logic**: Already isolated in `src/domain/`
3. **API Routes**: Can be moved to separate Next.js app or Express server
4. **Database**: Models are scoped and can be moved to separate schema

See `docs/settler-receipts-feature-flags-setup.md` for more details.
