# QuickBooks API Integration Guide

**Published:** 2026-01-15  
**Author:** Settler Team  
**Category:** Tutorial, Accounting

---

## Introduction

This guide shows you how to integrate Settler with QuickBooks for automated reconciliation and accounting sync.

---

## Overview

Settler's QuickBooks adapter allows you to:

- Reconcile Stripe/Shopify transactions with QuickBooks
- Sync reconciled transactions to QuickBooks automatically
- Export reconciliation reports to QuickBooks format
- Handle multi-entity QuickBooks companies

---

## QuickBooks OAuth Setup

### Step 1: Create QuickBooks App

1. Go to [Intuit Developer](https://developer.intuit.com)
2. Create new app
3. Select "QuickBooks Online API"
4. Get Client ID and Client Secret

### Step 2: OAuth Flow

```typescript
// Step 1: Get authorization URL
const authUrl = `https://appcenter.intuit.com/connect/oauth2?client_id=${clientId}&scope=com.intuit.quickbooks.accounting&redirect_uri=${redirectUri}&response_type=code`;

// Step 2: User authorizes, redirects with code
// Step 3: Exchange code for tokens
const tokens = await exchangeCodeForTokens(code);

// Step 4: Use tokens in Settler
const job = await settler.jobs.create({
  name: "Stripe-QuickBooks Reconciliation",
  source: {
    adapter: "stripe",
    config: { apiKey: process.env.STRIPE_SECRET_KEY },
  },
  target: {
    adapter: "quickbooks",
    config: {
      clientId: process.env.QB_CLIENT_ID,
      clientSecret: process.env.QB_CLIENT_SECRET,
      realmId: tokens.realmId,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    },
  },
  rules: {
    matching: [
      { field: "transaction_id", type: "exact" },
      { field: "amount", type: "exact", tolerance: 0.01 },
    ],
  },
});
```

---

## Reconciliation Examples

### Example 1: Stripe → QuickBooks

```typescript
const job = await settler.jobs.create({
  name: "Stripe to QuickBooks Sync",
  source: {
    adapter: "stripe",
    config: { apiKey: process.env.STRIPE_SECRET_KEY },
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
      { field: "charge_id", type: "exact" },
      { field: "amount", type: "exact", tolerance: 0.01 },
    ],
  },
});
```

### Example 2: Shopify → QuickBooks

```typescript
const job = await settler.jobs.create({
  name: "Shopify Orders to QuickBooks",
  source: {
    adapter: "shopify",
    config: {
      apiKey: process.env.SHOPIFY_API_KEY,
      shopDomain: "your-shop.myshopify.com",
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
      { field: "order_id", type: "exact" },
      { field: "amount", type: "exact", tolerance: 0.01 },
    ],
  },
});
```

---

## Export to QuickBooks

### CSV Export

```typescript
const csv = await settler.reports.export(job.data.id, {
  format: "csv",
  startDate: "2026-01-01",
  endDate: "2026-01-31",
});

// Import CSV into QuickBooks
```

### Direct Sync (Coming Soon)

```typescript
// Sync matched transactions directly to QuickBooks
await settler.jobs.syncToQuickBooks(job.data.id, {
  account: "Accounts Receivable",
  syncUnmatched: false,
});
```

---

## Best Practices

1. **Use OAuth Tokens:** Don't store credentials, use OAuth
2. **Handle Token Refresh:** Tokens expire, refresh automatically
3. **Sync Regularly:** Daily or weekly syncs
4. **Review Exceptions:** Check unmatched items before syncing
5. **Audit Trail:** Keep records of all syncs

---

## Troubleshooting

### Issue: OAuth Token Expired

**Solution:** Refresh token automatically

```typescript
// Settler handles token refresh automatically
// But you can refresh manually if needed
```

### Issue: Realm ID Not Found

**Solution:** Verify realm ID in QuickBooks settings

### Issue: Sync Fails

**Solution:** Check QuickBooks API limits, verify permissions

---

**Questions?** Contact us at support@settler.io
