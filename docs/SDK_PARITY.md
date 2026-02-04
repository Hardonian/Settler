# SDK Parity Documentation

## Overview

This document tracks feature parity across Settler SDKs for different programming languages.

**Last Updated:** 2026-02-03

## SDK Coverage Matrix

| Feature                  | TypeScript | Go  | Python |
| ------------------------ | ---------- | --- | ------ |
| **Core Clients**         |            |     |        |
| Jobs (reconciliation)    | ✅         | ✅  | ✅     |
| Reports                  | ✅         | ✅  | ✅     |
| Webhooks (receive)       | ✅         | ✅  | ✅     |
| Webhooks (management)    | ✅         | ⚠️  | ⚠️     |
| Transactions             | ✅         | ✅  | ✅     |
| Settlements              | ✅         | ✅  | ✅     |
| Fees                     | ✅         | ✅  | ✅     |
| Exports                  | ✅         | ✅  | ✅     |
| Currency/FX              | ✅         | ✅  | ✅     |
| Adapters                 | ✅         | ❌  | ❌     |
| Receipts                 | ✅         | ❌  | ❌     |
| Feature Flags            | ✅         | ❌  | ❌     |
| Convert                  | ✅         | ❌  | ❌     |
| Console                  | ✅         | ❌  | ❌     |
| **Utilities**            |            |     |        |
| Retry Logic              | ✅         | ✅  | ✅     |
| Request Deduplication    | ✅         | ✅  | ✅     |
| Pagination Helpers       | ✅         | ❌  | ❌     |
| Middleware Chain         | ✅         | ❌  | ❌     |
| Token Refresh            | ✅         | ❌  | ❌     |
| Error Handling           | ✅         | ✅  | ✅     |
| Webhook Signature Verify | ✅         | ❌  | ❌     |

## Legend

- ✅ **Complete** - Feature fully implemented
- ⚠️ **Partial** - Basic implementation, needs enhancement
- ❌ **Missing** - Not yet implemented

## SDK-Specific Notes

### TypeScript SDK (`packages/sdk`)

**Status:** Reference implementation, most complete

**Key Features:**

- Full TypeScript types with generics
- Middleware chain for request/response modification
- Token refresh for JWT authentication
- Webhook signature verification utilities
- Comprehensive pagination helpers

**TODO:** None critical

### Go SDK (`packages/sdk-go`)

**Status:** Production-ready, limited scope

**Implemented:**

- Core reconciliation clients (jobs, reports)
- Webhook receiving
- Transactions, settlements, fees, exports, currency
- Error types

**Missing:**

- Webhook management (create/list/delete)
- Console client (API keys, usage)
- Feature flags
- Receipts
- Convert
- Adapters
- Pagination helpers
- Webhook signature verification

**Priority Additions:**

1. Webhook management client
2. Webhook signature verification
3. Console client for API key management

### Python SDK (`packages/sdk-python`)

**Status:** Basic implementation, needs expansion

**Implemented:**

- Core reconciliation clients
- Transactions, settlements, fees, exports, currency
- Webhook receiving
- Error handling
- Retry logic with urllib3

**Missing:**

- Webhook management (create/list/delete webhooks)
- Console client
- Feature flags
- Receipts
- Convert
- Adapters
- Webhook signature verification
- Pagination helpers

**Priority Additions:**

1. Webhook management client
2. Webhook signature verification
3. Console client

## Feature Definitions

### Core Clients

| Client                | Description                                      |
| --------------------- | ------------------------------------------------ |
| Jobs                  | Create, run, and manage reconciliation jobs      |
| Reports               | Fetch reconciliation results and summaries       |
| Webhooks (receive)    | Process incoming webhooks from payment providers |
| Webhooks (management) | Create, list, delete webhook subscriptions       |
| Transactions          | Query transaction data                           |
| Settlements           | Query settlement data                            |
| Fees                  | Query fees and calculate effective rates         |
| Exports               | Create data exports in various formats           |
| Currency              | Convert amounts, get FX rates                    |
| Adapters              | List and configure data source adapters          |
| Receipts              | Upload and process receipt images/PDFs           |
| Feature Flags         | Check feature flags for tenant                   |
| Convert               | Currency conversion utilities                    |
| Console               | API key management, usage stats                  |

### Utilities

| Utility                  | Description                                 |
| ------------------------ | ------------------------------------------- |
| Retry Logic              | Exponential backoff for failed requests     |
| Request Deduplication    | Prevent duplicate API calls                 |
| Pagination Helpers       | Iterator/collection for paginated responses |
| Middleware Chain         | Composable request/response processing      |
| Token Refresh            | Automatic JWT token refresh                 |
| Error Handling           | Typed errors for different failure modes    |
| Webhook Signature Verify | HMAC signature validation for webhooks      |

## Adding Features to SDKs

When adding a new feature:

1. **Add to TypeScript SDK first** (reference implementation)
2. **Update this documentation** with the new feature
3. **Create issues** for Go and Python SDK parity
4. **Follow existing patterns** in each SDK
5. **Test thoroughly** before marking as complete

## Version Compatibility

All SDKs should target the same API version. Current target: **API v1**

## Contributing

When contributing SDK features:

1. Check this matrix for parity requirements
2. Update the matrix when features are added
3. Follow language-specific conventions in each SDK
4. Include tests for new features
5. Update SDK README with examples

## Roadmap

### Q1 2026

- [ ] Go SDK: Add webhook management
- [ ] Go SDK: Add webhook signature verification
- [ ] Python SDK: Add webhook management
- [ ] Python SDK: Add console client

### Q2 2026

- [ ] Go SDK: Add feature flags
- [ ] Python SDK: Add feature flags
- [ ] All SDKs: Enhanced pagination helpers
