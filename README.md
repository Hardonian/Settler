# Settler: Reconciliation-as-a-Service API

[![CI Status](https://img.shields.io/badge/CI-Passing-brightgreen)](https://github.com/shardie-github/Settler-API/actions)
[![Version](https://img.shields.io/badge/Version-v1.0.0-blue)](https://github.com/shardie-github/Settler-API/releases)
[![License](https://img.shields.io/badge/License-Commercial-lightgrey)](LICENSE)

**Settler** automates financial reconciliation across Stripe, Shopify, QuickBooks, and 50+ platforms—eliminating hours of manual work with a 5-minute API integration.

---

## Table of Contents

- [What is Settler?](#what-is-settler)
- [Why Settler?](#why-settler)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Security & Privacy](#security--privacy)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [Support](#support)

---

## What is Settler?

Settler is **reconciliation-as-a-service** for modern businesses. We eliminate the expensive pain of manually matching transactions across fragmented SaaS platforms—reducing reconciliation time from hours to minutes, preventing revenue leakage, and ensuring compliance—all through a single API.

### Key Features

- ⚡ **5-minute integration** vs. weeks of custom code
- 🔄 **Real-time reconciliation** vs. batch processing
- 🔌 **Composable adapters** for 50+ platforms
- 🔒 **Compliance built-in** (SOC 2, GDPR, PCI-DSS ready)
- 📊 **Comprehensive reporting** with audit trails
- 🚀 **Scalable** from 1K to 1M+ transactions/month

### Use Cases

- **E-commerce Reconciliation:** Match Shopify orders with Stripe payments, PayPal refunds, shipping costs
- **SaaS Revenue Recognition:** Reconcile Stripe subscriptions with QuickBooks revenue
- **Multi-Payment Provider:** Match transactions across Stripe, PayPal, Square, Apple Pay
- **Accounting Integration:** Sync Stripe/Shopify data with QuickBooks/NetSuite automatically
- **Compliance Auditing:** Generate audit trails for SOC 2, PCI-DSS, financial audits

---

## Why Settler?

### The Problem

Modern businesses operate across 10+ platforms: Stripe for payments, Shopify for orders, QuickBooks for accounting, NetSuite for ERP. Finance teams spend 2-3 hours daily manually reconciling transactions, causing:

- 💸 **Revenue Leakage:** Unmatched transactions = lost revenue
- ⚖️ **Compliance Risks:** Manual reconciliation fails audits
- ⏰ **Operational Overhead:** Hours wasted on repetitive work
- 🔧 **Developer Friction:** Weeks of custom reconciliation code that breaks

### The Solution

Settler provides a single API that normalizes, validates, and reconciles data across all platforms in real-time:

1. Connect your platforms (Stripe, Shopify, QuickBooks, etc.) via adapters
2. Configure matching rules (order ID, amount, timestamp)
3. Automatic reconciliation runs in real-time or on schedule
4. Get reports and alerts for mismatches

### Competitive Advantages

- **10-100x cheaper** than enterprise solutions (BlackLine, Trintech)
- **5-minute setup** vs. 3-6 months for enterprise solutions
- **API-first** vs. UI-heavy legacy systems
- **Real-time** vs. batch processing
- **Composable** adapter SDK vs. closed systems

---

## Quick Start

### Install the SDK

```bash
npm install @settler/sdk
```

### Get Your API Key

1. Sign up at [settler.io/signup](https://settler.io/signup)
2. Get your API key from the dashboard
3. Store it securely: `export SETTLER_API_KEY="sk_..."`

### Create Your First Reconciliation

```typescript
import Settler from "@settler/sdk";

const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});

const job = await settler.jobs.create({
  name: "Shopify-Stripe Reconciliation",
  source: {
    adapter: "shopify",
    config: {
      apiKey: process.env.SHOPIFY_API_KEY,
      shopDomain: "your-shop.myshopify.com",
    },
  },
  target: {
    adapter: "stripe",
    config: {
      apiKey: process.env.STRIPE_SECRET_KEY,
    },
  },
  rules: {
    matching: [
      { field: "order_id", type: "exact" },
      { field: "amount", type: "exact", tolerance: 0.01 },
      { field: "date", type: "range", days: 1 },
    ],
  },
});

const result = await settler.jobs.run(job.data.id);
console.log(`Matched: ${result.data.matched}, Exceptions: ${result.data.exceptions}`);
```

**Time to First Value:** <24 hours

See [API Quick Start Guide](./docs/api-quick-start.md) for detailed instructions.

---

## Architecture

Settler is built as a modern, API-first monorepo using TypeScript, Node.js, and serverless infrastructure.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Applications                      │
│  (Web Dashboard, CLI, SDK, Third-party Integrations)        │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS / REST API
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    API Gateway Layer                        │
│  (Authentication, Authorization, Rate Limiting, Quotas)     │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                   Application Layer                         │
│  (Job Management, Reconciliation Engine, Matching Rules)   │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                  Adapter Layer                              │
│  (Stripe, Shopify, PayPal, Square, QuickBooks, Xero, etc.)  │
└──────────────────────┬──────────────────────────────────────┘
                       │ External APIs
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              External Platform APIs                         │
│  (Stripe API, Shopify API, QuickBooks API, etc.)            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                               │
│  (PostgreSQL/Supabase, Redis, File Storage)                 │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Runtime:** Node.js 20.19.6+, TypeScript 5.7+
- **Framework:** Express.js (API), Next.js (Web)
- **Database:** PostgreSQL 15+ (via Supabase)
- **Cache:** Redis (via Upstash)
- **Infrastructure:** Vercel (serverless), AWS Lambda
- **Monorepo:** Turborepo, npm workspaces

See [Architecture Overview](./docs/overview.md) for detailed architecture documentation.

---

## Getting Started

### Prerequisites

- **Node.js:** 20.19.6+ (see `.nvmrc`)
- **npm:** 10.0.0+
- **PostgreSQL:** 15+ (or Supabase account)
- **Redis:** (or Upstash account)

### Installation

```bash
# Clone the repository
git clone https://github.com/shardie-github/Settler-API.git
cd Settler-API

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
npm run db:migrate:local

# Start development server
npm run dev
```

### Development Commands

```bash
# Run linting
npm run lint
npm run lint:fix

# Run type checking
npm run typecheck

# Run tests
npm run test
npm run test:e2e

# Format code
npm run format
npm run format:check

# Build all packages
npm run build

# Database operations
npm run db:migrate:local    # Run migrations locally
npm run db:push            # Push schema changes
npm run db:reset           # Reset database
```

See [Local Development Setup](./docs/LOCAL_DEV_SETUP.md) for complete setup instructions.

---

## Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# API Configuration
SETTLER_API_KEY=sk_...
NODE_ENV=development

# Database (Supabase)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# External APIs
STRIPE_SECRET_KEY=sk_...
SHOPIFY_API_KEY=...
QUICKBOOKS_CLIENT_ID=...
```

See [Environment Setup](./docs/LOCAL_DEV_SETUP.md#environment-variables) for complete configuration guide.

---

## Deployment

### Vercel Deployment

Settler is optimized for Vercel serverless deployment:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Environment Variables

Set environment variables in Vercel dashboard or via CLI:

```bash
vercel env add SETTLER_API_KEY
vercel env add SUPABASE_URL
# ... etc
```

See [Deployment Guide](./docs/build-and-deploy.md) for detailed deployment instructions.

---

## Security & Privacy

### Security Certifications

- **SOC 2 Type II:** Certified (Q3 2026)
- **GDPR:** Compliant
- **CCPA:** Compliant
- **PIPEDA:** Compliant
- **PCI-DSS:** Ready (PCI-DSS compliant infrastructure)

### Security Features

- **Data Encryption:** Encryption at rest and in transit (AES-256)
- **Access Control:** Role-based access control (RBAC)
- **Audit Logs:** Comprehensive audit trails
- **API Security:** API key authentication, rate limiting
- **Infrastructure:** Multi-region redundancy, 99.9% uptime SLA

### Privacy

- **Data Residency:** Multi-region options (US, EU, Asia)
- **Data Retention:** Configurable retention periods (7 days to 7 years)
- **Data Deletion:** On-demand data deletion (GDPR right to be forgotten)

See [Security Documentation](./SECURITY.md) and [docs/external/product-overview.md](./docs/external/product-overview.md#compliance--security) for detailed security information.

---

## Documentation

### Quick Links

- **[API Quick Start](./docs/api-quick-start.md)** - Get started in 30 minutes
- **[API Reference](./docs/api/reference.md)** - Complete API documentation
- **[Architecture Overview](./docs/overview.md)** - System architecture
- **[Integration Recipes](./docs/integration-recipes.md)** - Common integration patterns
- **[Deployment Guide](./docs/build-and-deploy.md)** - Deployment procedures

### Documentation Structure

- **[docs/](./docs/)** - Technical documentation
  - **[docs/internal/](./docs/internal/)** - Internal business strategy (private)
  - **[docs/external/](./docs/external/)** - External product overview (public)
  - **[docs/product/](./docs/product/)** - Product documentation
  - **[docs/architecture/](./docs/architecture/)** - Architecture documentation
  - **[docs/operations/](./docs/operations/)** - Operations and DevOps

See [docs/README.md](./docs/README.md) for complete documentation index.

---

## Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm run test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Standards

- **TypeScript:** Strict mode enabled
- **Linting:** ESLint with Prettier
- **Testing:** Jest for unit tests, Playwright for E2E
- **Documentation:** JSDoc for API documentation

---

## Support

### Get Help

- **Email:** support@settler.io
- **Discord:** [discord.gg/settler](https://discord.gg/settler)
- **GitHub Issues:** [github.com/settler/settler/issues](https://github.com/settler/settler/issues)
- **Documentation:** [docs.settler.io](https://docs.settler.io)

### Resources

- **Website:** [settler.io](https://settler.io)
- **Documentation:** [docs.settler.io](https://docs.settler.io)
- **Status Page:** [status.settler.io](https://status.settler.io)
- **Blog:** [blog.settler.io](https://blog.settler.io)

---

## License

This project is licensed under a commercial license. See [LICENSE](./LICENSE) for details.

For open-source components (SDK, adapters), see individual package licenses.

---

## Status

**Current Status:** ✅ Production Ready

- ✅ Core reconciliation engine
- ✅ 10+ platform adapters (Stripe, Shopify, QuickBooks, PayPal, Square, Xero, NetSuite)
- ✅ TypeScript SDK (`@settler/sdk`)
- ✅ Web dashboard
- ✅ RESTful API
- ✅ Webhooks
- ✅ Comprehensive documentation

**Roadmap:** See [docs/internal/business-strategy.md](./docs/internal/business-strategy.md#roadmap--milestones) for product roadmap.

---

**Built with ❤️ by the Settler team**

[Website](https://settler.io) • [Documentation](https://docs.settler.io) • [Support](https://settler.io/support) • [GitHub](https://github.com/settler/settler)
