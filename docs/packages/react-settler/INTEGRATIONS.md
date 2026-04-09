# Integration Guide

React.Settler integrates seamlessly with popular platforms and tools.

## MCP (Model Context Protocol) Integration

React.Settler includes an MCP server adapter for AI assistants and development tools.

### Setup

```tsx
import { createMCPServer } from "@settler/react-settler";

const mcpServer = createMCPServer({
  name: "react-settler",
  version: "0.1.0",
  description: "Reconciliation workflow server",
});

// Register workflows
mcpServer.registerWorkflow("workflow-1", config);

// List resources
const resources = mcpServer.listResources();

// Call tools
const result = await mcpServer.callTool("validate_transaction", {
  transaction: transactionData,
});
```

### Available Tools

- `compile_reconciliation_workflow` - Compile workflow to JSON
- `validate_transaction` - Validate transaction data
- `create_reconciliation_workflow` - Create new workflow

## Shopify App Integration

Embed React.Settler in Shopify apps.

### Basic Usage

```tsx
import { ShopifyApp } from "@settler/react-settler";

function MyShopifyApp() {
  return (
    <ShopifyApp
      shop="myshop.myshopify.com"
      apiKey="your-api-key"
      transactions={transactions}
      exceptions={exceptions}
      onAction={(action, data) => {
        // Handle Shopify app actions
        console.log(action, data);
      }}
    />
  );
}
```

### Shopify App Bridge

```tsx
import { ShopifyApp, useShopifyAppBridge } from "@settler/react-settler";

function App() {
  const { shop, apiKey, setApiKey } = useShopifyAppBridge();

  return <ShopifyApp shop={shop} apiKey={apiKey} transactions={transactions} />;
}
```

## Stripe Connect Integration

Integrate with Stripe Connect apps.

```tsx
import { StripeApp } from "@settler/react-settler";

function MyStripeApp() {
  return (
    <StripeApp
      accountId="acct_1234567890"
      transactions={transactions}
      exceptions={exceptions}
      onExport={(format, data) => {
        // Handle export
      }}
    />
  );
}
```

## Webhook Integration

React.Settler includes webhook utilities for real-time updates.

### Basic Webhook Manager

```tsx
import { createWebhookManager } from "@settler/react-settler";

const webhookManager = createWebhookManager("your-secret");

// Subscribe to events
webhookManager.on("transaction.created", async (payload) => {
  console.log("New transaction:", payload.data);
});

// Emit events
await webhookManager.emit("transaction.created", transactionData);
```

### Shopify Webhooks

```tsx
import { createShopifyWebhookAdapter } from "@settler/react-settler";

const adapter = createShopifyWebhookAdapter("shopify-secret");

// Handle Shopify webhook
await adapter.handleShopifyWebhook({
  id: "webhook-id",
  event: "orders/create",
  data: orderData,
});

// Subscribe to reconciliation events
adapter.manager.on("transaction.created", async (payload) => {
  // Handle event
});
```

### Stripe Webhooks

```tsx
import { createStripeWebhookAdapter } from "@settler/react-settler";

const adapter = createStripeWebhookAdapter("stripe-secret");

// Handle Stripe webhook
await adapter.handleStripeWebhook({
  id: "evt_123",
  type: "charge.succeeded",
  data: { object: chargeData },
});
```

## Mobile Integration

React.Settler includes mobile-optimized components.

### Mobile Dashboard

```tsx
import { MobileDashboard } from "@settler/react-settler";

function App() {
  return (
    <MobileDashboard
      transactions={transactions}
      exceptions={exceptions}
      onTransactionSelect={(tx) => {
        // Navigate to detail view
      }}
      onExceptionResolve={(exc) => {
        // Handle resolution
      }}
    />
  );
}
```

### Responsive Utilities

```tsx
import { useBreakpoint, useIsMobile, useIsTablet, useIsDesktop } from "@settler/react-settler";

function ResponsiveComponent() {
  const breakpoint = useBreakpoint();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();

  if (isMobile) {
    return <MobileView />;
  }

  return <DesktopView />;
}
```

## API Adapters

### Custom Backend Integration

```tsx
import { ReconciliationDashboard, compileToJSON } from "@settler/react-settler";

// Compile workflow
const workflow = (
  <ReconciliationDashboard>
    <RuleSet id="rules-1" name="My Rules">
      <MatchRule id="rule-1" name="Amount Match" field="amount" type="exact" />
    </RuleSet>
  </ReconciliationDashboard>
);

const jsonConfig = compileToJSON(workflow);

// Send to your backend
await fetch("https://your-api.com/reconciliation/configs", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: jsonConfig,
});
```

## Best Practices

1. **Webhook Security**: Always verify webhook signatures
2. **Mobile First**: Use responsive utilities for mobile support
3. **Error Handling**: Wrap integrations in ErrorBoundary
4. **Telemetry**: Track integration events for monitoring
5. **Validation**: Validate all data from external sources
