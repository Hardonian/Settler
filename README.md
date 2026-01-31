# Settler (OSS-first)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)

**Settler** is an OSS-first reconciliation engine that surfaces discrepancies from local or hosted data sources. Enterprise offerings are optional hosting and support layers that do not change core reconciliation logic.

Settler does not provide compliance or correctness guarantees. It deterministically surfaces discrepancies so operators can review and act.

**Pricing:** 
- **Free:** 100 transactions/month free, then $0.01 per transaction
- **Starter:** $29/month + $0.01 per transaction over 1,000 included
- **Growth:** $99/month + $0.01 per transaction over 10,000 included
- **Enterprise:** Custom pricing with volume discounts

See [config/pricing-simple.ts](config/pricing-simple.ts) for complete pricing details.

## 🚀 Quick Start

### Prerequisites

- Node.js >= 24.0.0
- PostgreSQL (via Supabase)
- Redis (via Upstash, optional)

### Installation

```bash
# Clone repository
git clone https://github.com/your-org/settler-enterprise.git
cd settler-enterprise

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
export DATABASE_URL="your-connection-string"
npx tsx scripts/run-migrations-remote.ts

# Start development server
cd packages/web
pnpm dev
```

## 📖 Documentation

### Getting Started
- [Quick Start Guide](docs/QUICK_START.md)
- [Environment Setup](ENV_SETUP_GUIDE.md)
- [Remote Database Setup](REMOTE_SETUP_GUIDE.md)

### Developer Console
- [Console Documentation](docs/CONSOLE.md)
- [API Documentation](docs/API.md)
- [Authentication Guide](docs/AUTH.md)

### Architecture
- [Architecture Overview](docs/architecture.md)
- [Database Schema](docs/database-schema.md)
- [API Reference](docs/API_REFERENCE.md)

### Operations
- [Deployment Guide](DEPLOYMENT_CHECKLIST.md)
- [Monitoring & Alerts](docs/monitoring.md)
- [Troubleshooting](docs/troubleshooting.md)
- [Backend Contract Verification](docs/backend-contract-verification.md)

## 🎯 Core Features

### Reconciliation Engine
Event-sourced matching engine for high-volume transaction processing with deterministic math.

### Receipts API
AI-powered OCR to extract structured JSON from PDFs and images.

### Feature Flags
Edge-compatible flags designed for financial rollouts.

### Developer Console
Real-time visibility into your financial data flows with:
- API call logging and analytics
- Usage monitoring and metrics
- Receipt browser and management
- Feature flag management
- Tenant observability (super admin)

## 🏗️ Architecture

Settler Enterprise follows a **Hexagonal Architecture** (Ports & Adapters) pattern with **CQRS** and **Event-Driven** principles:

- **Domain Layer**: Core business logic, independent of infrastructure
- **Application Layer**: Orchestrates domain objects to fulfill use cases
- **Infrastructure Layer**: Database, caching, external service adapters
- **Presentation Layer**: HTTP API routes and middleware

Built with TypeScript, Next.js, PostgreSQL (via Supabase), and Redis (via Upstash).

## 📦 Platform Components

This monorepo contains:

- **`packages/web`**: Next.js web application and Developer Console
- **`packages/api`**: Core Node.js API server
- **`packages/cli`**: Command-line tool
- **`packages/react-settler`**: React components
- **`packages/adapters`**: Service adapter implementations
- **`packages/jobforge-*`**: JobForge job queue system (see below)

## 🔄 Background Job Processing (JobForge)

Settler now includes **JobForge**, a production-grade, Postgres-native job queue for background processing:

- **Contract Processing**: Async validation, parsing, and enrichment
- **Notifications**: Email and webhook delivery with retries
- **Data Ingestion**: Bulk reconciliation data imports
- **Audit Jobs**: Compliance checks and reporting

**Key Features:**
- Multi-tenant isolation via Row Level Security (RLS)
- Automatic retries with exponential backoff
- Idempotent job enqueuing (no duplicates)
- Dead-letter queue for failed jobs
- Horizontal worker scaling with `FOR UPDATE SKIP LOCKED`

**Quick Start:**

```typescript
import { JobForgeClient } from '@jobforge/sdk-ts'
import { SettlerJobTypes } from '@jobforge/adapter-settler'

const jobforge = new JobForgeClient({
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
})

// Enqueue a contract processing job
await jobforge.enqueueJob({
  tenant_id: user.tenantId,
  type: SettlerJobTypes.CONTRACT_PROCESS,
  payload: { contractId: 'abc-123' },
  idempotency_key: `contract-abc-123-process`,
})
```

**Documentation:** [docs/jobforge-integration.md](docs/jobforge-integration.md)

## 🔐 Security

- **Authentication**: Required for all console routes
- **Authorization**: Subscription-based access control
- **Tenant Isolation**: RLS policies enforce boundaries
- **PII Protection**: Automatic data sanitization
- **Rate Limiting**: Protection against abuse

## 📊 Monitoring

- **Health Checks**: `/api/console/health`
- **API Logging**: Automatic logging with PII sanitization
- **Alerting**: Automated alerts for anomalies
- **Performance Tracking**: Response time and error rate monitoring

## 🧪 Testing

```bash
# Run all tests
export DATABASE_URL="your-connection-string"
./scripts/run-all-tests.sh

# Run specific tests
npx tsx scripts/test-setup.ts
npx tsx scripts/integration-test.ts
```

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for detailed changelog.

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

## 📄 License

Proprietary - See [LICENSE](LICENSE) for details.

## 👨‍💼 Solo Operator Runbook

This repository includes comprehensive operational tooling designed for solo operators running a SaaS business. All commands are production-ready and safe to run in CI/CD.

### Daily Ops Commands

```bash
# Generate daily founder report (growth, activation, revenue, billing health)
npm run ops:daily

# Generate weekly founder report (week-over-week trends, recommendations)
npm run ops:weekly

# Run comprehensive health check (lint, typecheck, routes, SLA, migrations)
npm run ops:doctor

# Generate billing evidence pack for a tenant (for support/debugging)
npm run ops:billing:evidence --tenant <tenant-id>

# Generate procurement pack for B2B sales (Terms, Privacy, DPA, Security)
npm run ops:procurement:pack

# Run smoke tests (key routes, webhooks, DB connectivity)
npm run qa:smoke

# Run comprehensive code quality audit (security, performance, error handling)
npm run ops:audit
```

### Automated Reports

Reports are automatically generated via GitHub Actions:
- **Daily Reports**: Generated at 07:40 and 16:40 America/Toronto
- **Weekly Reports**: Generated every Monday at 07:40 America/Toronto
- **Artifacts**: All reports are uploaded as GitHub Actions artifacts

Reports include:
- Growth metrics (signups, activations, MRR)
- Activation funnel (signup → tenant → provider → first recon)
- Usage metrics (reconciliation runs, transactions processed)
- Revenue metrics (MRR, ARR, churn, LTV)
- Billing health (active subscriptions, payment failures, dunning)
- Risk indicators (error rates, SLA violations)
- Support metrics (open tickets, response times)
- Cost proxies (API calls, database queries)

### Daily Workflow

1. **Morning (07:40 ET)**: Review daily report from GitHub Actions
2. **Check Health**: Run `npm run ops:doctor` to verify system health
3. **Monitor Activation**: Check `/console/admin/activation` for funnel metrics
4. **Review Billing**: Check for past_due subscriptions and failed payments

### Weekly Workflow

1. **Monday Morning**: Review weekly report from GitHub Actions
2. **Procurement Requests**: Generate procurement packs as needed
3. **Billing Incidents**: Use `ops:billing:evidence` to gather evidence
4. **Health Audit**: Run full `ops:doctor` check

### On-Call in 10 Minutes

1. **Check Status**: Visit `/status` for public status, `/api/admin/health` for detailed metrics
2. **Review Alerts**: Check error spikes, webhook failures, reconciliation issues
3. **Billing Issues**: Use `ops:billing:evidence` to gather tenant billing data
4. **Quick Fixes**: 
   - Webhook failures: Check StripeEvent table for failed events
   - Reconciliation errors: Review ReconResult table for failed runs
   - Database issues: Run `npm run prisma:status` to check migrations

### Key Endpoints

- **Public Status**: `/status` - System status for customers
- **Admin Health**: `/api/admin/health` - Detailed internal health metrics
- **Activation Funnel**: `/console/admin/activation` - Product-led growth metrics
- **Billing Portal**: `/console/billing` - Customer billing management

### Reports Location

All reports are saved to `ops/reports/`:
- `FOUNDERS_DAILY_REPORT.md` - Daily operational metrics
- `FOUNDERS_WEEKLY_REPORT.md` - Weekly aggregated metrics
- `DOCTOR_SUMMARY.md` - Health check results
- `ops/packs/billing-evidence/` - Billing incident evidence packs
- `ops/packs/procurement/` - B2B sales procurement packs

## 🆘 Support

- **Documentation**: [docs/](docs/)
- **Console**: [Developer Console](/console)
- **Issues**: Contact support via console

## Deterministic verification

Settler includes a Rust reconciliation kernel and verifier that provide deterministic outputs and local verification. These components surface discrepancies between normalized inputs and outputs; they do not make compliance or correctness guarantees. Verification is optional and runs client-side when the wasm verifier is available.

- Kernel docs: [docs/kernel/DETERMINISM.md](docs/kernel/DETERMINISM.md)
- Verifier quickstart: [docs/verify/QUICKSTART.md](docs/verify/QUICKSTART.md)

## 🎉 Release v1.0.0

**First Official Release** - December 21, 2024

### What's New
- ✅ API call logging system
- ✅ Tenant observability dashboard
- ✅ Enhanced security and performance
- ✅ Comprehensive monitoring
- ✅ Production-ready infrastructure

See [RELEASE_NOTES.md](RELEASE_NOTES.md) for complete release notes.

---

**Settler Enterprise** - Financial Reconciliation as a Service
