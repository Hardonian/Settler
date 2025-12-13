# SDK, CLI, and Console Integration

## Overview

SDK, CLI, and Console are now fully integrated and share:
- ✅ Unified authentication (session + API key)
- ✅ Shared types and interfaces
- ✅ Same backend APIs
- ✅ Consistent error handling
- ✅ Unified logging

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Console   │     │     CLI     │     │     SDK     │
│     UI      │     │             │     │             │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                    │
       │ Session Auth      │ API Key Auth       │ API Key Auth
       │                   │                    │
       └───────────────────┴────────────────────┘
                           │
                  ┌────────▼────────┐
                  │ Unified Auth    │
                  │ Middleware      │
                  └────────┬────────┘
                           │
                  ┌────────▼────────┐
                  │  Console APIs   │
                  │  /api/console/* │
                  └─────────────────┘
```

## Authentication

### Console UI (Session Auth)
- Uses Supabase session cookies
- Authenticated via `createClient()` from `@/lib/supabase/server`
- User must be logged in

### SDK & CLI (API Key Auth)
- Uses API key in `X-API-Key` header or `Authorization: Bearer <key>`
- API key format: `rk_<base64>`
- Validated via `authenticateApiKey()`

### Unified Auth Middleware
- `requireAuth()` supports both session and API key
- Automatically detects auth type
- Returns unified auth context

## Shared Types

All types are defined in:
- `packages/web/src/shared/types/console.ts` (source of truth)
- `packages/sdk/src/clients/console.ts` (SDK exports)
- Used by CLI, SDK, and Console UI

## API Endpoints

All Console endpoints support both auth methods:

### API Keys
- `GET /api/console/api-keys` - List keys
- `POST /api/console/api-keys` - Create key
- `DELETE /api/console/api-keys/[id]` - Revoke key

### Usage
- `GET /api/console/usage` - Get usage stats

### Receipts
- `GET /api/console/receipts` - List receipts
- `GET /api/console/receipts/[id]` - Get receipt

### Feature Flags
- `GET /api/console/feature-flags` - List flags

### Activities
- `GET /api/console/activities` - Get recent activities

### Health
- `GET /api/health/console` - Health check

## SDK Usage

```typescript
import Settler from '@settler/sdk';

const client = new Settler({
  apiKey: 'rk_your_api_key',
  baseUrl: 'https://api.settler.io',
});

// API Keys
const keys = await client.console.listApiKeys();
const newKey = await client.console.createApiKey({ name: 'My Key' });
await client.console.revokeApiKey(keyId);

// Usage
const usage = await client.console.getUsage(7); // Last 7 days

// Receipts
const receipts = await client.console.listReceipts();
const receipt = await client.console.getReceipt(receiptId);

// Feature Flags
const flags = await client.console.listFeatureFlags();

// Activities
const activities = await client.console.getActivities();

// Health
const health = await client.console.health();
```

## CLI Usage

```bash
# Setup
export SETTLER_API_KEY=rk_your_api_key
export SETTLER_BASE_URL=https://api.settler.io

# API Keys
settler console api-keys list
settler console api-keys create --name "My Key"
settler console api-keys revoke <id>

# Usage
settler console usage summary --days 7

# Health
settler console health
```

## Console UI Usage

Console UI uses session auth automatically:
- User logs in via Supabase auth
- Session cookie authenticates requests
- No API key needed

## Error Handling

All three interfaces handle errors consistently:
- **401**: Unauthorized (no/invalid auth)
- **403**: Forbidden (permission denied)
- **404**: Not found
- **200**: Success (even with empty data)

Never returns 500 - all errors handled gracefully.

## Logging

All operations logged to `console_activities` table:
- SDK operations logged with `api_key` type
- CLI operations logged with `api_key` type
- Console UI operations logged with `session` type

## Type Safety

Types are shared across:
- SDK TypeScript definitions
- CLI TypeScript definitions
- Console UI TypeScript definitions
- Backend API route handlers

Changes to types automatically propagate to all interfaces.

## Testing

### Test SDK
```typescript
import Settler from '@settler/sdk';

const client = new Settler({ apiKey: 'test_key' });
const keys = await client.console.listApiKeys();
```

### Test CLI
```bash
SETTLER_API_KEY=test_key settler console api-keys list
```

### Test Console UI
Navigate to `/console` and use the UI.

## Migration Path

### From Direct API Calls to SDK
```typescript
// Before
const response = await fetch('/api/console/api-keys', {
  headers: { 'X-API-Key': apiKey },
});
const data = await response.json();

// After
const client = new Settler({ apiKey });
const data = await client.console.listApiKeys();
```

### From CLI Direct Calls to SDK
CLI now uses SDK internally - no changes needed.

## Benefits

1. **Consistency**: Same APIs, same types, same behavior
2. **Type Safety**: Shared types prevent mismatches
3. **Maintainability**: Single source of truth
4. **Developer Experience**: SDK provides better DX than raw fetch
5. **Error Handling**: Consistent across all interfaces
6. **Logging**: Unified activity logging

## Future Enhancements

- [ ] WebSocket support for real-time updates
- [ ] Batch operations API
- [ ] GraphQL API option
- [ ] SDK for other languages (Python, Go, Ruby)
- [ ] CLI plugins/extensions
