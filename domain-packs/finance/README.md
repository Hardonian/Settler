# Finance Domain Pack

Industry-specific templates and workflows for financial reconciliation.

## Contents

### Ledger Reconciliation Templates

- **Stripe to QuickBooks:** Payment reconciliation
- **PayPal to Ledger:** PayPal transaction reconciliation
- **Bank Statement Reconciliation:** Bank statement matching

### Workflows

- **Monthly Financial Reconciliation:** Automated monthly reconciliation
- **Real-Time Payment Reconciliation:** Real-time payment matching

## Usage

```javascript
const { SettlerClient } = require('@settler/sdk');

const client = new SettlerClient({
  apiKey: process.env.SETTLER_API_KEY,
});

// Use FinTech module
const result = await client.fintech.reconcileLedgers(
  sourceEntries,
  targetEntries
);

console.log('Reconciliation result:', result);
```

## Templates

- `stripe-quickbooks-mapping.json` - Stripe to QuickBooks mapping
- `monthly-reconciliation-workflow.json` - Monthly reconciliation workflow
- `accounting-drift-detection.json` - Accounting drift detection

---

**For more information, see:** [FinTech Documentation](../../docs/VERTICAL_MODULES.md#fintech-module)
