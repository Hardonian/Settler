# Developer Console Documentation

## Overview

The Developer Console (`/console`) is a unified interface for managing all aspects of your Settler API usage. It provides:

- API key management
- Usage monitoring across all services
- Feature flag management
- Receipt browsing
- API documentation and examples

## Architecture

### Route Structure

- `/console` - Overview dashboard
- `/console/api-keys` - API key management
- `/console/usage` - Usage & metrics
- `/console/receipts` - Receipt browser
- `/console/feature-flags` - Feature flag management
- `/console/docs` - API documentation hub

### Domain Organization

Console functionality is organized in `src/domain/console/`:

- `apiKeys.ts` - API key CRUD operations
- `usage.ts` - Usage event queries and summaries
- `receipts.ts` - Receipt listing and detail queries
- `featureFlags.ts` - Feature flag management

### Data Access

All console pages use:
- Server-side data fetching via API routes (`/api/console/*`)
- Supabase auth for user identification
- Prisma for database queries
- Type-safe domain modules

## Adding a New Service

To add a new service to the console:

1. **Create domain module** (`src/domain/console/newService.ts`):
   ```typescript
   export async function listNewServiceItems(billingAccountId: string) {
     // Query logic
   }
   ```

2. **Create API route** (`src/app/api/console/new-service/route.ts`):
   ```typescript
   export async function GET() {
     // Auth check
     // Call domain function
     // Return JSON
   }
   ```

3. **Create console page** (`src/app/console/new-service/page.tsx`):
   - Use client component for interactivity
   - Fetch from `/api/console/new-service`
   - Display data using existing UI components

4. **Add to navigation** (`src/components/console/ConsoleLayout.tsx`):
   - Add nav item to `consoleNavItems` array

5. **Add to docs** (`src/app/console/docs/page.tsx`):
   - Add service to `serviceDocs` object
   - Include endpoints and examples

## Security

- All console routes require authentication via Supabase
- API routes verify user identity before querying data
- Data is scoped to the user's billing account
- API keys are never fully displayed after creation

## Future Enhancements

- Real-time usage updates via WebSocket
- Export usage data as CSV/JSON
- Advanced filtering and search
- Usage alerts and notifications
- Service-specific dashboards
