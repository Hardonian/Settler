# E-Commerce Domain Pack

Industry-specific templates and workflows for e-commerce platforms.

## Contents

### Product Feed Validation

- **Product Feed Validator:** Validate product feed formats
- **Inventory Reconciliation:** Reconcile inventory across platforms
- **Order Reconciliation:** Reconcile orders between systems

### E-Commerce Workflows

- **Multi-Marketplace Sync:** Sync products across marketplaces
- **Order Fulfillment Reconciliation:** Reconcile fulfillment data
- **Payment Reconciliation:** Reconcile payment data

## Usage

```javascript
const { SettlerClient } = require("@settler/sdk");

const client = new SettlerClient({
  apiKey: process.env.SETTLER_API_KEY,
});

// Validate product feed
const result = await client.recon.jobs.create({
  name: "Product Feed Validation",
  sourceAdapter: "shopify",
  targetAdapter: "amazon",
  reconStrategy: "deterministic",
});
```

## Templates

- `product-feed-validator.json` - Product feed validation
- `multi-marketplace-sync.json` - Multi-marketplace synchronization
- `order-reconciliation-workflow.json` - Order reconciliation

---

**For more information, see:** [E-Commerce Documentation](../../docs/VERTICAL_MODULES.md#e-commerce)
