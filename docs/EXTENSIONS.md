# Extensions Documentation

Guide for building third-party connectors for Settler.

## Overview

Settler's extension model allows external developers to build connectors for payment processors, e-commerce platforms, and accounting systems without reading internal code.

## Connector Interface

All connectors must implement the `Connector` interface:

```typescript
import { Connector, NormalizedData, FetchOptions, ValidationResult } from '@settler/adapters';

class MyConnector implements Connector {
  readonly name = 'my-connector';
  readonly version = '1.0.0';
  
  async fetch(options: FetchOptions): Promise<NormalizedData[]> {
    // Fetch data from external system
  }
  
  normalize(data: unknown): NormalizedData {
    // Normalize to Settler format
  }
  
  validate(data: NormalizedData): ValidationResult {
    // Validate normalized data
  }
}
```

## Data Model

### NormalizedData

All connectors must normalize data to this format:

```typescript
interface NormalizedData {
  id: string;              // Unique transaction ID
  amount: number;          // Transaction amount (positive)
  currency: string;        // ISO 4217 currency code (e.g., 'USD')
  date: Date;              // Transaction date
  metadata: Record<string, unknown>;  // Additional data
  sourceId?: string;       // Source system ID
  referenceId?: string;    // Reference number (e.g., order ID)
}
```

### Required Fields

- `id` - Must be unique within the source system
- `amount` - Must be positive number
- `currency` - Must be valid ISO 4217 code
- `date` - Must be valid Date object
- `metadata` - Object (can be empty)

### Optional Fields

- `sourceId` - Original ID from source system
- `referenceId` - External reference (order ID, invoice number, etc.)

## Implementation Guide

### Step 1: Create Connector Class

```typescript
import { Connector, NormalizedData, FetchOptions, ValidationResult } from '@settler/adapters';

export class StripeConnector implements Connector {
  readonly name = 'stripe';
  readonly version = '1.0.0';
  
  async fetch(options: FetchOptions): Promise<NormalizedData[]> {
    const { dateRange, config } = options;
    const apiKey = config.apiKey as string;
    
    // Fetch from Stripe API
    const response = await fetch(
      `https://api.stripe.com/v1/charges?created[gte]=${dateRange.start.getTime()}&created[lte]=${dateRange.end.getTime()}`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
      }
    );
    
    const data = await response.json();
    return data.data.map((charge: unknown) => this.normalize(charge));
  }
  
  normalize(data: unknown): NormalizedData {
    const charge = data as {
      id: string;
      amount: number;
      currency: string;
      created: number;
      metadata?: Record<string, unknown>;
    };
    
    return {
      id: charge.id,
      amount: charge.amount / 100, // Convert cents to dollars
      currency: charge.currency.toUpperCase(),
      date: new Date(charge.created * 1000),
      metadata: charge.metadata || {},
      sourceId: charge.id,
    };
  }
  
  validate(data: NormalizedData): ValidationResult {
    const errors: string[] = [];
    
    if (!data.id || typeof data.id !== 'string') {
      errors.push('id must be a non-empty string');
    }
    
    if (typeof data.amount !== 'number' || data.amount <= 0) {
      errors.push('amount must be a positive number');
    }
    
    if (!data.currency || typeof data.currency !== 'string') {
      errors.push('currency must be a non-empty string');
    }
    
    if (!(data.date instanceof Date) || isNaN(data.date.getTime())) {
      errors.push('date must be a valid Date');
    }
    
    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}
```

### Step 2: Validate Your Connector

```typescript
import { validateConnector } from '@settler/adapters';

const connector = new StripeConnector();
const validation = validateConnector(connector);

if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
}
```

### Step 3: Register Your Connector

```typescript
import { registerConnector } from '@settler/adapters';

registerConnector({
  name: 'stripe',
  version: '1.0.0',
  connector: new StripeConnector(),
  metadata: {
    name: 'stripe',
    version: '1.0.0',
    displayName: 'Stripe',
    description: 'Stripe payment processor connector',
    category: 'payment',
    supportsWebhooks: true,
    requiredConfig: ['apiKey'],
    optionalConfig: ['webhookSecret'],
  },
});
```

## Validation Rules

### Required Methods

- `name` - Connector identifier
- `version` - Version string
- `fetch()` - Fetch data from external system
- `normalize()` - Normalize data to Settler format
- `validate()` - Validate normalized data

### Data Validation

Your `validate()` method must check:

1. **Required fields** - `id`, `amount`, `currency`, `date`, `metadata`
2. **Field types** - Correct types for each field
3. **Constraints** - Amount > 0, valid currency code, valid date

### Security Requirements

1. **HTTPS only** - All API calls must use HTTPS
2. **Credential encryption** - Store API keys encrypted
3. **No secrets in code** - Use environment variables or secure storage

## Webhook Support (Optional)

If your connector supports webhooks:

```typescript
class MyConnector implements Connector {
  // ... other methods ...
  
  normalizeWebhook(payload: unknown, tenantId: string): NormalizedData[] {
    const webhook = payload as { type: string; data: unknown };
    
    if (webhook.type === 'charge.succeeded') {
      return [this.normalize(webhook.data)];
    }
    
    return [];
  }
}
```

## Error Handling

### ConnectorError

Throw `ConnectorError` for connector-specific errors:

```typescript
import { ConnectorError } from '@settler/adapters';

if (!config.apiKey) {
  throw new ConnectorError(
    'API key is required',
    'MISSING_API_KEY',
    'stripe'
  );
}
```

### ValidationError

Throw `ValidationError` for data validation failures:

```typescript
import { ValidationError } from '@settler/adapters';

if (typeof data.amount !== 'number') {
  throw new ValidationError(
    'Amount must be a number',
    'amount',
    data.amount
  );
}
```

## Testing

### Unit Tests

```typescript
import { StripeConnector } from './stripe-connector';
import { validateConnector } from '@settler/adapters';

describe('StripeConnector', () => {
  it('should validate correctly', () => {
    const connector = new StripeConnector();
    const validation = validateConnector(connector);
    expect(validation.valid).toBe(true);
  });
  
  it('should normalize data correctly', () => {
    const connector = new StripeConnector();
    const raw = {
      id: 'ch_123',
      amount: 1000,
      currency: 'usd',
      created: 1234567890,
    };
    
    const normalized = connector.normalize(raw);
    expect(normalized.id).toBe('ch_123');
    expect(normalized.amount).toBe(10.0);
    expect(normalized.currency).toBe('USD');
  });
});
```

### Integration Tests

Test against real APIs (use test credentials):

```typescript
it('should fetch data from Stripe', async () => {
  const connector = new StripeConnector();
  const options = {
    dateRange: {
      start: new Date('2024-01-01'),
      end: new Date('2024-01-31'),
    },
    config: {
      apiKey: process.env.STRIPE_TEST_KEY,
    },
  };
  
  const data = await connector.fetch(options);
  expect(data.length).toBeGreaterThan(0);
  expect(data[0].id).toBeDefined();
});
```

## Publishing

### Package Structure

```
my-connector/
├── package.json
├── src/
│   ├── index.ts
│   └── connector.ts
├── tests/
│   └── connector.test.ts
└── README.md
```

### package.json

```json
{
  "name": "@settler/connector-stripe",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "peerDependencies": {
    "@settler/adapters": "^1.0.0"
  }
}
```

### Publishing Checklist

- [ ] Connector validates successfully
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Documentation complete
- [ ] Example usage provided
- [ ] Security review completed

## Best Practices

1. **Version your connector** - Use semantic versioning
2. **Handle errors gracefully** - Provide clear error messages
3. **Support pagination** - Handle large datasets efficiently
4. **Cache when possible** - Reduce API calls
5. **Log appropriately** - Help with debugging
6. **Document configuration** - Clear setup instructions
7. **Test thoroughly** - Cover edge cases
8. **Follow rate limits** - Respect external API limits

## Examples

See the `packages/adapters/src` directory for reference implementations:

- `stripe.ts` - Stripe payment processor
- `shopify.ts` - Shopify e-commerce platform
- `paypal.ts` - PayPal payment processor

## Support

- **Documentation:** [docs.settler.io/extensions](https://docs.settler.io/extensions)
- **SDK:** `npm install @settler/adapters`
- **Issues:** [GitHub Issues](https://github.com/settler/settler/issues)
- **Support:** support@settler.io
