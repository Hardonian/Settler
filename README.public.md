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

## Packages

This repository contains the following open-source packages:

- `packages/sdk` - Official Node.js/TypeScript SDK
- `packages/sdk-python` - Official Python SDK
- `packages/sdk-go` - Official Go SDK
- `packages/sdk-ruby` - Official Ruby SDK
- `packages/api-client` - REST API client library
- `packages/protocol` - Framework-agnostic protocol types
- `packages/react-settler` - React components for integration
- `packages/cli` - Command-line tool

## Quick Start

### Install SDK

```bash
npm install @settler/sdk
```

### Basic Usage

```typescript
import { SettlerClient } from '@settler/sdk';

const client = new SettlerClient({
  apiKey: process.env.SETTLER_API_KEY,
});

// Create a reconciliation job
const job = await client.jobs.create({
  source: 'stripe',
  destination: 'quickbooks',
  transactions: [...],
});
```

## Documentation

- [API Reference](docs/public/api-reference.md)
- [Quick Start Guide](docs/public/quickstart.md)
- [Examples](examples/)

## Pricing

Settler offers a free tier for development and testing. For production usage, see [pricing](https://settler.dev/pricing).

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Security

For security vulnerabilities, please see [SECURITY.md](SECURITY.md).

## License

MIT License - see [LICENSE](LICENSE) for details.

## Links

- **Website**: https://settler.dev
- **Documentation**: https://settler.dev/docs
- **Status**: https://settler.dev/status
- **Support**: https://settler.dev/support
