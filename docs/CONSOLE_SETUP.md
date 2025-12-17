# Developer Console Setup Guide

Complete guide for setting up and using the Settler Developer Console.

## Overview

The Developer Console provides a web-based interface for managing your Settler resources:
- API Key Management
- Usage Analytics
- Receipt Browser
- Feature Flags
- Live Activity Feed
- Billing Dashboard

## Access

### Production

1. Navigate to `https://your-domain.com`
2. Sign up at `/signup`
3. Access Console at `/console`

### Local Development

1. Start development server: `npm run dev`
2. Navigate to `http://localhost:3000`
3. Sign up at `/signup`
4. Access Console at `/console`

## Authentication

Console uses **Supabase session authentication**:
- Users sign up/login via Supabase Auth
- Session cookies authenticate requests
- No API key needed for Console UI access

## Features

### API Key Management

**Create API Keys:**
1. Navigate to `/console/api-keys`
2. Click "Create API Key"
3. Enter name and scopes
4. **Save the key immediately** - shown only once!

**Use API Keys:**
- SDK: `new Settler({ apiKey: 'rk_...' })`
- CLI: `export SETTLER_API_KEY=rk_...`
- API: `X-API-Key: rk_...` header

### Usage Analytics

View API usage statistics:
- Total API calls
- Usage by service
- Usage by operation
- Error rates
- Time range selection (7/30/90 days)

### Receipt Browser

Browse parsed receipts:
- View receipt details
- See parsed items
- Check confidence scores
- Export data

### Feature Flags

Manage feature flags:
- List all flags
- Toggle flags per environment
- View flag configurations
- Test flag evaluations

### Live Activity Feed

Real-time activity monitoring:
- Recent Console operations
- Activity types (reconcile, receipt, flag, etc.)
- Status indicators
- Auto-refreshes every 10 seconds

## API Integration

### Using SDK

```typescript
import Settler from '@settler/sdk';

const client = new Settler({ apiKey: 'rk_...' });

// List API keys
const keys = await client.console.listApiKeys();

// Get usage
const usage = await client.console.getUsage(7);

// List receipts
const receipts = await client.console.listReceipts();
```

### Using CLI

```bash
export SETTLER_API_KEY=rk_...

# List API keys
settler console api-keys list

# Get usage
settler console usage summary --days 7

# Health check
settler console health
```

### Direct API Calls

```bash
# List API keys
curl -H "X-API-Key: rk_..." https://api.settler.io/api/console/api-keys

# Get usage
curl -H "X-API-Key: rk_..." "https://api.settler.io/api/console/usage?days=7"
```

## Environment Variables

### Required

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `DATABASE_URL` - PostgreSQL connection string

### Optional

- `SUPABASE_SERVICE_ROLE_KEY` - For admin operations
- `SUPABASE_URL` - Alternative to NEXT_PUBLIC_ prefix
- `SUPABASE_ANON_KEY` - Alternative to NEXT_PUBLIC_ prefix

## Database Migrations

Console requires these migrations:
- `20260125000000_console_rls_fixes.sql` - RLS policy fixes
- `20260125000001_console_activity_logging.sql` - Activity logging

**Automatic**: Migrations run on PR push/merge.

**Manual**:
```bash
supabase db push
```

## Troubleshooting

### Console Returns 500

1. Check health: `/api/health/console`
2. Verify environment variables
3. Check migrations applied
4. Review server logs

### Can't Access Console

1. Verify you're signed in
2. Check Supabase auth is working
3. Verify billing account exists
4. Check browser console for errors

### API Keys Not Working

1. Verify key format: `rk_...`
2. Check key is not revoked
3. Verify scopes include required permissions
4. Check API endpoint URL

### Activities Not Showing

1. Verify `console_activities` table exists
2. Check RLS policies enabled
3. Verify user has billing account
4. Check activity logging is working

## Security

- ✅ Session-based auth for Console UI
- ✅ API key auth for SDK/CLI
- ✅ RLS policies enforce tenant isolation
- ✅ Billing account verification
- ✅ No secrets in logs/errors

## Next Steps

1. ✅ Set up Console
2. ✅ Create API keys
3. ✅ Integrate SDK/CLI
4. ✅ Monitor usage
5. ✅ Manage resources

## Documentation

- [Console Complete Guide](CONSOLE_COMPLETE.md)
- [SDK/CLI/Console Integration](SDK_CLI_CONSOLE_INTEGRATION.md)
- [Getting Started Guide](GETTING_STARTED.md)
- [API Reference](api.md)
