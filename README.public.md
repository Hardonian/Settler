# Settler SDK

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![npm](https://img.shields.io/npm/v/@settler/sdk)](https://www.npmjs.com/package/@settler/sdk)

**Settler SDK** is an open-source TypeScript/JavaScript SDK for building financial reconciliation workflows. Connect payment providers like Stripe, Shopify, PayPal, and QuickBooks to automatically match transactions and catch accounting errors.

This repository contains the **open-source SDK** and **protocol definitions**. The cloud-hosted reconciliation engine and managed adapters are available separately at [settler.io](https://settler.io).

## 🚀 Quick Start

### Installation

```bash
npm install @settler/sdk
# or
pnpm add @settler/sdk
# or
yarn add @settler/sdk
```

### Basic Usage

```typescript
import Settler from "@settler/sdk";

const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});

// Create your first reconciliation job
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
    ],
  },
});

console.log("Job created:", job.data.id);
```

## 📦 What's Included

### Open Source Packages

This repository contains the following MIT-licensed packages:

- **`@settler/sdk`**: TypeScript/JavaScript SDK for the Settler API
- **`@settler/protocol`**: Framework-agnostic protocol types and interfaces
- **`@settler/react-settler`**: React components for building reconciliation UIs
- **`@settler/cli`**: Command-line tool for reconciliation operations
- **`sdk-go/`**: Go SDK (coming soon)
- **`sdk-python/`**: Python SDK (coming soon)
- **`sdk-ruby/`**: Ruby SDK (coming soon)
- **`examples/`**: Code examples for common use cases

### What's Not Included (Cloud-Only)

The following are **not** part of this open-source repository and are available only through Settler Cloud:

- **Reconciliation Engine**: Event-sourced matching engine with deterministic math
- **Managed Adapters**: Pre-built connectors for 50+ payment providers
- **Receipts API**: AI-powered OCR for extracting structured data from PDFs/images
- **Developer Console**: Web dashboard for monitoring reconciliations
- **Webhook Management**: Real-time event notifications
- **Scheduled Jobs**: Automated daily/weekly reconciliations
- **Multi-Currency Support**: Automatic FX conversion
- **Enterprise Features**: SSO, audit logs, SLA guarantees

## 🎯 Use Cases

### E-Commerce Reconciliation
Match Shopify orders with Stripe payments to catch missing transactions or amount discrepancies.

```typescript
const job = await settler.jobs.create({
  name: "Daily Order Reconciliation",
  source: { adapter: "shopify", config: { /* ... */ } },
  target: { adapter: "stripe", config: { /* ... */ } },
  rules: {
    matching: [
      { field: "order_id", type: "exact" },
      { field: "amount", type: "exact", tolerance: 0.01 },
    ],
  },
  schedule: "0 2 * * *", // Daily at 2 AM
});
```

### SaaS Subscription Reconciliation
Reconcile Stripe subscriptions with QuickBooks revenue records.

```typescript
const job = await settler.jobs.create({
  name: "Monthly Subscription Reconciliation",
  source: { adapter: "stripe", config: { /* ... */ } },
  target: { adapter: "quickbooks", config: { /* ... */ } },
  rules: {
    matching: [
      { field: "subscription_id", type: "exact" },
      { field: "amount", type: "exact", tolerance: 0.01 },
    ],
  },
});
```

See the [`examples/`](examples/) directory for more use cases.

## 📖 Documentation

- **[SDK Reference](packages/sdk/README.md)**: Complete API documentation
- **[Protocol Specification](packages/protocol/README.md)**: Protocol types and interfaces
- **[React Components](packages/react-settler/README.md)**: React UI components
- **[CLI Documentation](packages/cli/README.md)**: Command-line tool guide
- **[Examples](examples/README.md)**: Code examples and best practices
- **[Contributing](CONTRIBUTING.md)**: Contribution guidelines
- **[Security](SECURITY.md)**: Security policy and reporting

## 🔐 Authentication

To use the SDK, you need an API key from Settler Cloud:

1. Sign up at [settler.io](https://settler.io)
2. Create an API key in the Developer Console
3. Set the `SETTLER_API_KEY` environment variable

```bash
export SETTLER_API_KEY="sk_live_..."
```

**Free Tier**: 100 transactions/month free. See [pricing](https://settler.io/pricing) for details.

## 🏗️ OSS vs Cloud: What's the Difference?

### Open Source SDK (This Repo)
- **MIT License**: Use, modify, and distribute freely
- **Client Libraries**: TypeScript, Go, Python, Ruby SDKs
- **Protocol Types**: Framework-agnostic type definitions
- **React Components**: UI building blocks
- **CLI Tool**: Local development and testing
- **Self-Hosted**: Implement your own reconciliation logic

### Settler Cloud (Commercial SaaS)
- **Managed Infrastructure**: No servers to maintain
- **Reconciliation Engine**: Battle-tested matching algorithms
- **Pre-Built Adapters**: 50+ payment providers out of the box
- **Real-Time Webhooks**: Instant notifications
- **Scheduled Jobs**: Automated reconciliations
- **Developer Console**: Web dashboard for monitoring
- **Enterprise Support**: SLA guarantees, SSO, audit logs

**Think of it like this:**
- **SDK (OSS)**: The tools to build reconciliation workflows
- **Cloud (Commercial)**: The engine, adapters, and infrastructure

You can use the SDK with your own reconciliation logic (self-hosted) or connect to Settler Cloud for a fully managed solution.

## 🛠️ Development

### Prerequisites
- Node.js >= 24.0.0
- pnpm >= 10.0.0

### Setup

```bash
# Clone repository
git clone https://github.com/settler/settler-sdk.git
cd settler-sdk

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Type checking
pnpm typecheck
```

### Monorepo Structure

```
settler-sdk/
├── packages/
│   ├── sdk/              # TypeScript SDK
│   ├── protocol/         # Protocol types
│   ├── react-settler/    # React components
│   └── cli/              # CLI tool
├── sdk-go/               # Go SDK
├── sdk-python/           # Python SDK
├── sdk-ruby/             # Ruby SDK
├── examples/             # Code examples
└── docs/                 # Documentation
```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for:
- Code of conduct
- Development workflow
- Pull request guidelines
- Testing requirements

## 📝 License

The SDK and protocol definitions in this repository are licensed under the **MIT License**. See [LICENSE](LICENSE) for details.

Settler Cloud and proprietary components are licensed separately. See [OSS_SCOPE.md](OSS_SCOPE.md) for the complete product boundary definition.

## 🆘 Support

- **Documentation**: [docs.settler.io](https://docs.settler.io)
- **GitHub Issues**: [github.com/settler/settler-sdk/issues](https://github.com/settler/settler-sdk/issues)
- **Community Forum**: [community.settler.io](https://community.settler.io)
- **Email**: support@settler.io (Cloud customers only)

## 🎉 Roadmap

- [x] TypeScript SDK
- [x] Protocol types
- [x] React components
- [x] CLI tool
- [ ] Go SDK (in progress)
- [ ] Python SDK (in progress)
- [ ] Ruby SDK (planned)
- [ ] Java SDK (planned)
- [ ] PHP SDK (planned)

## 📊 Monetization Model

**Open Source SDKs**: Free forever, MIT licensed

**Settler Cloud** (Commercial SaaS):
- **Free**: 100 transactions/month
- **Starter**: $29/month + $0.01/transaction (1,000 included)
- **Growth**: $99/month + $0.01/transaction (10,000 included)
- **Enterprise**: Custom pricing with volume discounts

For full pricing details, see [settler.io/pricing](https://settler.io/pricing).

---

**Built with ❤️ by the Settler team**
