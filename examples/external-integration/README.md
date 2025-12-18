# External Integration Example

This example demonstrates how external developers can integrate with Settler without reading internal code.

## Features Demonstrated

1. **Public API Usage** - All functionality via public `/api/v1/*` endpoints
2. **SDK Integration** - Using `@settler/sdk` package
3. **Webhook Setup** - Subscribing to public events
4. **API Key Management** - Creating and managing API keys
5. **No Internal Dependencies** - Zero reliance on internal code

## Setup

1. **Install dependencies:**

```bash
npm install
```

2. **Set environment variables:**

```bash
export SETTLER_API_KEY="rk_your_api_key_here"
export STRIPE_SECRET_KEY="sk_test_..."
export SHOPIFY_API_KEY="your_shopify_key"
export SHOPIFY_SHOP_DOMAIN="your-shop.myshopify.com"

# Optional
export SETUP_WEBHOOK="true"
export WEBHOOK_URL="https://your-app.com/webhooks/settler"
export SETTLER_WEBHOOK_SECRET="whsec_..."
```

3. **Run the example:**

```bash
npm start
```

## What This Demonstrates

### ✅ Correct: Using Public API

- Uses `@settler/sdk` package
- Calls public `/api/v1/*` endpoints
- Subscribes to public webhook events
- Manages API keys via public endpoints

### ❌ What We DON'T Do

- Import internal services
- Access private routes
- Depend on internal types
- Read internal implementation details

## Integration Points

### 1. SDK Client

```javascript
import { SettlerClient } from '@settler/sdk';

const client = new SettlerClient({
  apiKey: process.env.SETTLER_API_KEY,
});
```

### 2. Public API Routes

All functionality accessed via:
- `/api/v1/jobs` - Job management
- `/api/v1/reports` - Reports
- `/api/v1/webhooks` - Webhook management
- `/api/v1/api-keys` - API key management

### 3. Webhook Events

Subscribe to public events:
- `reconciliation.completed`
- `reconciliation.failed`
- `ingestion.completed`

See `/docs/WEBHOOKS.md` for complete event list.

## Next Steps

1. **Read Documentation:**
   - `/docs/API.md` - API reference
   - `/docs/WEBHOOKS.md` - Webhook guide
   - `/docs/EXTENSIONS.md` - Building connectors

2. **Build Your Integration:**
   - Use the SDK for API access
   - Set up webhooks for real-time updates
   - Create API keys with appropriate scopes

3. **Test Your Integration:**
   - Use test API keys
   - Test webhook signature verification
   - Handle errors gracefully

## Support

- **Documentation:** [docs.settler.io](https://docs.settler.io)
- **SDK:** `npm install @settler/sdk`
- **Support:** support@settler.io
