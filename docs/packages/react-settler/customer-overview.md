# React.Settler Protocol - Customer Overview

## What is React.Settler?

React.Settler is an open-source React component library that enables developers to build reconciliation workflows declaratively. Similar to how `react-email` lets you compose emails with React components, React.Settler lets you define payment reconciliation UIs and rules using familiar React patterns.

## Key Benefits

### 🎯 **Declarative Workflows**
Define reconciliation rules and UIs using React components, not complex configuration files.

### 🔄 **Backend Agnostic**
Compile React components to JSON configs that work with any reconciliation backend, not just Settler.

### 🎨 **Customizable UI**
Build reconciliation dashboards that match your brand and user experience requirements.

### 📦 **Open Source**
MIT licensed - use freely in your projects, contribute improvements, or fork for your needs.

## Use Cases

### E-commerce Platforms
Reconcile Stripe, PayPal, and Square payments with bank deposits automatically.

### SaaS Applications
Match subscription payments with accounting system entries for accurate financial reporting.

### Marketplaces
Reconcile marketplace payouts with individual seller settlements across multiple payment providers.

### Fintech Companies
Build custom reconciliation workflows for complex multi-gateway payment scenarios.

## How It Works

1. **Define Workflows** - Use React components to define reconciliation rules and UI layouts
2. **Render UI** - Components render as interactive dashboards with live data
3. **Compile Config** - Extract JSON configuration for backend reconciliation engines
4. **Execute** - Backend processes reconciliation using compiled rules

## Example

```tsx
import { ReconciliationDashboard, RuleSet, MatchRule } from '@settler/react-settler';

const workflow = (
  <ReconciliationDashboard>
    <RuleSet id="rules-1" name="Payment Matching" priority="exact-first">
      <MatchRule
        id="rule-1"
        name="Exact Amount Match"
        field="amount"
        type="exact"
      />
      <MatchRule
        id="rule-2"
        name="Date Range Match"
        field="date"
        type="range"
        tolerance={{ days: 7 }}
      />
    </RuleSet>
  </ReconciliationDashboard>
);
```

## Integration

React.Settler works with:
- ✅ Settler's reconciliation engine (proprietary)
- ✅ Your own custom reconciliation backend
- ✅ Any backend that consumes the protocol JSON schema

## Getting Started

```bash
npm install @settler/react-settler @settler/protocol
```

See [README.md](../README.md) for complete documentation and examples.

## License

MIT License - Free for commercial and personal use.
