# Multi-Currency Reconciliation Guide

**How to reconcile transactions in different currencies with Settler**

---

## Overview

Settler supports automatic foreign exchange (FX) conversion for reconciling transactions in different currencies. This is essential for businesses operating internationally or accepting payments in multiple currencies.

---

## How It Works

### Automatic FX Conversion

When you enable FX conversion in a reconciliation job, Settler:

1. **Fetches Exchange Rates:** Automatically retrieves FX rates from a reliable source (e.g., ECB, OANDA)
2. **Converts Amounts:** Converts all amounts to a base currency (e.g., USD)
3. **Matches Transactions:** Matches transactions using converted amounts
4. **Tracks Conversion:** Logs conversion rates and dates for audit purposes

### Supported Currencies

Settler supports all major currencies:
- USD, EUR, GBP, JPY, CAD, AUD, CHF, CNY, and 100+ more
- See [full currency list](#supported-currencies) below

---

## Configuration

### Enable FX Conversion

```typescript
import Settler from "@settler/sdk";

const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});

const job = await settler.jobs.create({
  name: "Multi-Currency Reconciliation",
  source: {
    adapter: "stripe",
    config: {
      apiKey: process.env.STRIPE_SECRET_KEY,
    },
  },
  target: {
    adapter: "quickbooks",
    config: {
      clientId: process.env.QB_CLIENT_ID,
      clientSecret: process.env.QB_CLIENT_SECRET,
      realmId: process.env.QB_REALM_ID,
    },
  },
  rules: {
    matching: [
      { field: "transaction_id", type: "exact" },
      { field: "amount", type: "exact", tolerance: 0.01 },
    ],
    // Enable FX conversion
    fxConversion: {
      enabled: true,
      baseCurrency: "USD", // Base currency for conversion
      rateSource: "ecb", // Exchange rate source (ecb, oanda, custom)
    },
  },
});
```

### FX Conversion Options

```typescript
fxConversion: {
  enabled: boolean;           // Enable/disable FX conversion
  baseCurrency: string;       // Base currency (ISO 4217 code, e.g., "USD")
  rateSource?: "ecb" | "oanda" | "custom"; // Rate source
  customRateSource?: string; // Custom rate source URL (if rateSource = "custom")
  rateDate?: "transaction" | "reconciliation" | "specific"; // Which date to use for rates
  tolerance?: number;         // Tolerance for FX conversion (default: 0.01)
}
```

---

## Use Cases

### Use Case 1: Stripe Multi-Currency → QuickBooks USD

**Scenario:** Stripe charges in EUR, GBP, USD. QuickBooks records everything in USD.

```typescript
const job = await settler.jobs.create({
  name: "Stripe Multi-Currency to QuickBooks USD",
  source: {
    adapter: "stripe",
    config: { apiKey: process.env.STRIPE_SECRET_KEY },
  },
  target: {
    adapter: "quickbooks",
    config: { /* ... */ },
  },
  rules: {
    matching: [
      { field: "charge_id", type: "exact" },
      { field: "amount", type: "exact", tolerance: 0.01 },
    ],
    fxConversion: {
      enabled: true,
      baseCurrency: "USD",
      rateDate: "transaction", // Use rate from transaction date
    },
  },
});
```

### Use Case 2: Shopify International → Accounting System

**Scenario:** Shopify store accepts EUR, GBP, USD. Accounting system uses EUR as base.

```typescript
const job = await settler.jobs.create({
  name: "Shopify International to Accounting EUR",
  source: {
    adapter: "shopify",
    config: {
      apiKey: process.env.SHOPIFY_API_KEY,
      shopDomain: "your-shop.myshopify.com",
    },
  },
  target: {
    adapter: "quickbooks",
    config: { /* ... */ },
  },
  rules: {
    matching: [
      { field: "order_id", type: "exact" },
      { field: "amount", type: "exact", tolerance: 0.01 },
    ],
    fxConversion: {
      enabled: true,
      baseCurrency: "EUR",
      rateDate: "reconciliation", // Use rate from reconciliation date
    },
  },
});
```

---

## Exchange Rate Sources

### ECB (European Central Bank)

**Default rate source for EUR-based conversions**

- **Update Frequency:** Daily
- **Coverage:** 30+ currencies
- **Rate Type:** Mid-market rates
- **Best For:** EUR-based businesses

### OANDA

**Comprehensive rate source**

- **Update Frequency:** Real-time
- **Coverage:** 200+ currencies
- **Rate Type:** Interbank rates
- **Best For:** High-frequency reconciliations

### Custom Rate Source

**Use your own rate provider**

```typescript
fxConversion: {
  enabled: true,
  baseCurrency: "USD",
  rateSource: "custom",
  customRateSource: "https://api.your-rates.com/rates",
}
```

**Expected API Format:**
```json
{
  "base": "USD",
  "rates": {
    "EUR": 0.85,
    "GBP": 0.73,
    "JPY": 110.5
  },
  "date": "2026-01-15"
}
```

---

## Rate Date Options

### Transaction Date

Use exchange rate from the transaction date.

**Best For:** Historical accuracy, audit compliance

```typescript
rateDate: "transaction"
```

### Reconciliation Date

Use exchange rate from the reconciliation date.

**Best For:** Current value reconciliation, real-time matching

```typescript
rateDate: "reconciliation"
```

### Specific Date

Use exchange rate from a specific date.

**Best For:** Month-end reconciliation, specific reporting periods

```typescript
rateDate: "specific",
specificDate: "2026-01-15"
```

---

## Tolerance & Matching

### FX Conversion Tolerance

Set tolerance for FX conversion differences:

```typescript
fxConversion: {
  enabled: true,
  baseCurrency: "USD",
  tolerance: 0.01, // 1 cent tolerance
}
```

**Example:**
- Stripe charge: €100.00 (EUR)
- Exchange rate: 1 EUR = 1.10 USD
- Converted amount: $110.00
- QuickBooks amount: $110.01
- **Result:** ✅ Matched (within $0.01 tolerance)

### Matching Rules

Combine FX conversion with matching rules:

```typescript
rules: {
  matching: [
    { field: "transaction_id", type: "exact" },
    { field: "amount", type: "exact", tolerance: 0.01 }, // Tolerance applies to converted amount
    { field: "currency", type: "exact" }, // Original currency still tracked
  ],
  fxConversion: {
    enabled: true,
    baseCurrency: "USD",
  },
}
```

---

## Reports & Audit Trail

### FX Conversion in Reports

Reports include FX conversion details:

```json
{
  "match": {
    "id": "match_123",
    "sourceAmount": 100.00,
    "sourceCurrency": "EUR",
    "targetAmount": 110.00,
    "targetCurrency": "USD",
    "fxRate": 1.10,
    "fxRateDate": "2026-01-15",
    "convertedAmount": 110.00,
    "convertedCurrency": "USD"
  }
}
```

### Audit Trail

All FX conversions are logged:

- Exchange rate used
- Rate source
- Rate date
- Conversion calculation
- Original and converted amounts

---

## Best Practices

### 1. Choose Appropriate Base Currency

- Use your accounting system's base currency
- Consider your primary market
- Ensure rate source supports your base currency

### 2. Set Realistic Tolerance

- Consider FX rate fluctuations
- Account for rounding differences
- Balance accuracy vs. false positives

### 3. Use Transaction Date for Historical Accuracy

- Better for audit compliance
- Matches accounting records
- More accurate for reporting

### 4. Monitor FX Rate Sources

- Check rate source availability
- Handle rate source failures gracefully
- Consider fallback rate sources

### 5. Review Exceptions Regularly

- FX conversion can cause mismatches
- Review exceptions for rate-related issues
- Adjust tolerance if needed

---

## Troubleshooting

### Issue: FX Rate Not Available

**Error:** `FX rate not available for currency pair EUR/USD`

**Solution:**
- Check rate source supports currency pair
- Verify rate date is valid
- Use fallback rate source

### Issue: High Exception Rate

**Possible Causes:**
- Tolerance too strict
- Rate source inaccurate
- Rate date mismatch

**Solution:**
- Increase tolerance
- Use more accurate rate source
- Align rate date with transaction date

### Issue: Conversion Mismatch

**Error:** Converted amounts don't match

**Solution:**
- Verify exchange rate accuracy
- Check tolerance settings
- Review conversion calculation

---

## Supported Currencies

Settler supports all ISO 4217 currencies, including:

**Major Currencies:**
- USD (US Dollar)
- EUR (Euro)
- GBP (British Pound)
- JPY (Japanese Yen)
- CAD (Canadian Dollar)
- AUD (Australian Dollar)
- CHF (Swiss Franc)
- CNY (Chinese Yuan)
- INR (Indian Rupee)
- BRL (Brazilian Real)

**See full list:** [ISO 4217 Currency Codes](https://www.iso.org/iso-4217-currency-codes.html)

---

## API Reference

### FX Conversion Configuration

```typescript
interface FXConversionConfig {
  enabled: boolean;
  baseCurrency: string; // ISO 4217 code
  rateSource?: "ecb" | "oanda" | "custom";
  customRateSource?: string;
  rateDate?: "transaction" | "reconciliation" | "specific";
  specificDate?: string; // ISO 8601 date
  tolerance?: number; // Default: 0.01
}
```

### Report Response

```typescript
interface MatchWithFX {
  id: string;
  sourceAmount: number;
  sourceCurrency: string;
  targetAmount: number;
  targetCurrency: string;
  fxRate: number;
  fxRateDate: string;
  convertedAmount: number;
  convertedCurrency: string;
}
```

---

## Examples

See code examples:
- [`examples/multi-currency.ts`](../examples/multi-currency.ts)
- [`examples/ecommerce-shopify-stripe.ts`](../examples/ecommerce-shopify-stripe.ts)

---

**Last Updated:** 2026-01-15
