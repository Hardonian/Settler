# Settler - The Financial Truth Layer

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Status](https://img.shields.io/badge/Status-Beta-orange.svg)](https://settler.dev)

Settler is an open-source API infrastructure for financial reconciliation, receipt parsing, and deterministic compliance. It provides engineering teams with the primitives to build reliable financial software without reinventing the wheel.

## 🚀 Features

- **Reconciliation Engine**: Event-sourced matching engine for high-volume transaction processing.
- **Receipts API**: AI-powered OCR to extract structured JSON from PDFs and images.
- **Feature Flags**: Edge-compatible flags designed for financial rollouts (entitlements, percentage-based).
- **Deterministic Math**: Unit and currency conversion libraries that avoid floating-point errors.
- **Developer Console**: Real-time visibility into your financial data flows.

## 📦 Packages

This monorepo contains the following packages:

- `packages/api`: The core Node.js API server (Express/Postgres/Redis).
- `packages/web`: The Next.js marketing site, documentation, and developer console.
- `packages/sdk`: The official Node.js/TypeScript SDK.
- `packages/sdk-python`: The official Python SDK.
- `packages/sdk-go`: The official Go SDK.
- `packages/cli`: The `settler` command-line tool.

## 🛠️ Quick Start

### Self-Hosting (Docker)

You can run the full stack locally using Docker Compose:

```bash
cd enterprise
docker-compose up -d
```

See [Self-Hosting Guide](enterprise/SELF_HOSTING.md) for details.

### Local Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment**:
   Copy `.env.example` to `.env` in `packages/api` and `packages/web` and fill in the required secrets.

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

## 📚 Documentation

Full documentation is available at [settler.dev/docs](https://settler.dev/docs).

## 🔒 Security

Settler is designed for SOC 2 and ISO 27001 compliance.
- All data at rest is encrypted (AES-256).
- Audit logs are immutable.
- See [SECURITY.md](SECURITY.md) for reporting vulnerabilities.

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
