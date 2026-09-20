# @settler/react-settler

**Enterprise-grade React components for building reconciliation workflows declaratively.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)

React.Settler is the **best-in-show** open-source protocol for reconciliation workflows. Built with enterprise-grade security, performance optimizations, and developer experience in mind.

## Why React.Settler?

✅ **Enterprise Security** - Built-in XSS protection, input validation, audit logging  
✅ **High Performance** - Virtualized tables, memoization, optimized rendering  
✅ **Developer Friendly** - TypeScript-first, comprehensive hooks, testing utilities  
✅ **Non-Intrusive** - Works everywhere, no vendor lock-in, backend agnostic  
✅ **Production Ready** - Error boundaries, telemetry, comprehensive documentation  
✅ **Free to Start** - OSS tier includes everything you need to get started

## Pricing

- 🆓 **OSS (Free)** - Core protocol, basic components, security basics, mobile & accessibility
- 💼 **Commercial ($99/month)** - Platform integrations (Shopify, Stripe, MCP), virtualization, telemetry, audit logging
- 🏢 **Enterprise (Custom)** - SSO, RBAC, white-label, dedicated support

[View Pricing Details →](./docs/PRICING.md) | [Compare Tiers →](./docs/OSS_VS_COMMERCIAL.md)

## Installation

```bash
npm install @settler/react-settler @settler/protocol
```

## Quick Start

### OSS Tier (Free)

```tsx
import {
  ReconciliationDashboard,
  TransactionTable,
  ExceptionTable,
  MetricCard,
} from "@settler/react-settler";

function MyDashboard() {
  const transactions = [/* your data */];

  return (
    <ReconciliationDashboard>
      <MetricCard title="Transactions" value={transactions.length} />
      <TransactionTable transactions={transactions} />
    </ReconciliationDashboard>
  );
}
```

### Commercial Tier ($99/month)

```tsx
import { setLicense, FEATURE_FLAGS } from "@settler/react-settler";

// Set commercial license
setLicense({
  tier: "commercial",
  features: new Set([
    FEATURE_FLAGS.SHOPIFY_INTEGRATION,
    FEATURE_FLAGS.VIRTUALIZATION,
    // ... other commercial features
  ]),
});

// Now use commercial features
import { ShopifyApp, VirtualizedTable } from "@settler/react-settler";

<ShopifyApp shop="myshop.myshopify.com" transactions={transactions} />;
```

[Get Commercial License →](https://settler.dev/pricing)

## Feature Comparison

| Feature             | OSS | Commercial | Enterprise |
| ------------------- | --- | ---------- | ---------- |
| Core Protocol       | ✅  | ✅         | ✅         |
| Basic Components    | ✅  | ✅         | ✅         |
| Config Compiler     | ✅  | ✅         | ✅         |
| Validation          | ✅  | ✅         | ✅         |
| Security Basics     | ✅  | ✅         | ✅         |
| Mobile Support      | ✅  | ✅         | ✅         |
| Accessibility       | ✅  | ✅         | ✅         |
| MCP Integration     | ❌  | ✅         | ✅         |
| Shopify Integration | ❌  | ✅         | ✅         |
| Stripe Integration  | ❌  | ✅         | ✅         |
| Webhook Manager     | ❌  | ✅         | ✅         |
| Virtualized Tables  | ❌  | ✅         | ✅         |
| Telemetry           | ❌  | ✅         | ✅         |
| Audit Logging       | ❌  | ✅         | ✅         |
| SSO                 | ❌  | ❌         | ✅         |
| RBAC                | ❌  | ❌         | ✅         |
| White Label         | ❌  | ❌         | ✅         |

## Documentation

- [Pricing & Licensing](./docs/PRICING.md) - Feature tiers and pricing
- [OSS vs Commercial](./docs/OSS_VS_COMMERCIAL.md) - Strategic feature split
- [Security Guide](./docs/SECURITY.md) - Security best practices
- [Performance Guide](./docs/PERFORMANCE.md) - Performance optimization
- [Testing Guide](./docs/TESTING.md) - Testing utilities and patterns
- [Integrations Guide](./docs/INTEGRATIONS.md) - Platform integrations
- [Accessibility Guide](./docs/ACCESSIBILITY.md) - Accessibility features
- [Protocol Specification](../protocol/PROTOCOL.md) - Complete protocol docs

## License

- **OSS Components:** MIT License (Free Forever)
- **Commercial Features:** Commercial License (Requires Subscription)

See [LICENSE](./LICENSE) for OSS license and [Commercial License](../../LEGAL/COMMERCIAL_LICENSE.md) for commercial terms.

## Support

- **OSS:** Community support (GitHub, Discord)
- **Commercial:** Email support (48-hour response)
- **Enterprise:** Dedicated support (24/7)

## Links

- **Website:** https://settler.dev
- **Documentation:** https://docs.settler.dev/react-settler
- **Pricing:** https://settler.dev/pricing
- **GitHub:** https://github.com/settler/react-settler
- **Discord:** https://discord.gg/settler

---

**Made with ❤️ for developers who hate manual reconciliation.**
