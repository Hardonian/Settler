# Settler Developer Guide

## Quick Start

### 1. Get Your API Key

1. Sign up at https://settler.dev
2. Navigate to Console → API Keys
3. Create a new API key
4. Copy your API key (starts with `rk_`)

### 2. Install the SDK

```bash
npm install @settler/sdk
```

### 3. Initialize the Client

```typescript
import { SettlerClient } from '@settler/sdk';

const client = new SettlerClient({
  apiKey: 'rk_your_api_key_here',
});
```

### 4. Make Your First API Call

```typescript
// Reconcile transactions
const result = await client.reconcile({
  left: [
    { id: '1', amount: 100.00, date: '2025-01-01' },
    { id: '2', amount: 200.00, date: '2025-01-02' },
  ],
  right: [
    { id: 'a', amount: 100.00, date: '2025-01-01' },
    { id: 'b', amount: 200.00, date: '2025-01-02' },
  ],
});

console.log(result.matches); // Automatically matched transactions
console.log(result.unmatched); // Transactions that couldn't be matched
```

---

## Core Concepts

### Reconciliation

Reconciliation matches transactions from two sources (e.g., bank statements vs. accounting records).

**Key Features:**
- Deterministic matching algorithms
- Handles edge cases automatically
- Built-in audit trails
- Type-safe results

**Example:**
```typescript
const result = await client.reconcile({
  left: bankTransactions,
  right: accountingRecords,
  options: {
    tolerance: 0.01, // Allow $0.01 difference
    dateRange: 7, // Match within 7 days
  },
});
```

### Receipt Parsing

Parse receipts from images or PDFs into structured JSON.

**Key Features:**
- High accuracy OCR
- Structured JSON output
- Line-item extraction
- Multi-format support

**Example:**
```typescript
const receipt = await client.receipts.parse({
  image: receiptImageBuffer,
  options: {
    extractItems: true,
    extractTax: true,
  },
});

console.log(receipt.vendor); // "Amazon"
console.log(receipt.total); // 123.45
console.log(receipt.items); // Array of line items
```

### Feature Flags

Manage feature flags and entitlements with usage-based limits.

**Key Features:**
- Real-time evaluation
- Usage-based limits
- Environment-specific configs
- Type-safe evaluation

**Example:**
```typescript
const flag = await client.featureFlags.evaluate({
  key: 'new-checkout-flow',
  context: {
    userId: 'user-123',
    environment: 'production',
  },
});

if (flag.enabled) {
  // Show new checkout flow
}
```

---

## API Reference

### Reconciliation API

#### `reconcile(options)`

Match transactions from two sources.

**Parameters:**
- `left`: Array of left-side transactions
- `right`: Array of right-side transactions
- `options`: Optional configuration

**Returns:**
- `matches`: Array of matched transaction pairs
- `unmatched`: Array of unmatched transactions
- `confidence`: Overall confidence score

### Receipts API

#### `receipts.parse(options)`

Parse a receipt image or PDF.

**Parameters:**
- `image`: Buffer or file path
- `options`: Optional parsing options

**Returns:**
- `vendor`: Vendor name
- `total`: Total amount
- `items`: Array of line items
- `confidence`: Parsing confidence score

### Feature Flags API

#### `featureFlags.evaluate(options)`

Evaluate a feature flag.

**Parameters:**
- `key`: Feature flag key
- `context`: Evaluation context

**Returns:**
- `enabled`: Whether flag is enabled
- `variant`: Variant value (if applicable)
- `source`: Evaluation source

---

## Error Handling

All SDK methods throw errors that you should catch:

```typescript
try {
  const result = await client.reconcile({ left, right });
} catch (error) {
  if (error instanceof SettlerError) {
    console.error('Settler API error:', error.message);
    console.error('Error code:', error.code);
    console.error('Status code:', error.statusCode);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### Common Error Codes

- `UNAUTHORIZED`: Invalid API key
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `VALIDATION_ERROR`: Invalid input data
- `INTERNAL_ERROR`: Server error

---

## Best Practices

### 1. Use TypeScript

The SDK is fully typed. Use TypeScript for better developer experience:

```typescript
import { SettlerClient, ReconciliationResult } from '@settler/sdk';

const client = new SettlerClient({ apiKey: process.env.SETTLER_API_KEY! });
const result: ReconciliationResult = await client.reconcile({ left, right });
```

### 2. Handle Errors Gracefully

Always wrap API calls in try/catch:

```typescript
try {
  const result = await client.reconcile({ left, right });
  // Process result
} catch (error) {
  // Log error, show user-friendly message
  logger.error('Reconciliation failed', error);
  showError('Failed to reconcile transactions. Please try again.');
}
```

### 3. Use Webhooks for Real-time Updates

Configure webhooks to receive notifications:

```typescript
// In your webhook handler
app.post('/webhooks/settler', async (req, res) => {
  const event = req.body;
  
  if (event.type === 'reconciliation.completed') {
    // Handle reconciliation completion
  } else if (event.type === 'receipt.parsed') {
    // Handle receipt parsing
  }
  
  res.json({ received: true });
});
```

### 4. Cache Results When Appropriate

Cache reconciliation results to reduce API calls:

```typescript
const cacheKey = `reconcile-${hash(left)}-${hash(right)}`;
const cached = await cache.get(cacheKey);

if (cached) {
  return cached;
}

const result = await client.reconcile({ left, right });
await cache.set(cacheKey, result, { ttl: 3600 }); // Cache for 1 hour
return result;
```

### 5. Monitor Usage

Track your API usage to avoid hitting limits:

```typescript
const usage = await client.usage.getCurrent();
console.log(`Used ${usage.current} of ${usage.limit} calls this month`);

if (usage.remaining < usage.limit * 0.1) {
  // Warn user about approaching limit
  showWarning('You're approaching your usage limit');
}
```

---

## Examples

### Complete Reconciliation Flow

```typescript
import { SettlerClient } from '@settler/sdk';

const client = new SettlerClient({ apiKey: process.env.SETTLER_API_KEY! });

async function reconcileBankStatement(bankTransactions: Transaction[], accountingRecords: Transaction[]) {
  try {
    const result = await client.reconcile({
      left: bankTransactions,
      right: accountingRecords,
      options: {
        tolerance: 0.01,
        dateRange: 7,
      },
    });

    // Process matches
    for (const match of result.matches) {
      console.log(`Matched: ${match.left.id} ↔ ${match.right.id}`);
      await markAsReconciled(match.left.id, match.right.id);
    }

    // Handle unmatched
    if (result.unmatched.left.length > 0) {
      console.warn(`Unmatched left: ${result.unmatched.left.length} transactions`);
      await flagForReview(result.unmatched.left);
    }

    if (result.unmatched.right.length > 0) {
      console.warn(`Unmatched right: ${result.unmatched.right.length} transactions`);
      await flagForReview(result.unmatched.right);
    }

    return result;
  } catch (error) {
    console.error('Reconciliation failed:', error);
    throw error;
  }
}
```

### Receipt Processing Pipeline

```typescript
async function processReceipt(imageBuffer: Buffer) {
  try {
    // Parse receipt
    const receipt = await client.receipts.parse({
      image: imageBuffer,
      options: {
        extractItems: true,
        extractTax: true,
      },
    });

    // Validate confidence
    if (receipt.confidence < 0.8) {
      throw new Error('Low confidence score, manual review required');
    }

    // Store receipt
    await db.receipts.create({
      vendor: receipt.vendor,
      total: receipt.total,
      date: receipt.date,
      items: receipt.items,
      confidence: receipt.confidence,
    });

    return receipt;
  } catch (error) {
    console.error('Receipt processing failed:', error);
    throw error;
  }
}
```

---

## Resources

- **API Documentation**: https://settler.dev/docs/api
- **SDK Reference**: https://settler.dev/docs/sdk
- **Examples**: https://settler.dev/docs/examples
- **Support**: support@settler.dev
- **Discord**: https://discord.gg/settler

---

**Last Updated**: 2025-01-XX
