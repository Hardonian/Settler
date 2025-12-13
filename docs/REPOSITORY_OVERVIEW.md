# Settler Repository Overview

Complete overview of the Settler monorepo structure and organization.

## Repository Structure

```
Settler-API/
├── packages/
│   ├── web/              # Next.js web app + Developer Console
│   ├── sdk/              # TypeScript SDK (includes Console client)
│   ├── cli/              # CLI tool (includes Console commands)
│   ├── api/              # Core API server
│   ├── adapters/         # Adapter implementations
│   └── ...
├── supabase/
│   └── migrations/       # Database migrations (auto-run on PR)
├── docs/                 # Documentation
├── scripts/              # Utility scripts
└── .github/
    └── workflows/       # CI/CD (includes auto-migrations)
```

## Packages

### `packages/web` - Web Application

**Purpose**: Next.js application with marketing site and Developer Console

**Key Features**:
- Marketing pages (landing, pricing, docs)
- Developer Console (`/console`)
- API routes (`/api/console/*`)
- Authentication (Supabase)

**Console Routes**:
- `/console` - Overview
- `/console/api-keys` - API key management
- `/console/usage` - Usage analytics
- `/console/receipts` - Receipt browser
- `/console/feature-flags` - Feature flags
- `/console/billing` - Billing dashboard

**Setup**:
```bash
cd packages/web
npm install
npm run dev
```

**Documentation**: [packages/web/README.md](../packages/web/README.md)

### `packages/sdk` - TypeScript SDK

**Purpose**: Official SDK for Settler API

**Key Features**:
- Full TypeScript support
- Console client included
- Automatic retries
- Request deduplication
- Webhook verification

**Console Client**:
```typescript
import Settler from '@settler/sdk';
const client = new Settler({ apiKey: 'rk_...' });
await client.console.listApiKeys();
await client.console.getUsage(7);
```

**Setup**:
```bash
npm install @settler/sdk
```

**Documentation**: [packages/sdk/README.md](../packages/sdk/README.md)

### `packages/cli` - CLI Tool

**Purpose**: Command-line interface for Settler

**Key Features**:
- Console management commands
- Uses SDK internally
- Consistent with SDK/Console UI

**Console Commands**:
```bash
settler console api-keys list
settler console usage summary
settler console health
```

**Setup**:
```bash
npm install -g @settler/cli
export SETTLER_API_KEY=rk_...
```

**Documentation**: [packages/cli/README.md](../packages/cli/README.md)

## Developer Console

### Architecture

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
                  │ Middleware       │
                  └────────┬────────┘
                           │
                  ┌────────▼────────┐
                  │  Console APIs   │
                  │  /api/console/* │
                  └─────────────────┘
```

### Key Files

**Backend**:
- `packages/web/src/app/api/console/*` - API routes
- `packages/web/src/domain/console/*` - Domain logic
- `packages/web/src/lib/api/unified-auth.ts` - Unified auth
- `packages/web/src/lib/console/activity-logger.ts` - Logging

**Frontend**:
- `packages/web/src/app/console/*` - Console pages
- `packages/web/src/components/console/*` - Components

**SDK**:
- `packages/sdk/src/clients/console.ts` - Console client

**CLI**:
- `packages/cli/src/commands/console.ts` - Console commands

**Types**:
- `packages/web/src/shared/types/console.ts` - Shared types

## Database Migrations

### Location

Migrations are in `supabase/migrations/`:
- `20260125000000_console_rls_fixes.sql` - RLS fixes
- `20260125000001_console_activity_logging.sql` - Activity logging

### Automatic Deployment

Migrations run automatically:
- **PR Push** → Preview database
- **PR Merge** → Production database

**Workflows**:
- `.github/workflows/supabase-migrate.yml` - Main migration workflow
- `.github/workflows/auto-migrate-on-pr-push.yml` - PR push workflow

See [Automatic Migrations Guide](AUTOMATIC_MIGRATIONS.md) for setup.

## Environment Variables

### Required

**Supabase**:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (for admin ops)

**Database**:
- `DATABASE_URL`
- `DIRECT_URL` (for Prisma)

**Auth**:
- `JWT_SECRET`
- `ENCRYPTION_KEY`

### GitHub Secrets (CI/CD)

See [GitHub Secrets Setup](GITHUB_SECRETS_SETUP.md) for complete list.

## Development Workflow

### 1. Local Development

```bash
# Clone
git clone https://github.com/settler/settler.git
cd settler

# Install
npm install

# Setup env
cp .env.example .env
# Edit .env with your values

# Start
npm run dev
```

### 2. Make Changes

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes
# ...

# Test
npm run typecheck
npm run lint
npm run build
```

### 3. Database Changes

```bash
# Create migration
touch supabase/migrations/YYYYMMDDHHMMSS_description.sql

# Write migration SQL
# ...

# Commit
git add supabase/migrations/
git commit -m "Add migration: description"
```

### 4. Push & Deploy

```bash
# Push to PR
git push origin feature/my-feature

# Migrations run automatically on PR push
# Code deploys on merge
```

## Testing

### Unit Tests

```bash
npm run test
```

### Integration Tests

```bash
npm run test:integration
```

### E2E Tests

```bash
npm run test:e2e
```

### Smoke Tests

```bash
npm run test:smoke
```

## Documentation

### Main Docs

- [README.md](../README.md) - Main repository README
- [SETUP_GUIDE.md](../SETUP_GUIDE.md) - Complete setup guide
- [CONSOLE_SETUP_GUIDE.md](../CONSOLE_SETUP_GUIDE.md) - Console setup

### Console Docs

- [CONSOLE_COMPLETE.md](CONSOLE_COMPLETE.md) - Full Console guide
- [CONSOLE_SETUP.md](CONSOLE_SETUP.md) - Console setup
- [SDK_CLI_CONSOLE_INTEGRATION.md](SDK_CLI_CONSOLE_INTEGRATION.md) - Integration guide

### Setup Docs

- [AUTOMATIC_MIGRATIONS.md](AUTOMATIC_MIGRATIONS.md) - Migration automation
- [GITHUB_SECRETS_SETUP.md](GITHUB_SECRETS_SETUP.md) - CI/CD setup

## Key Features

### Unified Authentication

- Session auth for Console UI
- API key auth for SDK/CLI
- Unified middleware handles both

### Shared Types

- Single source of truth: `shared/types/console.ts`
- Exported by SDK
- Used by CLI, SDK, Console UI, Backend

### Activity Logging

- All operations logged
- Real-time activity feed
- Audit trail for compliance

### Error Handling

- Never returns 500
- Graceful degradation
- User-friendly errors

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for:
- Code style guidelines
- Testing requirements
- Pull request process
- Console contribution guidelines

## Support

- 📖 [Documentation](https://docs.settler.io)
- 💬 [Discord Community](https://discord.gg/settler)
- 🐛 [Issue Tracker](https://github.com/settler/settler/issues)
- 📧 [Email Support](mailto:support@settler.io)
