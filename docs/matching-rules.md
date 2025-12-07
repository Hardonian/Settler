# Matching Rules Documentation

**Configure how Settler matches transactions between platforms.**

---

## Overview

Matching rules define how Settler identifies corresponding transactions between your source and target platforms. You can use multiple rules together to create sophisticated matching logic.

---

## Rule Types

### 1. Exact Match

Matches when field values are exactly equal.

```typescript
{
  field: "order_id",
  type: "exact"
}
```

**Use Cases:**

- Order IDs
- Transaction IDs
- Invoice numbers
- Unique identifiers

**Example:**

- Source: `order_id: "ORD-12345"`
- Target: `order_id: "ORD-12345"`
- Result: ✅ Match

---

### 2. Fuzzy Match

Matches when field values are similar (using string similarity).

```typescript
{
  field: "customer_name",
  type: "fuzzy",
  threshold: 0.8  // 0.0 to 1.0 (80% similarity required)
}
```

**Use Cases:**

- Customer names
- Product descriptions
- Addresses
- Any text fields with potential variations

**Example:**

- Source: `customer_name: "John Smith"`
- Target: `customer_name: "John A. Smith"`
- Similarity: 0.85
- Result: ✅ Match (above 0.8 threshold)

---

### 3. Range Match

Matches when numeric values are within a specified range or tolerance.

#### Amount Range

```typescript
{
  field: "amount",
  type: "range",
  tolerance: 0.01  // ±$0.01 tolerance
}
```

**Use Cases:**

- Transaction amounts (handles fees, rounding)
- Quantities
- Any numeric fields with expected variance

**Example:**

- Source: `amount: 99.99`
- Target: `amount: 100.00`
- Tolerance: 0.01
- Difference: 0.01
- Result: ✅ Match (within tolerance)

#### Date Range

```typescript
{
  field: "date",
  type: "range",
  days: 2  // ±2 days tolerance
}
```

**Use Cases:**

- Transaction dates (handles timezone differences)
- Settlement dates
- Processing delays

**Example:**

- Source: `date: "2026-01-15"`
- Target: `date: "2026-01-16"`
- Tolerance: 2 days
- Difference: 1 day
- Result: ✅ Match (within tolerance)

---

## Combining Rules

Multiple rules are combined with **AND** logic (all must match):

```typescript
rules: {
  matching: [
    { field: "order_id", type: "exact" },
    { field: "amount", type: "range", tolerance: 0.01 },
    { field: "date", type: "range", days: 1 },
  ];
}
```

**Match Logic:**

- ✅ All rules must pass for a match
- If any rule fails, transaction is unmatched
- Order of rules doesn't matter

---

## Conflict Resolution

When multiple source transactions could match the same target (or vice versa), use conflict resolution:

```typescript
rules: {
  matching: [
    // ... matching rules
  ],
  conflictResolution: "last-wins"  // or "first-wins", "manual-review"
}
```

### Options

- **`last-wins`** - Use the most recent transaction (default)
- **`first-wins`** - Use the earliest transaction
- **`manual-review`** - Create exception for manual review

---

## Advanced: Custom Matching Functions

For complex matching logic, use custom JavaScript functions:

```typescript
rules: {
  matching: [
    {
      field: "custom",
      type: "function",
      fn: `
        (source, target) => {
          // Custom matching logic
          const sourceRef = source.metadata?.orderRef;
          const targetRef = target.metadata?.reference;
          
          // Match if references are similar
          if (sourceRef && targetRef) {
            return sourceRef.toLowerCase() === targetRef.toLowerCase();
          }
          
          // Fallback to amount match
          return Math.abs(source.amount - target.amount) < 0.01;
        }
      `,
    },
  ];
}
```

**Security Note:** Custom functions run in a sandboxed environment. Only use trusted code.

---

## Common Matching Patterns

### Pattern 1: E-commerce Order Reconciliation

Match Shopify orders with Stripe payments:

```typescript
rules: {
  matching: [
    { field: "order_id", type: "exact" },
    { field: "amount", type: "range", tolerance: 0.01 },
    { field: "date", type: "range", days: 1 }
  ],
  conflictResolution: "last-wins"
}
```

### Pattern 2: Multi-Currency Reconciliation

Match transactions in different currencies:

```typescript
rules: {
  matching: [
    { field: "transaction_id", type: "exact" },
    {
      field: "amount",
      type: "range",
      tolerance: 0.01,
      currencyConversion: true, // Convert to base currency first
    },
  ];
}
```

### Pattern 3: Fuzzy Customer Matching

Match by customer name with fuzzy matching:

```typescript
rules: {
  matching: [
    { field: "customer_name", type: "fuzzy", threshold: 0.8 },
    { field: "amount", type: "range", tolerance: 0.01 },
    { field: "date", type: "range", days: 7 },
  ];
}
```

### Pattern 4: Invoice Reconciliation

Match invoices with payments:

```typescript
rules: {
  matching: [
    { field: "invoice_number", type: "exact" },
    { field: "amount", type: "range", tolerance: 0.01 },
    { field: "date", type: "range", days: 30 }  // Longer window for invoices
  ],
  conflictResolution: "manual-review"  // Review partial payments
}
```

---

## Field Mapping

Different platforms may use different field names. Settler automatically maps common fields:

| Common Field | Shopify          | Stripe              | QuickBooks       |
| ------------ | ---------------- | ------------------- | ---------------- |
| Order ID     | `order_id`       | `metadata.order_id` | `ref_number`     |
| Amount       | `total_price`    | `amount`            | `amount`         |
| Date         | `created_at`     | `created`           | `txn_date`       |
| Customer     | `customer.email` | `customer.email`    | `customer.email` |

**Custom Mapping:** If your platforms use different field names, specify mappings in adapter config:

```typescript
source: {
  adapter: "shopify",
  config: {
    apiKey: "...",
    fieldMappings: {
      order_id: "order_number",  // Map order_id to order_number
      amount: "total_price"
    }
  }
}
```

---

## Matching Confidence

Settler assigns a confidence score (0.0 to 1.0) to each match:

- **1.0** - Perfect match (all exact rules pass)
- **0.8-0.9** - High confidence (fuzzy match with high similarity)
- **0.6-0.7** - Medium confidence (fuzzy match with lower similarity)
- **<0.6** - Low confidence (review recommended)

Use confidence scores to:

- Filter matches by quality
- Prioritize manual review
- Set up alerts for low-confidence matches

```typescript
const report = await settler.reports.get(jobId);
const lowConfidenceMatches = report.data.matches.filter((match) => match.confidence < 0.7);
```

---

## Best Practices

### 1. Start Simple

Begin with exact matches on unique identifiers:

```typescript
matching: [{ field: "order_id", type: "exact" }];
```

### 2. Add Tolerance for Amounts

Always use tolerance for amount matching (handles fees, rounding):

```typescript
{ field: "amount", type: "range", tolerance: 0.01 }
```

### 3. Use Date Ranges

Account for processing delays and timezone differences:

```typescript
{ field: "date", type: "range", days: 1 }
```

### 4. Combine Multiple Rules

Use multiple rules to reduce false matches:

```typescript
matching: [
  { field: "order_id", type: "exact" },
  { field: "amount", type: "range", tolerance: 0.01 },
];
```

### 5. Test Matching Rules

Test rules with sample data before production:

```typescript
const testResult = await settler.jobs.testMatchingRules({
  source: sampleSourceTransaction,
  target: sampleTargetTransaction,
  rules: yourMatchingRules,
});

console.log(`Match: ${testResult.data.matched}`);
console.log(`Confidence: ${testResult.data.confidence}`);
```

---

## Troubleshooting

### Too Many Unmatched Transactions

**Problem:** High number of unmatched transactions

**Solutions:**

- Increase date range tolerance
- Increase amount tolerance
- Add fuzzy matching for text fields
- Check field mappings

### Too Many False Matches

**Problem:** Incorrect transactions being matched

**Solutions:**

- Add more specific matching rules
- Use exact match on unique identifiers
- Reduce tolerance values
- Add date range constraints

### Low Confidence Matches

**Problem:** Many matches with low confidence scores

**Solutions:**

- Improve data quality at source
- Use exact matches where possible
- Adjust fuzzy matching thresholds
- Review and refine rules

---

## Next Steps

- 📖 [API Quick Start Guide](./api-quick-start.md)
- 🔔 [Webhook Setup Guide](./webhook-setup.md)
- 📚 [API Reference](https://docs.settler.io/api)
- 💡 [Integration Recipes](./integration-recipes.md)

---

## Need Help?

- **Documentation:** [docs.settler.io](https://docs.settler.io)
- **Discord Community:** [discord.gg/settler](https://discord.gg/settler)
- **Email Support:** [support@settler.io](mailto:support@settler.io)
