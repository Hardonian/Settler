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
- `packages/web`: Next.js marketing site, documentation, and developer console
- `packages/sdk`: Official Node.js/TypeScript SDK
- `packages/sdk-python`: Official Python SDK
- `packages/sdk-go`: Official Go SDK
- `packages/sdk-ruby`: Official Ruby SDK
- `packages/cli`: Command-line tool for local development
- `packages/react-settler`: React components for integration
- `packages/adapters`: Adapter implementations for various services

## Quick Start

### Prerequisites

- Node.js 24.0.0 or higher
- npm 10.0.0 or higher
- PostgreSQL 15+ (or Supabase account)
- Redis (or Upstash account)
- Docker & Docker Compose (for local development)

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
   
   Copy `.env.example` to `.env` in the root directory and configure:
   
   **Required variables:**
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
   - `UPSTASH_REDIS_REST_URL`: Your Upstash Redis REST URL
   - `UPSTASH_REDIS_REST_TOKEN`: Your Upstash Redis REST token
   - `JWT_SECRET`: Secret key for JWT signing (minimum 32 characters)
   - `ENCRYPTION_KEY`: Encryption key for sensitive data (exactly 32 characters)
   
   **Optional variables:**
   - `SENTRY_DSN`: Error tracking (optional)
   - `LOG_LEVEL`: Logging level (default: `info`)
   - `OTLP_ENDPOINT`: OpenTelemetry endpoint for distributed tracing
   
   See `config/env.schema.ts` for complete environment variable documentation.

4. **Start local services** (PostgreSQL and Redis):
   ```bash
   docker-compose up -d
   ```
   
   Or use Supabase and Upstash cloud services instead.

5. **Run database migrations**:
   ```bash
   npm run db:migrate:local
   ```

6. **Start the development server**:
   ```bash
   npm run dev
   ```

   This starts both the API server (`packages/api`) and the web application (`packages/web`).

### Self-Hosting (Docker)

For production self-hosting, see the [Self-Hosting Guide](enterprise/SELF_HOSTING.md).

## Billing Model

Settler uses usage-based billing with metered usage tracking:

- **Free Tier**: 1,000 reconciliations/month, 100 receipt parses/month, 100k feature flag evaluations/month
- **Commercial**: $99/month - 100,000 reconciliations/month, 10,000 receipt parses/month, 1M feature flag evaluations/month
- **Enterprise**: Custom pricing with unlimited usage and SLA guarantees

Usage is tracked for reconciliation operations, receipt parsing, and feature flag evaluations. See [docs/billing.md](docs/billing.md) for detailed pricing information.

## Documentation

- **[Architecture](docs/architecture.md)**: System architecture and design patterns
- **[API Reference](docs/api.md)**: Complete API documentation
- **[Getting Started](docs/getting-started.md)**: Developer onboarding guide
- **[Billing](docs/billing.md)**: Pricing and usage information
- **[Security](SECURITY.md)**: Security practices and vulnerability reporting
- **[Contributing](CONTRIBUTING.md)**: Contribution guidelines

Full documentation is also available at [settler.dev/docs](https://settler.dev/docs).

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
