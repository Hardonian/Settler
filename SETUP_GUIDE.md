# Settler Setup Guide

Complete setup guide for local development and production deployment.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Environment Variables](#environment-variables)
4. [Database Setup](#database-setup)
5. [Running the Application](#running-the-application)
6. [Developer Console](#developer-console)
7. [SDK & CLI Setup](#sdk--cli-setup)
8. [Production Deployment](#production-deployment)
9. [Verification](#verification)

## Prerequisites

- **Node.js**: 20.0.0 or higher
- **npm**: 10.0.0 or higher
- **PostgreSQL**: 15+ (or Supabase account)
- **Redis**: (or Upstash account)
- **Git**: For version control
- **Docker & Docker Compose**: (optional, for local services)

## Local Development Setup

### 1. Clone Repository

```bash
git clone https://github.com/shardie-github/Settler-API.git
cd Settler-API
```

### 2. Install Dependencies

```bash
npm install
```

This installs dependencies for all packages in the monorepo.

### 3. Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and configure required variables (see [Environment Variables](#environment-variables) section).

### 4. Start Local Services (Optional)

If using Docker for local PostgreSQL/Redis:

```bash
docker-compose up -d
```

Or use cloud services:
- **Supabase** for PostgreSQL
- **Upstash** for Redis

### 5. Database Migrations

**Automatic (Recommended)**: Migrations run automatically on PR push/merge.

**Manual (Local Development)**:

```bash
# Using Supabase CLI
supabase db push

# Or using Prisma
npm run prisma:migrate
```

### 6. Start Development Server

```bash
npm run dev
```

This starts:
- Web application: `http://localhost:3000`
- API server: `http://localhost:3001` (if running separately)

## Environment Variables

### Required Variables

#### Supabase
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (for admin operations)
- `SUPABASE_DB_PASSWORD` - Database password

#### Database
- `DATABASE_URL` - PostgreSQL connection string
- `DIRECT_URL` - Direct PostgreSQL connection (for Prisma)

#### Authentication
- `JWT_SECRET` - Secret for JWT signing (minimum 32 characters)
- `ENCRYPTION_KEY` - Encryption key (exactly 32 characters)

### Optional Variables

- `UPSTASH_REDIS_REST_URL` - Redis REST URL (for rate limiting)
- `UPSTASH_REDIS_REST_TOKEN` - Redis REST token
- `SENTRY_DSN` - Error tracking
- `LOG_LEVEL` - Logging level (default: `info`)
- `OTLP_ENDPOINT` - OpenTelemetry endpoint

### GitHub Secrets (for CI/CD)

For automatic migrations, configure these in GitHub → Settings → Secrets:

**Production:**
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_REF`
- `DATABASE_URL`
- `DIRECT_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DB_PASSWORD`

**Preview (Optional):**
- `SUPABASE_PROJECT_REF_PREVIEW`
- `DATABASE_URL_PREVIEW`
- `DIRECT_URL_PREVIEW`
- `SUPABASE_URL_PREVIEW`
- `SUPABASE_ANON_KEY_PREVIEW`
- `SUPABASE_SERVICE_ROLE_KEY_PREVIEW`
- `SUPABASE_DB_PASSWORD_PREVIEW`

See [Automatic Migrations Guide](docs/AUTOMATIC_MIGRATIONS.md) for details.

## Database Setup

### Supabase (Recommended)

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your project URL and keys from Settings → API
3. Set environment variables:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

### Local PostgreSQL

1. Start PostgreSQL:
   ```bash
   docker-compose up -d postgres
   ```

2. Set environment variables:
   ```bash
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/settler
   ```

### Migrations

Migrations are in `supabase/migrations/` and run automatically on PR push/merge.

**Manual run:**
```bash
supabase db push
```

## Running the Application

### Development Mode

```bash
npm run dev
```

Starts both web and API servers with hot reload.

### Production Build

```bash
npm run build
npm start
```

### Individual Packages

```bash
# Web only
cd packages/web
npm run dev

# API only
cd packages/api
npm run dev
```

## Developer Console

### Access

1. Start the application: `npm run dev`
2. Navigate to `http://localhost:3000`
3. Sign up at `/signup`
4. Access Console at `/console`

### Features

- **API Key Management** - Create and manage API keys
- **Usage Analytics** - Monitor API usage
- **Receipt Browser** - View parsed receipts
- **Feature Flags** - Manage feature flags
- **Live Activity Feed** - Real-time activity monitoring
- **Billing Dashboard** - View billing information

### Authentication

Console uses Supabase session authentication. Users must sign up/login to access.

## SDK & CLI Setup

### SDK Installation

```bash
npm install @settler/sdk
```

### SDK Usage

```typescript
import Settler from '@settler/sdk';

const client = new Settler({
  apiKey: 'rk_your_api_key',
  baseUrl: 'https://api.settler.io',
});

// Use Console client
const keys = await client.console.listApiKeys();
const usage = await client.console.getUsage(7);
```

### CLI Installation

```bash
npm install -g @settler/cli
```

### CLI Usage

```bash
# Set API key
export SETTLER_API_KEY=rk_your_api_key

# Use Console commands
settler console api-keys list
settler console usage summary
settler console health
```

See [SDK/CLI/Console Integration Guide](docs/SDK_CLI_CONSOLE_INTEGRATION.md) for details.

## Production Deployment

### Vercel (Recommended)

1. **Connect Repository**
   - Go to [Vercel](https://vercel.com)
   - Import your GitHub repository

2. **Configure Environment Variables**
   - Add all required environment variables
   - Set production values

3. **Deploy**
   - Vercel automatically deploys on push to `main`
   - Migrations run automatically via GitHub Actions

### Manual Deployment

1. **Build**
   ```bash
   npm run build
   ```

2. **Deploy**
   - Upload `packages/web/.next` to your hosting provider
   - Configure environment variables
   - Start the application

### Database Migrations

Migrations run automatically on PR merge via GitHub Actions. No manual steps needed!

See [Automatic Migrations Guide](docs/AUTOMATIC_MIGRATIONS.md) for setup.

## Verification

### Health Checks

```bash
# Console health
curl https://your-domain.com/api/health/console

# General health
curl https://your-domain.com/api/status/health
```

### Smoke Tests

```bash
npm run test:smoke
```

### Manual Testing

1. **Console Access**
   - Navigate to `/console`
   - Should load without 500 errors
   - Should show sign-in prompt if not authenticated

2. **API Keys**
   - Create an API key in Console
   - Use it with SDK/CLI
   - Verify it works

3. **SDK Integration**
   ```typescript
   const client = new Settler({ apiKey: 'your_key' });
   const keys = await client.console.listApiKeys();
   ```

4. **CLI Integration**
   ```bash
   settler console api-keys list
   ```

## Troubleshooting

### Console Returns 500

1. Check health endpoint: `/api/health/console`
2. Verify environment variables are set
3. Check database migrations applied
4. Review server logs

### Migrations Not Running

1. Check GitHub Actions workflow status
2. Verify GitHub secrets are configured
3. Check migration file paths are correct
4. Review workflow logs

### SDK/CLI Authentication Fails

1. Verify API key format: `rk_...`
2. Check API key is not revoked/expired
3. Verify `SETTLER_BASE_URL` is correct
4. Check network connectivity

### Database Connection Issues

1. Verify `DATABASE_URL` is correct
2. Check database is accessible
3. Verify credentials are correct
4. Check firewall rules

## Next Steps

1. ✅ Complete setup
2. ✅ Access Console at `/console`
3. ✅ Create API key
4. ✅ Test SDK/CLI
5. ✅ Deploy to production

## Additional Resources

- [Console Complete Guide](docs/CONSOLE_COMPLETE.md)
- [SDK/CLI/Console Integration](docs/SDK_CLI_CONSOLE_INTEGRATION.md)
- [Automatic Migrations](docs/AUTOMATIC_MIGRATIONS.md)
- [Architecture Documentation](docs/ARCHITECTURE.md)
- [API Reference](docs/api.md)

## Support

- 📖 [Documentation](https://docs.settler.io)
- 💬 [Discord Community](https://discord.gg/settler)
- 🐛 [Issue Tracker](https://github.com/settler/settler/issues)
- 📧 [Email Support](mailto:support@settler.io)
