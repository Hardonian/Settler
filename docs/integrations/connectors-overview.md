# Connectors Overview

Settler's integration framework supports connecting to 20+ platforms across multiple categories:

## Categories

### Bank Feeds
- **Plaid** - North America bank aggregation
- **TrueLayer** - EU/UK bank aggregation (PSD2)

### Accounting Systems
- **FreshBooks** - Small business accounting
- **Wave** - Free accounting software

### Subscription Billing
- **Chargebee** - Subscription management platform
- **Recurly** - Recurring billing platform

### Payment Processors
- **Stripe** - Payment processing
- **PayPal** - Payment processing
- **Square** - Payment processing

### E-commerce Platforms
- **Shopify** - E-commerce platform
- **WooCommerce** - WordPress e-commerce
- **BigCommerce** - E-commerce platform

## Architecture

### Connector Interface

All connectors implement the `ConnectorDriver` interface:

```typescript
interface ConnectorDriver {
  readonly metadata: ConnectorMetadata;
  getAuthUrl?(options: AuthUrlOptions): Promise<string>;
  handleCallback?(code: string, state: string, options: AuthUrlOptions): Promise<AuthCallbackResult>;
  refreshToken?(refreshToken: string, config?: Record<string, unknown>): Promise<AuthCallbackResult>;
  revoke?(accessToken: string, config?: Record<string, unknown>): Promise<void>;
  testConnection(options: TestConnectionOptions): Promise<TestConnectionResult>;
  sync(credentials: Record<string, unknown>, options: SyncOptions): Promise<SyncResult>;
  handleWebhook?(payload: WebhookPayload, credentials: Record<string, unknown>): Promise<...>;
}
```

### Data Flow

1. **Connection**: User initiates connection via UI
2. **Authentication**: OAuth2 flow or API key entry
3. **Credential Storage**: Encrypted storage in `connector_credentials` table
4. **Sync**: Background jobs sync data periodically
5. **Normalization**: Data normalized to canonical schema
6. **Storage**: Stored in `financial_transactions`, `financial_balances`, etc.

## Database Schema

### Core Tables

- `connectors` - Connector instances per tenant
- `connector_credentials` - Encrypted credentials
- `connector_accounts` - External accounts/institutions
- `sync_runs` - Sync execution tracking
- `sync_cursors` - Pagination cursors
- `financial_transactions` - Canonical transactions
- `financial_balances` - Account balances
- `financial_payouts` - Payouts
- `financial_invoices` - Invoices
- `financial_subscriptions` - Subscriptions
- `financial_tax_estimates` - Tax estimates
- `raw_events` - Raw payloads for audit
- `webhook_events` - Webhook events

## Security

- **RLS Policies**: All tables have Row Level Security enabled
- **Credential Encryption**: Credentials encrypted at rest
- **Tenant Isolation**: Strict tenant isolation enforced
- **Webhook Verification**: Signature verification for webhooks

## Sync Process

1. Scheduler triggers sync for active connectors
2. Runtime fetches credentials (decrypted)
3. Driver executes sync with provider API
4. Data normalized to canonical format
5. Saved to database with idempotency keys
6. Sync run updated with metrics

## Error Handling

- **Retry Logic**: Exponential backoff with jitter
- **Concurrency Protection**: One sync per connector at a time
- **Auto-disable**: Connectors auto-disabled after 10 consecutive failures
- **Error Logging**: All errors logged to `sync_runs` table
