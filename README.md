# Settler

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)

Settler is an open-source API infrastructure for financial reconciliation, receipt parsing, and deterministic compliance. It provides engineering teams with the primitives to build reliable financial software without reinventing the wheel.

## What is Settler?

Settler is a Reconciliation-as-a-Service platform that helps engineering teams automate financial data reconciliation across multiple systems. It provides:

- **Reconciliation Engine**: Event-sourced matching engine for high-volume transaction processing
- **Receipts API**: AI-powered OCR to extract structured JSON from PDFs and images
- **Feature Flags**: Edge-compatible flags designed for financial rollouts
- **Deterministic Math**: Unit and currency conversion libraries that avoid floating-point errors
- **Developer Console**: Real-time visibility into your financial data flows

## Core Use Cases

- **Payment Reconciliation**: Match payments between payment processors (Stripe, PayPal) and accounting systems (QuickBooks, Xero)
- **E-commerce Reconciliation**: Reconcile orders from Shopify, WooCommerce with payment processors and fulfillment systems
- **Receipt Processing**: Extract structured data from receipts and invoices for expense management
- **Multi-Currency Reconciliation**: Handle currency conversion and reconciliation across international transactions
- **Compliance Auditing**: Maintain audit trails and deterministic compliance reporting

## Architecture

Settler follows a **Hexagonal Architecture** (Ports & Adapters) pattern with **CQRS** and **Event-Driven** principles:

- **Domain Layer**: Core business logic, independent of infrastructure
- **Application Layer**: Orchestrates domain objects to fulfill use cases
- **Infrastructure Layer**: Database, caching, external service adapters
- **Presentation Layer**: HTTP API routes and middleware

The system is built with TypeScript, Express, PostgreSQL (via Supabase), and Redis (via Upstash). It's designed to be serverless-ready and can be deployed to Vercel, AWS Lambda, or self-hosted.

For detailed architecture documentation, see [docs/architecture.md](docs/architecture.md).

## Packages

This monorepo contains the following packages:

- `packages/api`: Core Node.js API server (Express/PostgreSQL/Redis)
- `packages/web`: Next.js marketing site, documentation, and **Developer Console**
- `packages/sdk`: Official Node.js/TypeScript SDK (includes Console client)
- `packages/sdk-python`: Official Python SDK
- `packages/sdk-go`: Official Go SDK
- `packages/sdk-ruby`: Official Ruby SDK
- `packages/cli`: Command-line tool with Console management commands
- `packages/react-settler`: React components for integration
- `packages/adapters`: Adapter implementations for various services

### Developer Console

The **Developer Console** (`/console`) provides:
- ✅ **API Key Management** - Create, list, and revoke API keys
- ✅ **Usage Analytics** - Monitor API usage across all services
- ✅ **Receipt Browser** - View parsed receipts and details
- ✅ **Feature Flags** - Manage feature flags for your applications
- ✅ **Live Activity Feed** - Real-time activity monitoring
- ✅ **Billing Dashboard** - View usage and billing information

Access the Console at `/console` after signing up. See [Console Documentation](docs/CONSOLE_COMPLETE.md) for details.

## Quick Start

### Prerequisites

- Node.js 20.0.0 or higher
- npm 10.0.0 or higher
- PostgreSQL 15+ (or Supabase account)
- Redis (or Upstash account)
- Docker & Docker Compose (optional, for local services)

### Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/shardie-github/Settler-API.git
   cd Settler-API
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   
   Copy `.env.example` to `.env` and configure:
   
   **Required:**
   - `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
   - `DATABASE_URL` - PostgreSQL connection string
   - `JWT_SECRET` - JWT signing secret (32+ characters)
   - `ENCRYPTION_KEY` - Encryption key (exactly 32 characters)
   
   **Optional:**
   - `SUPABASE_SERVICE_ROLE_KEY` - For admin operations
   - `UPSTASH_REDIS_REST_URL` - Redis REST URL
   - `UPSTASH_REDIS_REST_TOKEN` - Redis REST token
   
   See [Setup Guide](SETUP_GUIDE.md) for complete configuration.

4. **Start local services** (optional):
   ```bash
   docker-compose up -d
   ```
   
   Or use Supabase and Upstash cloud services.

5. **Run database migrations**:
   
   **Automatic (Recommended)**: Migrations run automatically on PR push/merge.
   
   **Manual (Local)**:
   ```bash
   supabase db push
   ```
   
   See [Automatic Migrations Guide](docs/AUTOMATIC_MIGRATIONS.md).

6. **Start development server**:
   ```bash
   npm run dev
   ```
   
   Access:
   - Web app: `http://localhost:3000`
   - Console: `http://localhost:3000/console` (after signup)

### Access Developer Console

1. Navigate to `http://localhost:3000`
2. Sign up at `/signup`
3. Access Console at `/console`
4. Create API keys, monitor usage, manage resources

See [Setup Guide](SETUP_GUIDE.md) for detailed instructions.

### Self-Hosting (Docker)

For production self-hosting, see the [Self-Hosting Guide](enterprise/SELF_HOSTING.md).

## Billing Model

Settler uses usage-based billing with metered usage tracking:

- **Free Tier**: 1,000 reconciliations/month, 100 receipt parses/month, 100k feature flag evaluations/month
- **Commercial**: $99/month - 100,000 reconciliations/month, 10,000 receipt parses/month, 1M feature flag evaluations/month
- **Enterprise**: Custom pricing with unlimited usage and SLA guarantees

Usage is tracked for reconciliation operations, receipt parsing, and feature flag evaluations. See [docs/billing.md](docs/billing.md) for detailed pricing information.

## Documentation

### Core Documentation
- **[Architecture](docs/ARCHITECTURE.md)**: Complete system architecture and design patterns
- **[Critical Paths](docs/CRITICAL_PATHS.md)**: User journey documentation and failure modes
- **[Security](docs/SECURITY.md)**: Security practices, compliance, and vulnerability reporting
- **[API Reference](docs/api.md)**: Complete API documentation
- **[Getting Started](docs/getting-started.md)**: Developer onboarding guide
- **[Billing](docs/billing.md)**: Pricing and usage information
- **[Contributing](CONTRIBUTING.md)**: Contribution guidelines

### Developer Console
- **[Console Complete Guide](docs/CONSOLE_COMPLETE.md)**: Full Console documentation
- **[SDK/CLI/Console Integration](docs/SDK_CLI_CONSOLE_INTEGRATION.md)**: Unified integration guide
- **[Console Setup](CONSOLE_SETUP_GUIDE.md)**: Console setup and configuration

### Setup & Deployment
- **[Automatic Migrations](docs/AUTOMATIC_MIGRATIONS.md)**: Database migration automation
- **[Quick Start Guide](QUICK_START_GUIDE.md)**: Quick setup instructions
- **[GitHub Secrets Setup](docs/GITHUB_SECRETS_SETUP.md)**: CI/CD configuration

Full documentation is also available at [settler.dev/docs](https://settler.dev/docs).

## Developer Console

The **Developer Console** (`/console`) is fully integrated with SDK and CLI:

- ✅ **Unified Authentication** - Session auth (UI) + API key auth (SDK/CLI)
- ✅ **Shared Types** - Consistent types across SDK, CLI, and Console
- ✅ **Same APIs** - All interfaces use the same backend APIs
- ✅ **Activity Logging** - All operations logged for audit trail
- ✅ **Real-time Feed** - Live activity monitoring
- ✅ **Never Returns 500** - Graceful error handling

See [Console Setup Guide](CONSOLE_SETUP_GUIDE.md) and [SDK/CLI/Console Integration](docs/SDK_CLI_CONSOLE_INTEGRATION.md).

## Production Readiness

This codebase has undergone a comprehensive hardening pass:

- ✅ **Error Handling**: Graceful degradation, safe helpers, error boundaries, retry components
- ✅ **Security**: Redis-backed rate limiting, security headers, webhook verification, RLS policies, request size limits
- ✅ **Billing**: Reconciliation service, webhook hardening, admin tools, Stripe rate limit handling
- ✅ **Database**: Integrity checks, RLS verification, sanity scripts, **automatic migrations**
- ✅ **Monitoring**: Metrics tracking, audit logging, performance utilities
- ✅ **Testing**: Smoke tests, CI/CD, build verification
- ✅ **Documentation**: Architecture docs, critical paths, security guide, Console docs
- ✅ **Future-Proofing**: Cache abstraction, API versioning, performance utilities
- ✅ **Console**: Fully integrated SDK/CLI/Console with unified auth

## Quick Verification

After deployment, verify everything works:

```bash
# Health checks
curl https://your-domain.com/api/health/console
curl https://your-domain.com/api/status/health

# Run database sanity checks
npm run db:sanity-check

# Run smoke tests (requires running server)
npm run test:smoke

# Check build
npm run build
npm run typecheck
npm run lint

# Test Console access
# Navigate to https://your-domain.com/console
# Should load without 500 errors
```

## Developer Console Quick Test

```bash
# 1. Access Console
open https://your-domain.com/console

# 2. Create API key via CLI
export SETTLER_API_KEY=your_session_key_or_create_one
settler console api-keys create --name "Test Key"

# 3. Use SDK
node -e "
const Settler = require('@settler/sdk');
const client = new Settler({ apiKey: 'rk_...' });
client.console.listApiKeys().then(keys => console.log(keys));
"
```

## Optional Enhancements

For enhanced features, install optional dependencies:

```bash
# Redis-backed rate limiting (falls back to in-memory if not installed)
npm install @upstash/redis
```

Then configure environment variables:
```bash
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

## Security

Settler is designed for SOC 2 and ISO 27001 compliance:

- All data at rest is encrypted (AES-256)
- Audit logs are immutable
- Row-level security (RLS) for multi-tenant isolation
- Input validation with Zod schemas
- Rate limiting and DDoS protection

To report a security vulnerability, please see [SECURITY.md](SECURITY.md).

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for:

- Development setup instructions
- Code style guidelines
- Testing requirements
- Pull request process

## Support

- **Documentation**: [settler.dev/docs](https://settler.dev/docs)
- **Issues**: [GitHub Issues](https://github.com/shardie-github/Settler-API/issues)
- **Email**: support@settler.io
- **Security**: security@settler.io

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
