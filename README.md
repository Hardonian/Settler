# Settler Enterprise

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)

**Settler** automates financial reconciliation at $0.01 per transaction. Connect Stripe, Shopify, and other payment systems to automatically match transactions and catch accounting errors.

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

## 🆘 Support

- **Documentation**: [docs/](docs/)
- **Console**: [Developer Console](/console)
- **Issues**: Contact support via console

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
