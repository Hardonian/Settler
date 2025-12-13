# Settler Web Application

Next.js web application including marketing site, documentation, and **Developer Console**.

## Features

- ✅ **Marketing Site** - Landing pages, pricing, documentation
- ✅ **Developer Console** - Full-featured management interface
- ✅ **Authentication** - Supabase Auth integration
- ✅ **API Routes** - Server-side API endpoints
- ✅ **Type Safety** - Full TypeScript support

## Developer Console

The Developer Console (`/console`) provides a complete interface for managing your Settler resources:

### Features

- **API Key Management** - Create, list, and revoke API keys
- **Usage Analytics** - Monitor API usage across all services
- **Receipt Browser** - View parsed receipts and details
- **Feature Flags** - Manage feature flags for your applications
- **Live Activity Feed** - Real-time activity monitoring
- **Billing Dashboard** - View usage and billing information

### Access

1. Sign up at `/signup`
2. Navigate to `/console`
3. Start managing your resources!

### API Endpoints

All Console APIs support both:
- **Session Auth** (Console UI) - Uses Supabase session cookies
- **API Key Auth** (SDK/CLI) - Uses `X-API-Key` header

See [SDK/CLI/Console Integration Guide](../../docs/SDK_CLI_CONSOLE_INTEGRATION.md) for details.

## Setup

### Prerequisites

- Node.js 20+
- npm 10+
- Supabase account (or local Supabase)
- Environment variables configured

### Environment Variables

Required:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `DATABASE_URL` - PostgreSQL connection string (for Prisma)

Optional:
- `SUPABASE_SERVICE_ROLE_KEY` - For admin operations
- `SUPABASE_URL` - Alternative to NEXT_PUBLIC_ prefix
- `SUPABASE_ANON_KEY` - Alternative to NEXT_PUBLIC_ prefix

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Starts development server at `http://localhost:3000`

### Build

```bash
npm run build
npm start
```

### Console Routes

- `/console` - Overview dashboard
- `/console/api-keys` - API key management
- `/console/usage` - Usage analytics
- `/console/receipts` - Receipt browser
- `/console/feature-flags` - Feature flag management
- `/console/billing` - Billing dashboard
- `/console/site` - Site designer
- `/console/docs` - API documentation

### API Routes

- `/api/console/api-keys` - API key CRUD
- `/api/console/usage` - Usage statistics
- `/api/console/receipts` - Receipt management
- `/api/console/feature-flags` - Feature flag management
- `/api/console/activities` - Activity feed
- `/api/health/console` - Health check

## Architecture

### Authentication

- **Session Auth**: Console UI uses Supabase session cookies
- **API Key Auth**: SDK/CLI uses API keys in headers
- **Unified Middleware**: `lib/api/unified-auth.ts` handles both

### Error Handling

- **Never Returns 500**: All routes handle errors gracefully
- **Empty States**: Returns empty arrays/defaults on errors
- **Proper Status Codes**: 401 (unauthorized), 403 (forbidden), 404 (not found)

### Activity Logging

All Console operations are logged to `console_activities` table:
- API key operations
- Usage queries
- Receipt views
- Feature flag changes

## Testing

```bash
# Type check
npm run typecheck

# Lint
npm run lint

# Build
npm run build

# Smoke tests
npm run test:smoke
```

## Deployment

### Vercel (Recommended)

1. Connect GitHub repository
2. Configure environment variables
3. Deploy automatically on push

### Manual Deployment

```bash
npm run build
# Deploy dist/ folder to your hosting provider
```

## Database Migrations

Migrations run automatically on PR push/merge via GitHub Actions.

For local development:
```bash
supabase db push
```

See [Automatic Migrations Guide](../../docs/AUTOMATIC_MIGRATIONS.md) for details.

## Documentation

- [Console Complete Guide](../../docs/CONSOLE_COMPLETE.md)
- [SDK/CLI/Console Integration](../../docs/SDK_CLI_CONSOLE_INTEGRATION.md)
- [Console Setup Guide](../../CONSOLE_SETUP_GUIDE.md)

## Support

- 📖 [Documentation](https://docs.settler.io)
- 💬 [Discord Community](https://discord.gg/settler)
- 🐛 [Issue Tracker](https://github.com/settler/settler/issues)
