# Developer Console Setup Guide

Quick setup guide for the Settler Developer Console.

## What is the Developer Console?

The Developer Console (`/console`) is a web-based interface for managing your Settler resources:
- ✅ API Key Management
- ✅ Usage Analytics  
- ✅ Receipt Browser
- ✅ Feature Flags
- ✅ Live Activity Feed
- ✅ Billing Dashboard

## Quick Setup

### 1. Start Application

```bash
npm run dev
```

### 2. Access Console

1. Navigate to `http://localhost:3000`
2. Sign up at `/signup`
3. Access Console at `/console`

### 3. Create API Key

1. Go to `/console/api-keys`
2. Click "Create API Key"
3. Enter name and scopes
4. **Save the key** - shown only once!

### 4. Use API Key

**SDK:**
```typescript
import Settler from '@settler/sdk';
const client = new Settler({ apiKey: 'rk_...' });
```

**CLI:**
```bash
export SETTLER_API_KEY=rk_...
settler console api-keys list
```

## Environment Variables

Required:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DATABASE_URL`

See [Setup Guide](SETUP_GUIDE.md) for details.

## Database Migrations

Migrations run automatically on PR push/merge.

Manual (local):
```bash
supabase db push
```

## Features

### API Keys
- Create, list, revoke API keys
- Set scopes and expiration
- View usage per key

### Usage Analytics
- Monitor API calls
- View by service/operation
- Track error rates
- Time range selection

### Receipt Browser
- Browse parsed receipts
- View details and items
- Check confidence scores

### Feature Flags
- Manage flags
- Toggle per environment
- Test evaluations

### Activity Feed
- Real-time updates
- Activity history
- Status indicators

## Troubleshooting

**Console returns 500?**
- Check `/api/health/console`
- Verify environment variables
- Check migrations applied

**Can't access Console?**
- Verify signed in
- Check Supabase auth
- Verify billing account

**API keys not working?**
- Check key format: `rk_...`
- Verify not revoked
- Check scopes

## Documentation

- [Console Complete Guide](docs/CONSOLE_COMPLETE.md)
- [SDK/CLI Integration](docs/SDK_CLI_CONSOLE_INTEGRATION.md)
- [Setup Guide](SETUP_GUIDE.md)

## Support

- 📖 [Documentation](https://docs.settler.io)
- 💬 [Discord](https://discord.gg/settler)
- 🐛 [Issues](https://github.com/settler/settler/issues)
