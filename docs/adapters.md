# Adapters Guide

Adapters are the bridge between Settler and external platforms (Stripe, Shopify, QuickBooks, etc.).

## Built-in Adapters

### Stripe

Reconcile Stripe payments and charges.

**Configuration:**

```typescript
{
  adapter: "stripe",
  config: {
    apiKey: "sk_live_...", // Stripe secret key
    webhookSecret: "whsec_..." // Optional, for webhook verification
  }
}
```

**Supported Events:**
- `payment.succeeded`
- `charge.refunded`
- `payment_intent.succeeded`

### Shopify

Reconcile Shopify orders and transactions.

**Configuration:**

```typescript
{
  adapter: "shopify",
  config: {
    apiKey: "your_shopify_api_key",
    shopDomain: "your-shop.myshopify.com",
    webhookSecret: "..." // Optional
  }
}
```

**Supported Events:**
- `order.created`
- `order.updated`
- `transaction.created`

### QuickBooks

Reconcile QuickBooks transactions.

**Configuration:**

```typescript
{
  adapter: "quickbooks",
  config: {
    clientId: "your_client_id",
    clientSecret: "your_client_secret",
    realmId: "your_realm_id",
    sandbox: true // Optional, defaults to false
  }
}
```

### PayPal

Reconcile PayPal transactions.

**Configuration:**

```typescript
{
  adapter: "paypal",
  config: {
    clientId: "your_client_id",
    clientSecret: "your_client_secret",
    sandbox: true // Optional, defaults to false
  }
}
```

## Creating Custom Adapters

### Adapter Interface

```typescript
import { Adapter, NormalizedData, FetchOptions, ValidationResult } from "@settler/adapters";

export class MyCustomAdapter implements Adapter {
  name = "my-custom-platform";
  version = "1.0.0";

  async fetch(options: FetchOptions): Promise<NormalizedData[]> {
    // Fetch data from your platform
    const { dateRange, config } = options;
    // ... fetch logic
    return normalizedData;
  }

  normalize(data: unknown): NormalizedData {
    // Convert platform-specific format to Settler's normalized format
    return {
      id: data.id,
      amount: data.amount,
      currency: data.currency,
      date: new Date(data.created_at),
      metadata: { ... },
      sourceId: data.id,
      referenceId: data.reference,
    };
  }

  validate(data: NormalizedData): ValidationResult {
    const errors: string[] = [];
    // Validation logic
    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}
```

### Normalized Data Format

All adapters must return data in this format:

```typescript
interface NormalizedData {
  id: string;                    // Unique identifier
  amount: number;                 // Transaction amount
  currency: string;                // ISO currency code (USD, EUR, etc.)
  date: Date;                     // Transaction date
  metadata: Record<string, unknown>; // Additional platform-specific data
  sourceId?: string;              // Original platform ID
  referenceId?: string;           // Reference number (order ID, invoice, etc.)
}
```

### Example: Custom CSV Adapter

```typescript
import { Adapter, NormalizedData, FetchOptions } from "@settler/adapters";
import * as fs from "fs";
import * as csv from "csv-parse/sync";

export class CSVAdapter implements Adapter {
  name = "csv";
  version = "1.0.0";

  async fetch(options: FetchOptions): Promise<NormalizedData[]> {
    const { config } = options;
    const filePath = config.filePath as string;
    
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const records = csv.parse(fileContent, { columns: true });
    
    return records.map((record: any) => this.normalize(record));
  }

  normalize(data: any): NormalizedData {
    return {
      id: data.id || data.transaction_id,
      amount: parseFloat(data.amount),
      currency: data.currency || "USD",
      date: new Date(data.date),
      metadata: data,
      sourceId: data.id,
      referenceId: data.reference,
    };
  }

  validate(data: NormalizedData): ValidationResult {
    const errors: string[] = [];
    if (!data.id) errors.push("ID is required");
    if (!data.amount || data.amount <= 0) errors.push("Valid amount is required");
    return { valid: errors.length === 0, errors };
  }
}
```

## Registering Adapters

### In Your Application

```typescript
import { SettlerClient } from "@settler/sdk";
import { MyCustomAdapter } from "./adapters/my-custom";

// Register adapter (in production, this would be done via API)
const client = new SettlerClient({
  apiKey: "sk_your_key",
});

// Use custom adapter in job creation
const job = await client.jobs.create({
  name: "Custom Platform Reconciliation",
  source: {
    adapter: "my-custom-platform",
    config: { apiKey: "..." },
  },
  target: {
    adapter: "stripe",
    config: { apiKey: "..." },
  },
  rules: { matching: [...] },
});
```

## Best Practices

1. **Idempotency**: Ensure `fetch()` can be called multiple times safely
2. **Error Handling**: Handle rate limits, timeouts, and API errors gracefully
3. **Pagination**: Support pagination for large datasets
4. **Caching**: Cache adapter configs and metadata when possible
5. **Validation**: Always validate normalized data before returning
6. **Logging**: Log adapter operations for debugging

## Testing Adapters

```typescript
import { MyCustomAdapter } from "./my-custom-adapter";

describe("MyCustomAdapter", () => {
  const adapter = new MyCustomAdapter();

  it("should normalize data correctly", () => {
    const rawData = { id: "123", amount: "99.99", currency: "USD" };
    const normalized = adapter.normalize(rawData);
    
    expect(normalized.id).toBe("123");
    expect(normalized.amount).toBe(99.99);
    expect(normalized.currency).toBe("USD");
  });

  it("should validate data", () => {
    const data = { id: "123", amount: 99.99, currency: "USD", date: new Date() };
    const result = adapter.validate(data);
    expect(result.valid).toBe(true);
  });
});
```

## Contributing Adapters

We welcome community-contributed adapters! See [CONTRIBUTING.md](./contributing.md) for guidelines.
