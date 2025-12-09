# Settler Receipts & Feature Flags Setup

This document describes the setup required for the new Receipts API and Feature Flags API services.

## Prisma Setup

The new services use Prisma for database access. You need to:

1. **Install Prisma CLI** (if not already installed):
   ```bash
   npm install -D prisma @prisma/client
   ```

2. **Generate Prisma Client**:
   ```bash
   npm run prisma:generate
   ```

3. **Run Migrations**:
   ```bash
   npm run prisma:migrate
   ```
   Or for development:
   ```bash
   npm run prisma:push
   ```

## New Database Models

The Prisma schema has been extended with:

### Receipts Models
- `ReceiptUpload` - Tracks receipt file uploads
- `Receipt` - Normalized receipt data
- `ReceiptItem` - Individual line items from receipts

### Feature Flags Models
- `FeatureFlag` - Flag definitions
- `FeatureFlagEnvironment` - Environment-specific flag settings
- `FeatureFlagOverride` - User/tenant-specific overrides

## API Endpoints

### Receipts API
- `POST /api/v1/receipts` - Parse a receipt (image/PDF → JSON)
- `GET /api/v1/receipts/:id` - Get a stored receipt

### Feature Flags API
- `POST /api/v1/feature-flags` - Create a flag
- `GET /api/v1/feature-flags` - List flags
- `PATCH /api/v1/feature-flags/:id` - Update a flag
- `POST /api/v1/feature-flags/evaluate` - Evaluate a flag value

## Marketing Pages

- `/receipts` - Receipts API product page
- `/feature-flags` - Feature Flags API product page

## Architecture Notes

Both services are implemented as bounded contexts:
- Domain logic in `src/domain/receipts/` and `src/domain/featureFlags/`
- Shared infrastructure in `src/shared/` (auth, usage tracking, Prisma client)
- API routes in `src/app/api/v1/receipts/` and `src/app/api/v1/feature-flags/`

The services are designed to be easily extractable into separate microservices later if needed.

## Usage Tracking

Both services use the existing `UsageEvent` model for tracking:
- Receipts: `service = "settler-receipts"`, `operation = "parse_sync"`
- Feature Flags: `service = "settler-feature-flags"`, `operation = "evaluate"`

Feature Flags is free but still tracks usage for observability.
